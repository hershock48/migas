/**
 * A local stand-in for the part of Stripe that lib/pay.ts talks to, so the
 * card step can be run end to end with no Stripe account and no key.
 *
 * It answers the three API calls the site makes:
 *
 *   POST /v1/checkout/sessions              open a payment page
 *   GET  /v1/checkout/sessions/:id          is it open, paid or ended
 *   POST /v1/checkout/sessions/:id/expire   close it
 *
 * and it serves the "hosted payment page" each session's url points at: a
 * page with a Pay button and a Back link. Pay marks the session paid, sends
 * the site a signed checkout.session.completed notice the way Stripe does,
 * and returns the visitor to the session's success address. Back goes to the
 * cancel address.
 *
 * It keeps Stripe's own rules where the site could get them wrong: a session
 * must end between thirty minutes and a day after it is made, only an open
 * session can be expired, an ended one has no url. It refuses anything that
 * looks like a live key, so a real key can never be aimed at it by mistake
 * and then appear to work.
 *
 * Run it by itself to click through a booking by hand:
 *
 *   node tools/stripe-standin.mjs
 *
 * and start the site with STRIPE_API_BASE=http://127.0.0.1:4598, any key
 * that starts sk_test_, and the same STRIPE_WEBHOOK_SECRET as below.
 * tools/pay-check.mjs starts it in-process and drives it with a browser.
 *
 * Nothing here is used by the site itself. It is never deployed.
 */
import { createHmac, randomBytes } from "node:crypto";
import http from "node:http";
import { pathToFileURL } from "node:url";

const readBody = (req) =>
  new Promise((resolve) => {
    const chunks = [];
    req.on("data", (c) => chunks.push(c));
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
  });

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

