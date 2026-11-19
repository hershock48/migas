/**
 * A local stand-in for the Vercel Blob store, in memory, for tools/pay-check.mjs.
 * The site's storage SDK is pointed at it with VERCEL_BLOB_API_URL.
 *
 * It does the three things the site does with storage (put, list, delete)
 * and serves the stored files, and it can misbehave in the two ways the real
 * store does that the payment code has to survive:
 *
 *  - cdnLagMs: for that long after a file is overwritten or deleted, its
 *    address still serves the previous copy, as the real store's CDN does for
 *    up to a minute. The listing is never stale, as on the real store.
 *  - holdPut: make a write take a chosen time to land, to line two bookings
 *    up against each other on purpose.
 *
 * Nothing here is used by the site itself. It is never deployed.
 */
import http from "node:http";

const readBody = (req) =>
  new Promise((resolve) => {
    const chunks = [];
    req.on("data", (c) => chunks.push(c));
    req.on("end", () => resolve(Buffer.concat(chunks)));
  });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export function startBlobStandin({ port = 4599 } = {}) {
  const base = `http://127.0.0.1:${port}`;
  /** pathname -> { body, type, at, prev? } */
  const files = new Map();
  /** Deleted files the "CDN" is still serving: pathname -> { body, type, until } */
  const lingering = new Map();
  const standin = {
    base,
    files,
    cdnLagMs: 0,
    /** (pathname) => milliseconds to wait before the write lands, or nothing. */
    holdPut: null,
    /** Read one stored JSON file by the start of its name. */
    json: (prefix) => {
      const hit = [...files].find(([name]) => name.startsWith(prefix));
      return hit ? JSON.parse(hit[1].body.toString("utf8")) : null;
    },
    /** Change one stored JSON file in place, as if it had always been so. */
    patch: (prefix, change) => {
      const hit = [...files].find(([name]) => name.startsWith(prefix));
      if (!hit) throw new Error(`nothing stored under ${prefix}`);
      hit[1].body = Buffer.from(JSON.stringify({ ...JSON.parse(hit[1].body.toString("utf8")), ...change }));
      delete hit[1].prev;
    },
    names: (prefix = "") => [...files.keys()].filter((n) => n.startsWith(prefix)).sort(),
    clear: () => {
      files.clear();
      lingering.clear();
    },
    close: () => new Promise((r) => server.close(r)),
  };
  const fileUrl = (pathname) => `${base}/f/${pathname}`;

  const server = http.createServer(async (req, res) => {
    const url = new URL(req.url, base);
    const body = await readBody(req);
    const json = (status, obj) => {
      res.writeHead(status, { "content-type": "application/json" });
      res.end(JSON.stringify(obj));
    };

    // The "CDN": a stored file by its address.
    if (req.method === "GET" && url.pathname.startsWith("/f/")) {
      const pathname = decodeURIComponent(url.pathname.slice(3));
      const now = Date.now();
      const f = files.get(pathname);
      const gone = lingering.get(pathname);
      const serve = f ? (f.prev && now < f.prev.until ? { ...f, body: f.prev.body } : f) : gone && now < gone.until ? gone : null;
      if (!serve) {
        res.writeHead(404);
        return res.end();
      }
      res.writeHead(200, { "content-type": serve.type });
      return res.end(serve.body);
    }

    if (req.method === "PUT" && url.pathname === "/") {
      const pathname = url.searchParams.get("pathname") ?? "";
      const wait = standin.holdPut?.(pathname);
      if (wait) await sleep(wait);
      const had = files.get(pathname);
      if (had && req.headers["x-allow-overwrite"] !== "1") {
        return json(400, { error: { code: "bad_request", message: "This blob already exists, use allowOverwrite: true to overwrite it." } });
      }
      const type = String(req.headers["x-content-type"] ?? "application/octet-stream");
      files.set(pathname, {
        body,
        type,
        at: new Date(),
        ...(had && standin.cdnLagMs ? { prev: { body: had.body, until: Date.now() + standin.cdnLagMs } } : {}),
      });
      lingering.delete(pathname);
      return json(200, { url: fileUrl(pathname), downloadUrl: `${fileUrl(pathname)}?download=1`, pathname, contentType: type, contentDisposition: "inline" });
    }

    if (req.method === "GET" && url.pathname === "/") {
      const prefix = url.searchParams.get("prefix") ?? "";
      const limit = Number(url.searchParams.get("limit") ?? 1000);
      const blobs = standin
        .names(prefix)
        .slice(0, limit)
        .map((pathname) => {
          const f = files.get(pathname);
          return { url: fileUrl(pathname), downloadUrl: `${fileUrl(pathname)}?download=1`, pathname, size: f.body.length, uploadedAt: f.at.toISOString() };
        });
      return json(200, { blobs, hasMore: false });
    }

    if (req.method === "POST" && url.pathname === "/delete") {
      const { urls = [] } = JSON.parse(body.toString("utf8") || "{}");
      for (const u of urls) {
        const pathname = decodeURIComponent(String(u).replace(`${base}/f/`, ""));
        const f = files.get(pathname);
        if (f && standin.cdnLagMs) lingering.set(pathname, { body: f.body, type: f.type, until: Date.now() + standin.cdnLagMs });
        files.delete(pathname);
      }
      return json(200, {});
    }

    json(404, { error: { code: "not_found", message: "The stand-in does not do that." } });
  });

  return new Promise((resolve) => server.listen(port, "127.0.0.1", () => resolve(standin)));
}
