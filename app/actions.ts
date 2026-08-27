"use server";

import nodemailer from "nodemailer";
import { INTAKE, SESSIONS, SITE } from "@/lib/site";
import { PHOTO_LIMITS, type FormState } from "@/lib/forms";
import { describeSlot } from "@/lib/slots";
import { bookableSlot } from "@/lib/availability";
import { buildIcs, icsDataUrl } from "@/lib/ics";

/**
 * Every form on the site posts to one of these server actions. There used to be four;
 * the restock list went with the shop and the guide request went with the guide pages,
 * both on the owner's 2026-08-27 direction.
 *
 * WHY SERVER ACTIONS AND NOT A FETCH. A server action attached with
 * `<form action={...}>` submits natively when JavaScript has not loaded, failed, or
 * been switched off. The step-by-step wizard in components/Booking.tsx is a layer on
 * top of a form that already works without it — so a blocked script downgrades the
 * booking to one long form rather than to a dead button. That is the whole reason the
 * flow is not a fetch-and-render single-page thing.
 *
 * NOTHING HERE IS RENTED. Mail goes out over plain SMTP through whatever mailbox he
 * already pays for, using nodemailer — MIT, free, no vendor, no account, no per-message
 * price, nothing that can raise a bill or change its terms. The first version of this file
 * posted to a hosted email API, which meant the site could not deliver a booking without a
 * third party's key and a third party's free-tier ceiling. That was the wrong shape for a
 * one-man business, and it is gone.
 *
 * The photos ride along as MIME attachments on the same email, which is the other thing that
 * removal fixed. There is no object store, no bucket, no signed upload URL and no storage
 * bill, because a photo of a sick canopy has exactly one consumer — him — and he is already
 * being sent a message. The brief and the pictures arrive together in his inbox, which is
 * better than a link to a bucket anyway.
 *
 * WHAT IS DELIBERATELY NOT HERE.
 *
 * No card is taken. That is not laziness, it is unresolved: Stripe's published
 * restricted-business list prohibits "Courses and information on cultivating
 * marijuana", and Calendly, Acuity and Setmore all settle through Stripe, Square or
 * PayPal. Which processor a cannabis-education business can actually use is a question
 * for him and whoever underwrites him, and building a checkout against the wrong answer
 * wastes the work twice. A booking request therefore reaches him and he invoices.
 *
 * VALIDATION IS SERVER-SIDE AND MEANT IT. The client validates too, for speed, but
 * every rule below is enforced here, because the no-JS path can genuinely post a slot
 * too short for a 90-minute consult and a determined visitor can post anything at all.
 */

const str = (fd: FormData, key: string) => String(fd.get(key) ?? "").trim();

/** Deliberately permissive. A regex that rejects a valid address is worse than one that
 *  accepts an invalid one, because the second costs a bounce and the first costs a
 *  client who cannot work out why the button will not go. */
const emailLooksReal = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);

const reference = () => `MG-${crypto.randomUUID().slice(0, 6).toUpperCase()}`;

/**
 * Mail, over SMTP, through a mailbox he already owns.
 *
 * Credentials come from the environment and are set in the hosting dashboard — never in the
 * repo, never in a commit. If SMTP is not configured the submission still SUCCEEDS for the
 * visitor and the whole brief is written to the server log, because a form that reports
 * "something went wrong" when the real fault is an unset environment variable teaches people
 * that the form does not work. It does work; the delivery is what is missing, and that is the
 * operator's problem to see in the logs, not the visitor's to puzzle over.
 *
 * Stated plainly for whoever deploys this: with no SMTP_HOST, bookings exist only in the
 * server log. Set it before anyone real uses the site.
 */
type Attachment = { filename: string; content: Buffer; contentType?: string };

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
    auth: process.env.SMTP_USER
      ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
      : undefined,
  });
}

async function sendMail(opts: {
  to: string;
  subject: string;
  text: string;
  attachments?: Attachment[];
}) {
  const t = transport();
  const from = process.env.SMTP_FROM ?? process.env.SMTP_USER;
  if (!t || !from || opts.to.startsWith("PLACEHOLDER")) {
    console.warn(
      `[migas] Not sent: SMTP_HOST/SMTP_FROM unset, or recipient is a placeholder.\n` +
        `to: ${opts.to}\nsubject: ${opts.subject}\n${opts.text}\n` +
        `attachments: ${(opts.attachments ?? []).map((a) => a.filename).join(", ") || "none"}`
    );
    return false;
  }
  try {
    await t.sendMail({ from, ...opts });
    return true;
  } catch (err) {
    // Logged, not surfaced. The visitor has already done their part correctly.
    console.error("[migas] SMTP send failed", err);
    return false;
  }
}