export function startStripeStandin({
  port = 4598,
  /** Where the paid notice is posted: the site's /api/stripe/webhook. */
  webhookUrl = "http://127.0.0.1:3011/api/stripe/webhook",
  webhookSecret = "whsec_local_test_only",
  /**
   * The site builds its return addresses on its public host (SITE.url). When
   * the site under test is on localhost, set this to its origin and the
   * visitor is returned there instead, same path and query. The addresses
   * the site asked for are kept on the session untouched, for checking.
   */
  returnOrigin = "",
} = {}) {
  const base = `http://127.0.0.1:${port}`;
  /** id -> session. Plain objects shaped like Stripe's, plus what we need to act on them. */
  const sessions = new Map();
  const standin = {
    base,
    sessions,
    /** Every API call received, in order: { method, path }. */
    calls: [],
    /** Notices posted to the site, with the status it answered. */
    webhooks: [],
    /**
     * Let time pass for every session made so far: a day, and each open one
     * has ended. The sessions are aged rather than the clock moved, because
     * the site keeps its own clock and its next request must still agree
     * with this one about what time it is.
     */
    passTime: (seconds) => {
      for (const s of sessions.values()) {
        s.created -= seconds;
        s.expires_at -= seconds;
      }
    },
    /** Set true and every API call fails like an outage, until it is set false again. */
    down: false,
    /** Post the paid notice for a session by hand, for a notice that arrives late. */
    notify: (id) => notify(sessions.get(id)),
    /** Set true and a completed payment sends no notice, like a webhook that is down. */
    muteWebhook: false,
    /** Awaited after a session is made and before the site is answered. For testing what happens in that gap. */
    onCreate: null,
    close: () => new Promise((r) => server.close(r)),
  };
  const now = () => Math.floor(Date.now() / 1000);

  /** A session ends by the clock without anyone telling it to, as on Stripe. */
  const current = (s) => {
    if (s.status === "open" && s.expires_at <= now()) s.status = "expired";
    return s;
  };
  const publicView = (s) => ({
    id: s.id,
    object: "checkout.session",
    status: s.status,
    payment_status: s.payment_status,
    url: s.status === "open" ? s.url : null,
    expires_at: s.expires_at,
    amount_total: s.amount_total,
    currency: "usd",
    customer_email: s.customer_email,
    client_reference_id: s.client_reference_id,
    metadata: s.metadata,
    success_url: s.success_url,
    cancel_url: s.cancel_url,
  });
  const returnTo = (address) => {
    if (!returnOrigin) return address;
    const u = new URL(address);
    return `${returnOrigin}${u.pathname}${u.search}${u.hash}`;
  };

  async function notify(s) {
    const payload = JSON.stringify({ id: `evt_${randomBytes(8).toString("hex")}`, type: "checkout.session.completed", data: { object: publicView(s) } });
    const t = Math.floor(Date.now() / 1000);
    const v1 = createHmac("sha256", webhookSecret).update(`${t}.${payload}`).digest("hex");
    try {
      const res = await fetch(webhookUrl, { method: "POST", headers: { "content-type": "application/json", "stripe-signature": `t=${t},v1=${v1}` }, body: payload });
      standin.webhooks.push({ id: s.id, status: res.status, answer: await res.text() });
    } catch (err) {
      standin.webhooks.push({ id: s.id, status: 0, answer: String(err) });
    }
  }

  const server = http.createServer(async (req, res) => {
    const url = new URL(req.url, base);
    const body = await readBody(req);
    const json = (status, obj) => {
      res.writeHead(status, { "content-type": "application/json" });
      res.end(JSON.stringify(obj));
    };
    const fail = (status, code, message) => json(status, { error: { type: "invalid_request_error", code, message } });
    const html = (status, inner) => {
      res.writeHead(status, { "content-type": "text/html; charset=utf-8" });
      res.end(`<!doctype html><meta charset="utf-8"><title>Stand-in payment page</title><body style="font:16px system-ui;max-width:32rem;margin:4rem auto;padding:0 1rem">${inner}</body>`);
    };

    /* ── the API ── */
    if (url.pathname.startsWith("/v1/")) {
      standin.calls.push({ method: req.method, path: url.pathname });
      const key = (req.headers.authorization ?? "").replace(/^Bearer\s+/i, "");
      // Never echo the key back, in an error or anywhere else.
      if (!key) return fail(401, "api_key_missing", "No API key provided.");
      if (/^(sk|rk)_live/.test(key)) return fail(401, "api_key_invalid", "This is a local stand-in. It does not take live keys.");
      if (!/^(sk|rk)_test_/.test(key)) return fail(401, "api_key_invalid", "Invalid API key provided.");

      if (standin.down) return json(503, { error: { type: "api_error", message: "The stand-in was told to be down." } });

      if (req.method === "POST" && url.pathname === "/v1/checkout/sessions") {
        const p = new URLSearchParams(body);
        const need = ["mode", "success_url", "line_items[0][price_data][unit_amount]", "line_items[0][price_data][currency]", "line_items[0][quantity]"];
        for (const k of need) if (!p.get(k)) return fail(400, "parameter_missing", `Missing required param: ${k}.`);
        const made = now();
        const ends = p.get("expires_at") ? Number(p.get("expires_at")) : made + 86_400;
        // Stripe's rule, with a few seconds of grace for the two clocks.
        if (!Number.isInteger(ends) || ends < made + 1800 - 5 || ends > made + 86_400 + 5) {
          return fail(400, "parameter_invalid_integer", "The `expires_at` timestamp must be between 30 minutes and 24 hours after Checkout Session creation.");
        }
        const id = `cs_test_${randomBytes(24).toString("base64url").replace(/[^A-Za-z0-9]/g, "")}`;
        const s = {
          id,
          status: "open",
          payment_status: "unpaid",
          url: `${base}/pay/${id}`,
          created: made,
          expires_at: ends,
          amount_total: Number(p.get("line_items[0][price_data][unit_amount]")) * Number(p.get("line_items[0][quantity]")),
          item: p.get("line_items[0][price_data][product_data][name]") ?? "",
          customer_email: p.get("customer_email"),
          client_reference_id: p.get("client_reference_id"),
          metadata: Object.fromEntries([...p].filter(([k]) => k.startsWith("metadata[")).map(([k, v]) => [k.slice(9, -1), v])),
          success_url: p.get("success_url"),
          cancel_url: p.get("cancel_url"),
        };
        sessions.set(id, s);
        if (standin.onCreate) await standin.onCreate(s);
        return json(200, publicView(s));
      }

      const one = /^\/v1\/checkout\/sessions\/([^/]+)(\/expire)?$/.exec(url.pathname);
      if (one) {
        const s = sessions.get(decodeURIComponent(one[1]));
        if (!s) return fail(404, "resource_missing", "No such checkout.session.");
        current(s);
        if (!one[2] && req.method === "GET") return json(200, publicView(s));
        if (one[2] && req.method === "POST") {
          if (s.status !== "open") return fail(400, "checkout_session_not_open", `Only Checkout Sessions with a status in ["open"] can be expired. This one is ${s.status}.`);
          s.status = "expired";
          return json(200, publicView(s));
        }
      }
      return fail(404, "url_invalid", `Unrecognized request URL (${req.method}: ${url.pathname}).`);
    }

    /* ── the hosted payment page ── */
    const page = /^\/pay\/([^/]+)(\/complete)?$/.exec(url.pathname);
    if (page) {
      const s = sessions.get(page[1]);
      if (!s) return html(404, "<h1>Not found</h1>");
      current(s);
      if (s.status === "expired") return html(410, `<h1 id="state">This payment page has expired</h1><p>Nothing can be paid here.</p>`);
      if (s.status === "complete") return html(200, `<h1 id="state">This has already been paid</h1><p><a id="return" href="${esc(returnTo(s.success_url))}">Return to the site</a></p>`);
      if (!page[2]) {
        return html(
          200,
          `<h1 id="state">Stand-in payment page</h1>
           <p id="item">${esc(s.item)}</p>
           <p>Amount: <strong id="amount">$${(s.amount_total / 100).toFixed(2)}</strong></p>
           <p>Email: <span id="email">${esc(s.customer_email ?? "")}</span></p>
           <form method="post" action="/pay/${s.id}/complete"><button id="pay" type="submit">Pay</button></form>
           <p><a id="back" href="${esc(returnTo(s.cancel_url ?? s.success_url))}">Back</a></p>`,
        );
      }
      if (req.method === "POST") {
        s.status = "complete";
        s.payment_status = "paid";
        if (!standin.muteWebhook) await notify(s);
        res.writeHead(303, { location: returnTo(s.success_url) });
        return res.end();
      }
    }
    html(404, "<h1>Not found</h1>");
  });

  return new Promise((resolve) => server.listen(port, "127.0.0.1", () => resolve(standin)));
}

// Run directly: node tools/stripe-standin.mjs
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const port = Number(process.env.PORT ?? 4598);
  const site = process.env.SITE_ORIGIN ?? "http://127.0.0.1:3011";
  await startStripeStandin({
    port,
    webhookUrl: `${site}/api/stripe/webhook`,
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET ?? "whsec_local_test_only",
    returnOrigin: site,
  });
  console.log(`Stripe stand-in on http://127.0.0.1:${port}, returning visitors and notices to ${site}`);
}
