"use server";

import { INTAKE, SESSIONS, SITE } from "@/lib/site";
import { PHOTO_LIMITS, type FormState } from "@/lib/forms";
import { describeSlot, slotIsBookable } from "@/lib/slots";

/**
 * Every form on the site posts to one of these three server actions.
 *
 * WHY SERVER ACTIONS AND NOT A FETCH. A server action attached with
 * `<form action={...}>` submits natively when JavaScript has not loaded, failed, or
 * been switched off. The step-by-step wizard in components/Booking.tsx is a layer on
 * top of a form that already works without it — so a blocked script downgrades the
 * booking to one long form rather than to a dead button. That is the whole reason the
 * flow is not a fetch-and-render single-page thing.
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
 * No photo is stored. `storeUploads` is the seam and it currently only measures what
 * arrived. Doing it properly means client-direct upload to blob storage, and that needs
 * a token nobody should paste into a chat window. The README has the six lines.
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
 * Notification transport. Resend, with the key set in the Vercel dashboard and never in
 * the repo. If it is missing the submission still succeeds for the visitor and the
 * brief is written to the server log, because a form that says "something went wrong"
 * when the fault is a missing environment variable trains people not to trust it.
 *
 * The consequence, stated plainly for whoever deploys this: with no RESEND_API_KEY,
 * bookings exist only in the Vercel logs. Set it before launch.
 */
async function notify(subject: string, body: string) {
  const key = process.env.RESEND_API_KEY;
  const to = process.env.MIGAS_NOTIFY_TO ?? SITE.email;
  if (!key || to.startsWith("PLACEHOLDER")) {
    console.warn(
      `[migas] Not emailed (RESEND_API_KEY or MIGAS_NOTIFY_TO unset). ${subject}\n${body}`
    );
    return false;
  }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: process.env.MIGAS_NOTIFY_FROM ?? "MI Gas site <noreply@mi-gas.net>",
        to: [to],
        subject,
        text: body,
      }),
    });
    if (!res.ok) console.error(`[migas] Resend ${res.status}: ${await res.text()}`);
    return res.ok;
  } catch (err) {
    console.error("[migas] Resend threw", err);
    return false;
  }
}

/**
 * The upload seam.
 *
 * Right now it validates and counts. To make it real: `npm i @vercel/blob`, have the
 * browser upload straight to blob storage with a short-lived token, and post the
 * resulting URLs as text fields instead of file fields. That route also sidesteps the
 * request-body ceiling entirely, which is the actual reason to prefer it over making
 * this function store bytes.
 */
async function storeUploads(files: File[]): Promise<{ count: number; error?: string }> {
  const real = files.filter((f) => f && f.size > 0 && f.name);
  if (real.length > PHOTO_LIMITS.count) {
    return { count: 0, error: `Up to ${PHOTO_LIMITS.count} photos.` };
  }
  let total = 0;
  for (const f of real) {
    if (!f.type.startsWith("image/")) {
      return { count: 0, error: `${f.name} is not an image.` };
    }
    if (f.size > PHOTO_LIMITS.bytesEach) {
      return { count: 0, error: `${f.name} is too large. Keep photos under 3 MB each.` };
    }
    total += f.size;
  }
  if (total > PHOTO_LIMITS.bytesTotal) {
    return { count: 0, error: "Those photos are too large altogether. Try three instead of four." };
  }
  return { count: real.length };
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
  if (name.length < 2) errors.name = "Your name, so he knows who he is talking to.";

  const email = str(fd, "email");
  values.email = email;
  if (!emailLooksReal(email)) errors.email = "An email address he can send the invite to.";

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
  } else if (session && !slotIsBookable(slot, session.minutes)) {
    // Reachable honestly: with no JavaScript nothing greys out the 11:30 slot that
    // cannot hold a 90-minute consult, so this message has to explain itself.
    errors.slot =
      `That time is no longer open for a ${session.minutes}-minute session. Pick another.`;
  }

  const photos = await storeUploads(fd.getAll("photos") as File[]);
  if (photos.error) errors.photos = photos.error;

  if (Object.keys(errors).length) return { status: "error", errors, values };

  const when = describeSlot(slot);
  const brief = [
    `${session!.name} — ${session!.minutes} minutes — ${when}`,
    "",
    `Name:    ${name}`,
    `Email:   ${email}`,
    values.phone ? `Phone:   ${values.phone}` : null,
    values.company ? `Company: ${values.company}` : null,
    values.heard ? `Heard:   ${values.heard}` : null,
    "",
    "THE ROOM",
    ...INTAKE.map((q) => `${q.label}\n  ${values[q.id] || "—"}`),
    "",
    `Photos attached by the grower: ${photos.count}`,
    photos.count > 0
      ? "(Uploads are not stored yet — see storeUploads in app/actions.ts.)"
      : "",
  ]
    .filter((l) => l !== null && l !== "")
    .join("\n");

  const ref = reference();
  await notify(`[${ref}] ${session!.name} — ${name} — ${when}`, brief);

  return {
    status: "done",
    reference: ref,
    summary: [
      `${session!.name}, ${session!.minutes} minutes`,
      when,
      `${money(session!.price)} — invoiced before the call`,
      // "0 photos received" is a worse thing to read than an ask. When somebody skipped
      // the most useful field on the form, the confirmation is the last good moment to
      // get it back.
      photos.count === 0
        ? "No photos yet — reply to the confirmation with any and he will read them before the call"
        : photos.count === 1
          ? "1 photo received"
          : `${photos.count} photos received`,
    ],
  };
}

