/**
 * A mail server that sends nothing. It accepts whatever the site hands it
 * over SMTP and keeps it in memory, so tools/pay-check.mjs can read the
 * confirmation and the reminder the way the grower would and follow the link
 * that is actually in them.
 *
 * Just enough SMTP for nodemailer (no TLS, no sign-in), and just enough MIME
 * to get the plain-text body out of a message that may carry attachments.
 *
 * Nothing here is used by the site itself. It is never deployed.
 */
import net from "node:net";

const unQuoted = (s) => s.replace(/=\r?\n/g, "").replace(/=([0-9A-F]{2})/gi, (_, h) => String.fromCharCode(parseInt(h, 16)));

/** One MIME entity: its headers, and its text if it is text. Walks into multiparts. */
function read(raw, out) {
  const cut = raw.indexOf("\r\n\r\n");
  const head = (cut < 0 ? raw : raw.slice(0, cut)).replace(/\r\n[ \t]+/g, " ");
  const body = cut < 0 ? "" : raw.slice(cut + 4);
  const h = {};
  for (const line of head.split("\r\n")) {
    const i = line.indexOf(":");
    if (i > 0) h[line.slice(0, i).toLowerCase()] = line.slice(i + 1).trim();
  }
  const type = h["content-type"] ?? "text/plain";
  const boundary = /boundary="?([^";]+)"?/i.exec(type)?.[1];
  if (boundary) {
    for (const part of body.split(`--${boundary}`).slice(1, -1)) read(part.replace(/^\r\n/, ""), out);
    return h;
  }
  const name = /filename="?([^";]+)"?/i.exec(h["content-disposition"] ?? "")?.[1];
  if (name) out.attachments.push(name);
  else if (/^text\/plain/i.test(type) && out.text === undefined) {
    const how = (h["content-transfer-encoding"] ?? "7bit").toLowerCase();
    const bytes = how === "base64" ? Buffer.from(body, "base64") : Buffer.from(how === "quoted-printable" ? unQuoted(body) : body, "latin1");
    out.text = bytes.toString("utf8").replace(/\r\n/g, "\n").trim();
  }
  return h;
}

export function startSmtpSink({ port = 2525 } = {}) {
  /** Each message: { to: [addresses], subject, text, attachments: [file names] } */
  const messages = [];
  const sink = {
    messages,
    to: (address) => messages.filter((m) => m.to.includes(address)),
    close: () => new Promise((r) => server.close(r)),
  };

  const server = net.createServer((sock) => {
    sock.setEncoding("latin1");
    let buf = "";
    let inData = false;
    let to = [];
    const say = (line) => sock.write(`${line}\r\n`);
    say("220 sink ready");
    sock.on("error", () => {});
    sock.on("data", (chunk) => {
      buf += chunk;
      for (;;) {
        if (inData) {
          const end = buf.indexOf("\r\n.\r\n");
          if (end < 0) return;
          // A line that starts with a dot is sent with a second dot in front.
          const raw = buf.slice(0, end).replace(/\r\n\.\./g, "\r\n.");
          buf = buf.slice(end + 5);
          inData = false;
          const out = { to, attachments: [] };
          const h = read(raw, out);
          messages.push({ to, subject: h.subject ?? "", text: out.text ?? "", attachments: out.attachments });
          to = [];
          say("250 kept");
          continue;
        }
        const nl = buf.indexOf("\r\n");
        if (nl < 0) return;
        const line = buf.slice(0, nl);
        buf = buf.slice(nl + 2);
        const verb = line.slice(0, 4).toUpperCase();
        if (verb === "EHLO" || verb === "HELO") say("250 sink");
        else if (verb === "RCPT") {
          to.push(/<([^>]+)>/.exec(line)?.[1] ?? line.slice(8).trim());
          say("250 ok");
        } else if (verb === "DATA") {
          inData = true;
          say("354 go on");
        } else if (verb === "QUIT") {
          say("221 bye");
          sock.end();
        } else say("250 ok");
      }
    });
  });

  return new Promise((resolve) => server.listen(port, "127.0.0.1", () => resolve(sink)));
}