/** Where a booking notification goes. His own address, from lib/site.ts, unless the
 *  environment overrides it. */
const notifyTo = () => process.env.MIGAS_NOTIFY_TO ?? SITE.email;

/**
 * Validate the uploaded photos and turn them into mail attachments.
 *
 * No storage, on purpose — see the note at the top of this file. The photos are attached to
 * the brief and that is their whole journey: browser, request, email, his inbox. Nothing to
 * host, nothing to expire, nothing to pay for, and no bucket full of strangers' grow rooms
 * sitting around waiting to be a liability.
 */
async function readPhotos(files: File[]): Promise<{ attachments: Attachment[]; error?: string }> {
  const real = files.filter((f) => f && f.size > 0 && f.name);
  if (real.length > PHOTO_LIMITS.count) {
    return { attachments: [], error: `Up to ${PHOTO_LIMITS.count} photos.` };
  }
  let total = 0;
  for (const f of real) {
    if (!f.type.startsWith("image/")) {
      return { attachments: [], error: `${f.name} is not an image.` };
    }
    if (f.size > PHOTO_LIMITS.bytesEach) {
      return { attachments: [], error: `${f.name} is too large. Keep photos under 3 MB each.` };
    }
    total += f.size;
  }
  if (total > PHOTO_LIMITS.bytesTotal) {
    return {
      attachments: [],
      error: "Those photos are too large altogether. Try three instead of four.",
    };
  }
  const attachments: Attachment[] = [];
  for (const [i, f] of real.entries()) {
    attachments.push({
      // Renamed on the way through. A camera roll filename is noise in an inbox, and
      // `IMG_4821.jpg` from four different growers in one week is worse than noise.
      filename: `photo-${i + 1}${f.name.match(/\.[a-z0-9]+$/i)?.[0] ?? ".jpg"}`,
      content: Buffer.from(await f.arrayBuffer()),
      contentType: f.type,
    });
  }
  return { attachments };
}

/* ── Booking ────────────────────────────────────────────────────────────────── */