// Local, because importing the formatter from lib/site into a "use server" file for one
// string is more indirection than the string is worth.
const money = (n: number) => (n % 1 === 0 ? `$${n.toLocaleString("en-US")}` : `$${n.toFixed(2)}`);

/* ── Restock notify ─────────────────────────────────────────────────────────── */

export async function notifyRestock(_prev: FormState, fd: FormData): Promise<FormState> {
  if (str(fd, "_trap")) return { status: "done", summary: [] };
  const email = str(fd, "email");
  if (!emailLooksReal(email)) {
    return { status: "error", errors: { email: "That does not look like an email address." }, values: { email } };
  }
  await notify("Restock list signup", `${email}\nWants to hear about the next merch drop.`);
  return { status: "done", summary: ["You are on the list for the next drop."] };
}

/* ── Guide request ──────────────────────────────────────────────────────────── */

/**
 * Interim, and marked interim on the page itself.
 *
 * His guides already sell through a Squarespace store, so the right long-term wiring is
 * a checkout — which is exactly the thing blocked on the processor question. Until that
 * is answered, a request reaches him and he invoices, and the moment a product URL is
 * known it goes in `buyUrl` on the guide in lib/site.ts and the button becomes a real
 * buy button with no code change.
 */
export async function requestGuide(_prev: FormState, fd: FormData): Promise<FormState> {
  if (str(fd, "_trap")) return { status: "done", summary: [] };
  const email = str(fd, "email");
  const guide = str(fd, "guide");
  const name = str(fd, "name");
  const errors: Record<string, string> = {};
  if (name.length < 2) errors.name = "Your name.";
  if (!emailLooksReal(email)) errors.email = "An email address he can send it to.";
  if (Object.keys(errors).length) return { status: "error", errors, values: { name, email } };

  await notify(`Guide request — ${guide || "unspecified"} — ${name}`, `${name} <${email}>\nWants: ${guide || "—"}`);
  return {
    status: "done",
    summary: ["Request sent. He replies with the invoice and the download."],
  };
}

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
  if (!emailLooksReal(values.email)) errors.email = "An email address he can reply to.";
  if (values.message.length < 10) errors.message = "A sentence or two about what you need.";
  if (Object.keys(errors).length) return { status: "error", errors, values };

  await notify(
    `Question — ${values.name}${values.topic ? ` — ${values.topic}` : ""}`,
    `${values.name} <${values.email}>\nTopic: ${values.topic || "—"}\n\n${values.message}`
  );
  return {
    status: "done",
    summary: ["Message sent. He answers from the same inbox the bookings land in."],
  };
}
