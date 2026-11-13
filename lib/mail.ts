import "server-only";

import nodemailer from "nodemailer";

/**
 * Mail, over SMTP, through a mailbox he already owns. Moved out of
 * app/actions.ts so the reminder cron can send without importing a "use
 * server" file (every export of one of those becomes a callable action; a
 * mailer must not be one).
 *
 * Credentials come from the environment and are set in the hosting dashboard,
 * never in the code. Until SMTP_HOST and SMTP_FROM exist, nothing is sent and
 * the full message is written to the server log so it is never lost.
 */

export type Attachment = { filename: string; content: Buffer; contentType?: string };

function transport() {
  const host = process.env.SMTP_HOST;
  if (!host) return null;
  const port = Number(process.env.SMTP_PORT ?? 587);
  return nodemailer.createTransport({
    host,
    port,
    // 465 is implicit TLS; 587 starts plaintext and upgrades with STARTTLS. Getting this
    // backwards is the single most common SMTP misconfiguration and it fails by hanging.
    secure: port === 465,
    auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
    // nodemailer waits two minutes for a host that never answers, far past the
    // point where the visitor's booking request has timed out. A wrong host or a
    // blocked port now fails in seconds, and the booking still completes.
    connectionTimeout: 8_000,
    greetingTimeout: 8_000,
    socketTimeout: 20_000,
  });
}

type Mail = {
  to: string;
  subject: string;
  text: string;
  attachments?: Attachment[];
  /** Who a reply should reach. On his copy of a booking this is the grower, so
   *  "confirm by reply" is one tap; without it a reply went back to his own mailbox,
   *  because his notifications are sent from it. */
  replyTo?: string;
};

export const mailConfigured = () =>
  Boolean(process.env.SMTP_HOST && (process.env.SMTP_FROM ?? process.env.SMTP_USER));

export async function sendMail(opts: Mail): Promise<boolean> {
  return (await sendMailChecked(opts)).ok;
}

/** sendMail, with the reason when it fails. /admin's test button shows the reason
 *  to the signed-in owner; nothing else should. */
export async function sendMailChecked(opts: Mail): Promise<{ ok: boolean; error?: string }> {
  const t = transport();
  const from = process.env.SMTP_FROM ?? process.env.SMTP_USER;
  if (!t || !from || opts.to.startsWith("PLACEHOLDER")) {
    console.warn(
      `[migas] Not sent: SMTP_HOST/SMTP_FROM unset, or recipient is a placeholder.\n` +
        `to: ${opts.to}\nsubject: ${opts.subject}\n${opts.text}\n` +
        `attachments: ${(opts.attachments ?? []).map((a) => a.filename).join(", ") || "none"}`
    );
    return { ok: false, error: !t || !from ? "Outgoing mail is not set up yet." : "There is no real address to send to yet." };
  }
  try {
    await t.sendMail({ from, ...opts });
    return { ok: true };
  } catch (err) {
    // Logged, not surfaced. The visitor has already done their part correctly.
    console.error("[migas] SMTP send failed", err);
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

/** Where his copy of everything goes. Falls back to the site's own address, which is a placeholder until he supplies one. */
export function notifyTo(fallback: string): string {
  return process.env.MIGAS_NOTIFY_TO ?? fallback;
}