export async function requestBooking(_prev: FormState, fd: FormData): Promise<FormState> {
  // Honeypot. A field no human sees and every naive bot fills. Returning success
  // rather than an error means the bot has nothing to tune against.
  if (str(fd, "_trap")) return { status: "done", reference: reference(), summary: [] };

  const errors: Record<string, string> = {};
  const values: Record<string, string> = {};

  const sessionSlug = str(fd, "session");
  const session = SESSIONS.find((s) => s.slug === sessionSlug);
  values.session = sessionSlug;
  if (!session) errors.session = "Pick a session type.";

  const name = str(fd, "name");
  values.name = name;
  if (name.length < 2) errors.name = "Your name, so we know who we are talking to.";

  const email = str(fd, "email");
  values.email = email;
  if (!emailLooksReal(email)) errors.email = "An email address we can send the invite to.";

  for (const q of INTAKE) {
    const v = str(fd, q.id);
    values[q.id] = v;
    if (q.required && !v) errors[q.id] = "Needed before the call.";
    // `options` only exists on the select questions, and INTAKE is a const tuple, so
    // the `in` check is what tells TypeScript which members of the union have it.
    if (v && "options" in q && !(q.options as readonly string[]).includes(v)) {
      errors[q.id] = "Pick one of the listed options.";
    }
  }

  for (const optional of ["phone", "company", "heard"]) values[optional] = str(fd, optional);

  const slot = str(fd, "slot");
  values.slot = slot;
  if (!slot) {
    errors.slot = "Pick a time.";
  } else if (session && !(await bookableSlot(slot, session.minutes))) {
    // Reachable honestly, two ways: with no JavaScript nothing greys out the 11:30
    // slot that cannot hold a 90-minute consult, and with the calendar feed on, a
    // time can genuinely close between page load and submit. Same sentence covers
    // both, and it has to explain itself.
    errors.slot =
      `That time is no longer open for a ${session.minutes}-minute session. Pick another.`;
  }

  const photos = await readPhotos(fd.getAll("photos") as File[]);
  if (photos.error) errors.photos = photos.error;

  if (Object.keys(errors).length) return { status: "error", errors, values };

  const when = describeSlot(slot);
  const brief = [
    `${session!.name}, ${session!.minutes} minutes, ${when}`,
    "",
    `Name:    ${name}`,
    `Email:   ${email}`,
    values.phone ? `Phone:   ${values.phone}` : null,
    values.company ? `Company: ${values.company}` : null,
    values.heard ? `Heard:   ${values.heard}` : null,
    "",
    "THE ROOM",
    ...INTAKE.map((q) => `${q.label}\n  ${values[q.id] || "not given"}`),
    "",
    `Photos attached to this email: ${photos.attachments.length}`,
  ]
    .filter((l) => l !== null && l !== "")
    .join("\n");

  const ref = reference();

  // One invite, built once, sent to both sides. His copy makes his own calendar the record
  // of what is booked — which is the closest this build gets to solving availability, and
  // it is closer than a weekly pattern in a config file will ever get on its own.
  const ics = buildIcs({
    uid: `${ref.toLowerCase()}@mi-gas.net`,
    localStart: slot,
    minutes: session!.minutes,
    title: `${SITE.name} - ${session!.name} - ${name}`,
    description: brief,
    attendeeEmail: email,
  });
  const invite: Attachment = {
    filename: `${ref}.ics`,
    content: Buffer.from(ics, "utf8"),
    contentType: "text/calendar; charset=utf-8; method=REQUEST",
  };

  const toOwner = await sendMail({
    to: notifyTo(),
    subject: `[${ref}] ${session!.name} - ${name} - ${when}`,
    text: brief,
    attachments: [...photos.attachments, invite],
  });

  // And a confirmation to the grower. Deliberately contains NO text they supplied — only the
  // session name, the time and the reference. A form that will email an arbitrary address is
  // a relay; one whose body an attacker cannot influence is not worth abusing.
  const toVisitor = await sendMail({
    to: email,
    subject: `${SITE.name} - booking request received (${ref})`,
    text: [
      `Your request for a ${session!.name} is with ${SITE.name}.`,
      "",
      `When:      ${when}`,
      `Length:    ${session!.minutes} minutes`,
      `Reference: ${ref}`,
      "",
      "He reads your intake and your photos before the call, and will confirm the time",
      "by reply along with an invoice to settle beforehand.",
      "",
      "A calendar invite is attached.",
    ].join("\n"),
    attachments: [invite],
  });

  return {
    status: "done",
    reference: ref,
    ics: icsDataUrl(ics),
    delivered: { toOwner, toVisitor },
    summary: [
      `${session!.name}, ${session!.minutes} minutes`,
      when,
      `${money(session!.price)}, invoiced before the call`,
      // "0 photos received" is a worse thing to read than an ask. When somebody skipped the
      // most useful field on the form, the confirmation is the last good moment to get it.
      photos.attachments.length === 0
        ? toVisitor
          ? "No photos yet. Reply to your confirmation email with any and we will read them before the call"
          : "No photos yet. Send them with your reference and we will read them before the call"
        : photos.attachments.length === 1
          ? "1 photo sent with your intake"
          : `${photos.attachments.length} photos sent with your intake`,
    ],
  };
}

// Local, because importing the formatter from lib/site into a "use server" file for one
// string is more indirection than the string is worth.
const money = (n: number) => (n % 1 === 0 ? `$${n.toLocaleString("en-US")}` : `$${n.toFixed(2)}`);

/* ── Ask a question ─────────────────────────────────────────────────────────── */

export async function sendMessage(_prev: FormState, fd: FormData): Promise<FormState> {
  if (str(fd, "_trap")) return { status: "done", summary: [] };

  const errors: Record<string, string> = {};
  const values = {
    name: str(fd, "name"),
    email: str(fd, "email"),
    topic: str(fd, "topic"),
    message: str(fd, "message"),
  };
  if (values.name.length < 2) errors.name = "Your name.";
  if (!emailLooksReal(values.email)) errors.email = "An email address we can reply to.";
  if (values.message.length < 10) errors.message = "A sentence or two about what you need.";
  if (Object.keys(errors).length) return { status: "error", errors, values };

  const toOwner = await sendMail({
    to: notifyTo(),
    subject: `Question - ${values.name}${values.topic ? ` - ${values.topic}` : ""}`,
    text: `${values.name} <${values.email}>\nTopic: ${values.topic || "not given"}\n\n${values.message}`,
  });
  return {
    status: "done",
    delivered: { toOwner, toVisitor: true },
    summary: [
      toOwner
        ? "Message sent. He answers from the same inbox the bookings land in."
        : "Sent. Outgoing mail is not switched on for this build yet.",
    ],
  };
}
