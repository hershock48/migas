"use server";

import nodemailer from "nodemailer";
import { headers } from "next/headers";
import { agreement, money, type AcceptState, type AgreementAcceptance } from "@/lib/agreement";

/**
 * Where the acceptance lands. Clickwrap, the same mechanism as the DeVine and Anchor
 * orders and the glazedweb menu-order flow: he reads the published v1.1 terms plus the
 * Exhibit A on the page, types his name, ticks the box, and THE EMAIL IS THE RECORD.
 * Both parties get a copy carrying the version string, the exhibit, the typed name and
 * title, and the server's timestamp.
 *
 * A server action rather than a route handler, because every form on this site posts
 * to one (app/actions.ts says why: it submits natively with JavaScript off). It does
 * not share app/actions.ts's sendMail, and that is not duplication for its own sake:
 * exporting sendMail from a "use server" file would make it a public endpoint any
 * browser could call with any recipient. The transport here is the same shape, over
 * the same SMTP variables, and it is private to this file.
 *
 * The record goes to AGREEMENT_TO, never MIGAS_NOTIFY_TO. The notify address is his
 * inbox at launch, and a countersignature record that lands on the other party's desk
 * instead of Kevin's is the wrong kind of surprise. The fallback is Kevin's address
 * from the proposal's footer.
 *
 * Honesty states mirror the booking: the full record is logged before anything can
 * fail, and when mail cannot be sent the page hands him a prefilled mailto carrying the
 * same acceptance text rather than a false "you're all set."
 */

const RECORD_TO = "kevin@glazedweb.com";

const str = (fd: FormData, key: string, max: number) => String(fd.get(key) ?? "").trim().slice(0, max);

const emailLooksReal = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);

function recordText(a: AgreementAcceptance): string {
  return [
    `AGREEMENT ACCEPTED`,
    ``,
    `${a.version}`,
    `${a.exhibit}`,
    ``,
    `Provider:    ${agreement.provider} (Kevin Hershock)`,
    `Business:    ${a.business}`,
    `Accepted by: ${a.name}${a.title ? `, ${a.title}` : ""}`,
    `Email:       ${a.email}`,
    `Accepted at: ${a.acceptedAt} (server time)`,
    `Record id:   ${a.id}`,
    `From IP:     ${a.ip}`,
    ``,
    `Terms: ${agreement.termsUrl} (v1.1), incorporated by reference.`,
    `Exhibit A as shown at migas.glazedweb.com/agreement on the acceptance date:`,
    ``,
    `  Build fee ${money(agreement.buildFee)}, deposit ${money(agreement.deposit)} due on acceptance,`,
    `  balance on launch. Monthly service fee ${money(agreement.monthly)} from the first of the`,
    `  month after launch, including hosting, SSL, security updates, backups and the`,
    `  availability editor. Edit allowance ${agreement.editAllowance}. Additional work`,
    `  ${money(agreement.hourlyRate)}/hour, quoted and approved in advance. The site takes no`,
    `  payment and no payment terms apply. ${agreement.timeline}`,
    ``,
    ...agreement.scope.map((s, i) => `  Scope ${i + 1}. ${s}`),
    `  Not included: ${agreement.notIncluded}`,
    ``,
    `  Payments (Exhibit A, part 3): ${agreement.noPayments}`,
  ].join("\n");
}

function transport() {
  const host = process.env.SMTP_HOST;
  if (!host) return null;
  const port = Number(process.env.SMTP_PORT ?? 587);
  return nodemailer.createTransport({
    host,
    port,
    // 465 is implicit TLS; 587 upgrades with STARTTLS. Backwards fails by hanging.
    secure: port === 465,
    auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
  });
}

export async function acceptAgreement(_prev: AcceptState, fd: FormData): Promise<AcceptState> {
  // Honeypot, as on every other form here. A bot that fills it gets a quiet "idle"
  // and never learns why: no record, no email, nothing to tune against.
  if (str(fd, "_trap", 10)) return { status: "idle" };

  const values = {
    name: str(fd, "name", 120),
    title: str(fd, "title", 120),
    business: str(fd, "business", 160) || agreement.client,
    email: str(fd, "email", 200),
  };
  const agreed = fd.get("agreed") === "on";

  if (!agreed) return { status: "error", error: "The agreement box was not checked.", values };
  if (values.name.length < 2) return { status: "error", error: "A full name is required.", values };
  if (!emailLooksReal(values.email)) {
    return { status: "error", error: "A working email is required; your copy of the record goes there.", values };
  }

  const h = await headers();
  const acceptance: AgreementAcceptance = {
    id: `AGR-${crypto.randomUUID().slice(0, 8).toUpperCase()}`,
    ...values,
    acceptedAt: new Date().toISOString(),
    version: agreement.version,
    exhibit: agreement.exhibit,
    ip: h.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown",
    userAgent: (h.get("user-agent") ?? "").slice(0, 300),
  };

  const text = recordText(acceptance);
  // The log carries the whole record before anything can fail. There is no database
  // row (lib/agreement.ts says why), so this line and the email are the record.
  console.log(`[migas] agreement acceptance ${acceptance.id}:\n${text}`);

  const t = transport();
  const from = process.env.SMTP_FROM ?? process.env.SMTP_USER;
  const to = process.env.AGREEMENT_TO || RECORD_TO;
  if (!t || !from) {
    console.warn(`[migas] acceptance ${acceptance.id} NOT emailed: SMTP_HOST/SMTP_FROM unset.`);
    return { status: "fallback", record: text };
  }

  // Glazed's copy decides success; it is the countersignature record.
  try {
    await t.sendMail({
      from,
      to,
      replyTo: values.email,
      subject: `Agreement accepted: ${values.business} (${agreement.version})`,
      text,
    });
  } catch (err) {
    console.error(`[migas] acceptance ${acceptance.id} send FAILED:`, err);
    return { status: "fallback", record: text };
  }

  // His copy is best-effort (the acceptance already stands either way) but it is
  // AWAITED, because fire-and-forget dies on serverless: the function freezes the
  // moment the response returns, and DeVine's first live test delivered exactly one
  // of the two emails that way.
  try {
    await t.sendMail({
      from,
      to: values.email,
      replyTo: to,
      subject: `Your signed copy: ${agreement.version}, ${values.business}`,
      text:
        `This is your record of acceptance. Keep this email.\n\n${text}\n\n` +
        `The full terms: ${agreement.termsUrl}\nPDF copy: ${agreement.pdfUrl}`,
    });
  } catch (err) {
    console.error(`[migas] acceptance ${acceptance.id} client copy not sent:`, err);
  }

  return { status: "sent" };
}
