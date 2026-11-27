"use server";

import { COMANAGE_APPLY, INTAKE, SESSIONS, SITE } from "@/lib/site";
import { mailConfigured, notifyTo as notifyAddress, sendMail, sendMailChecked, type Attachment } from "@/lib/mail";
import { bookingsConfigured, clashesWith, deleteBooking, saveBooking, upcomingBookings, type Booking } from "@/lib/bookings";
import { payConfigured, payLink, payPath } from "@/lib/pay";
import { toInstant } from "@/lib/ics";
import { PHOTO_LIMITS, type FormState } from "@/lib/forms";
import { describeSlot } from "@/lib/slots";
import { slotCheck } from "@/lib/availability";
import { caller, tooMany } from "@/lib/throttle";

/** How many bookings one address, one place and everybody together may make. */
const BOOKING_LIMITS = { perAddress: 2, perPlaceADay: 4, anHour: 8 };
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
 * No card is taken here. That is not laziness, it is unresolved: Stripe's published
 * restricted-business list prohibits "Courses and information on cultivating
 * marijuana", and Calendly, Acuity and Setmore all settle through Stripe, Square or
 * PayPal. Which processor a cannabis-education business can actually use is a question
 * for him and whoever underwrites him. A booking request therefore reaches him and he
 * invoices. When he has switched the card step on (lib/pay.ts), the booking is given a
 * pay link instead, and the paying happens there, after this action has finished.
 *
 * VALIDATION IS SERVER-SIDE AND MEANT IT. The client validates too, for speed, but
 * every rule below is enforced here, because the no-JS path can genuinely post a slot
 * too short for a 90-minute consult and a determined visitor can post anything at all.
 */

const str = (fd: FormData, key: string) => String(fd.get(key) ?? "").trim();

/** Deliberately permissive. A regex that rejects a valid address is worse than one that
 *  accepts an invalid one, because the second costs a bounce and the first costs a
 *  client who cannot work out why the button will not go. */
// Letters, digits and . _ % + - only. The looser pattern let quotes, brackets,
// parentheses and semicolons through to the mail library, whose address parser
// has had a run of advisories about exactly those characters.
const emailLooksReal = (v: string) => /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(v);

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
// The mailer lives in lib/mail.ts now, so the reminder cron and the payment
// webhook can send without importing this "use server" file. Same code, moved.
const notifyTo = () => notifyAddress(SITE.email);

/**
 * Validate the uploaded photos and turn them into mail attachments.
 *
 * No storage, on purpose — see the note at the top of this file. The photos are attached to
 * the brief and that is their whole journey: browser, request, email, his inbox. Nothing to
 * host, nothing to expire, nothing to pay for, and no bucket full of strangers' grow rooms
 * sitting around waiting to be a liability.
 */
/** What the file IS, read from its first bytes. The type and the name a browser
 *  sends with an upload are whatever the sender says they are. */
function sniff(b: Buffer): { ext: string; type: string } | null {
  const ascii = (from: number, to: number) => b.subarray(from, to).toString("latin1");
  if (b.length > 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return { ext: "jpg", type: "image/jpeg" };
  if (b.length > 8 && b[0] === 0x89 && ascii(1, 4) === "PNG") return { ext: "png", type: "image/png" };
  if (ascii(0, 4) === "RIFF" && ascii(8, 12) === "WEBP") return { ext: "webp", type: "image/webp" };
  if (ascii(0, 4) === "GIF8") return { ext: "gif", type: "image/gif" };
  if (ascii(4, 8) === "ftyp") {
    const brand = ascii(8, 12);
    if (brand === "avif" || brand === "avis") return { ext: "avif", type: "image/avif" };
    if (/^(heic|heix|hevc|hevx|heim|heis|mif1|msf1)$/.test(brand)) return { ext: "heic", type: "image/heic" };
  }
  return null;
}

async function readPhotos(files: File[]): Promise<{ attachments: Attachment[]; error?: string }> {
  const real = files.filter((f) => f && f.size > 0 && f.name);
  if (real.length > PHOTO_LIMITS.count) {
    return { attachments: [], error: `Up to ${PHOTO_LIMITS.count} photos.` };
  }
  const each = `${(PHOTO_LIMITS.bytesEach / 1_000_000).toFixed(1)} MB`;
  let total = 0;
  for (const f of real) {
    if (f.size > PHOTO_LIMITS.bytesEach) {
      return { attachments: [], error: `${f.name} is too large. Keep photos under ${each} each.` };
    }
    total += f.size;
  }
  if (total > PHOTO_LIMITS.bytesTotal) {
    return {
      attachments: [],
      error: "Those photos are too large altogether. Try three instead of four.",
    };
  }
  /* The attachment's name and type come from the file's own bytes. They used to
     come from the upload: anything that claimed "image/..." was accepted, and
     the name kept whatever ending the sender gave it, so a crafted post could
     put photo-1.html in his inbox on a genuine booking email (review, 2026-11-19).
     Run against the build: a program renamed canopy.jpg was accepted and sent on. */
  const attachments: Attachment[] = [];
  for (const [i, f] of real.entries()) {
    const content = Buffer.from(await f.arrayBuffer());
    const kind = sniff(content);
    if (!kind) return { attachments: [], error: `${f.name} is not a photo we can read. Send a JPEG, PNG, WebP or HEIC.` };
    attachments.push({ filename: `photo-${i + 1}.${kind.ext}`, content, contentType: kind.type });
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
  } else if (session) {
    // "unknown" is storage not answering. The page renders without the stored
    // bookings when that happens; a submit must not, or it confirms a taken time.
    const state = await slotCheck(slot, session.minutes);
    if (state === "unknown") errors.slot = "We can't check the calendar right now, so nothing was sent. Try again in a minute.";
    else if (state === "taken") errors.slot = `That time is no longer open for a ${session.minutes}-minute session. Pick another.`;
  }

  const photos = await readPhotos(fd.getAll("photos") as File[]);
  if (photos.error) errors.photos = photos.error;

  /* LIMITS, counted from the stored bookings themselves, so they hold across
     every server instance. Nothing limited this form before: a script could
     post once per open time, empty the calendar, and have his mailbox send a
     confirmation to any address it chose (review, 2026-11-19). The list was
     read fresh a moment ago by the time check, so this costs no second read. */
  const who = await caller();
  if (!Object.keys(errors).length) {
    const now = Date.now();
    const open = await upcomingBookings(now);
    if (open.filter((b) => b.email.toLowerCase() === email.toLowerCase()).length >= BOOKING_LIMITS.perAddress) {
      errors.email = "This address already has two calls booked. Reply to one of the confirmations to change it, or send us a message.";
    } else if (open.filter((b) => b.ipHash === who && now - b.createdAt < 86_400_000).length >= BOOKING_LIMITS.perPlaceADay) {
      errors.slot = "That is a lot of bookings from one place today. Send us a message and we'll sort it out.";
    } else if (open.filter((b) => now - b.createdAt < 3_600_000).length >= BOOKING_LIMITS.anHour) {
      errors.slot = "The calendar is taking a lot of requests right now. Try again in an hour, or send us a message.";
    }
  }

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

  /* TWO INVITES, ONE EVENT. His copy carries the whole brief. The grower's
     carries nothing the sender of the form typed. The comment on that email
     below has always said it "contains NO text they supplied", and the
     attachment broke it: the invite's title held the typed name and its
     description held the whole brief, free text included. So a booking made
     with somebody else's address sent that person a calendar invite, from his
     real mailbox, saying whatever the sender liked (review, 2026-11-19). */
  const inviteWith = (title: string, description: string) =>
    buildIcs({
      uid: `${ref.toLowerCase()}@mi-gas.net`,
      localStart: slot,
      minutes: session!.minutes,
      title,
      description,
      attendeeEmail: email,
    });
  const ownerIcs = inviteWith(`${SITE.name} - ${session!.name} - ${name}`, brief);
  const visitorIcs = inviteWith(`${SITE.name} - ${session!.name}`, `${session!.name}, ${session!.minutes} minutes, ${when}\nReference: ${ref}`);
  const asAttachment = (ics: string): Attachment => ({
    filename: `${ref}.ics`,
    content: Buffer.from(ics, "utf8"),
    contentType: `text/calendar; charset=utf-8; method=${/^METHOD:(\w+)/m.exec(ics)?.[1] ?? "PUBLISH"}`,
  });

  /* Whether this booking is paid by card. Nothing is asked of Stripe here any
     more: the booking gets a pay link on this site, and a payment page is only
     opened when that link is. So Stripe being slow or down cannot hold up or
     change a booking. */
  const card = payConfigured();

  const record: Booking = {
    ref,
    name,
    email,
    phone: values.phone ?? "",
    sessionSlug: session!.slug,
    sessionName: session!.name,
    minutes: session!.minutes,
    price: session!.price,
    slot,
    startMs: toInstant(slot).getTime(),
    createdAt: Date.now(),
    ...(card ? { payByCard: true } : {}),
    ipHash: who,
  };
  /* A BOOKING THAT CANNOT BE SAVED IS REFUSED. It used to go ahead: both
     emails went out and the visitor saw a normal confirmation, but the time
     was not held, the call was not on /admin and no reminder would follow.
     With no storage configured at all, the email is the record, as before. */
  let stored = false;
  if (bookingsConfigured()) {
    try {
      stored = await saveBooking(record);
    } catch (err) {
      console.error("[migas] booking not stored, so it was refused", err);
      return {
        status: "error",
        values,
        errors: { slot: "We couldn't save your booking just now, so nothing was sent and the time is not held. Try again in a minute." },
      };
    }
  }

  /* SAVED, THEN LOOKED AT AGAIN, BEFORE ANYTHING IS SENT. The time was checked
     as free further up, but storage has no way to check and save in one step,
     so two visitors who pressed the button in the same instant both passed
     the check and both saved, and both were confirmed (and, with the card
     step on, both sent a link to pay for the one time). Review, 2026-11-19.

     So each booking, once saved, reads the records again. If another booking
     overlaps it, this one takes itself back off the books and says so. It
     does not try to work out who was first: the store gives no order both
     sides can trust, and "whoever sees the other steps back" cannot leave two
     standing. If each saw the other, both step back and the time is open
     again, which is why the sentence says to pick again and not that the time
     has gone. If the records cannot be read, it steps back too. */
  if (stored) {
    let clash: boolean | null;
    try {
      clash = (await clashesWith(record)).length > 0;
    } catch (err) {
      console.error("[migas] a saved booking could not be checked against the others, so it was taken back", ref, err);
      clash = null;
    }
    if (clash !== false) {
      await deleteBooking(ref).catch((err) => console.error("[migas] a booking that was refused could not be removed; remove it on /admin", ref, err));
      return {
        status: "error",
        values,
        errors: {
          slot: clash
            ? "Someone else asked for that time at the same moment, so nothing was sent and the time is not held. Pick a time again."
            : "We can't check the calendar right now, so nothing was sent. Try again in a minute.",
        },
      };
    }
  }

  // Only a booking that is on record can be paid by link: the link looks it up.
  const payUrl = card && stored ? payPath(ref) : undefined;

  const reminder = stored && mailConfigured() && Boolean(process.env.CRON_SECRET);

  const ownerMail = await sendMailChecked({
    to: notifyTo(),
    subject: `[${ref}] ${session!.name} - ${name} - ${when}`,
    replyTo: email,
    text: `${brief}\n\nPayment: ${payUrl ? "card link sent with the confirmation" : "invoice"}\nReminder: ${reminder ? "automatic, the day before" : "not on"}`,
    attachments: [...photos.attachments, asAttachment(ownerIcs)],
  });
  const toOwner = ownerMail.ok;
  /* His email is the only place the room's answers live. If mail is connected
     and that send failed, they are kept on the stored booking instead, and
     /admin shows them under the call. The photos cannot be kept: they only
     ever ride on the email. */
  if (!toOwner && stored && mailConfigured()) {
    await saveBooking({ ...record, brief, mailFailed: true }).catch((err) => console.error("[migas] the intake could not be kept with the booking either", err));
  }

  /* The grower's copy. It contains NO text the sender typed, in the body or in
     the invite, so the form cannot be used to send somebody a message from his
     mailbox. */
  const toVisitor = await sendMail({
    to: email,
    subject: `${SITE.name} - booking request received (${ref})`,
    text: [
      `Your request for a ${session!.name} is with ${SITE.name}.`,
      "",
      `When:      ${when}`,
      `Length:    ${session!.minutes} minutes`,
      `Price:     ${money(session!.price)}`,
      `Reference: ${ref}`,
      "",
      // The link is this site's, and it works until the call is paid or removed.
      payUrl ? `Pay for the call here: ${payLink(ref)}` : "We'll confirm the time by reply and send an invoice to pay before the call.",
      "",
      "We read your facility profile and photos before the call.",
      reminder ? "A reminder goes out the day before." : "",
      "",
      "A calendar invite is attached.",
    ].join("\n"),
    attachments: [asAttachment(visitorIcs)],
  });

  const n = photos.attachments.length;
  return {
    status: "done",
    reference: ref,
    ics: icsDataUrl(visitorIcs),
    payUrl,
    reminder,
    recorded: stored,
    mailOn: mailConfigured(),
    delivered: { toOwner, toVisitor },
    summary: [
      `${session!.name}, ${session!.minutes} minutes`,
      when,
      payUrl ? `${money(session!.price)}, pay by card below` : `${money(session!.price)}, invoiced before the call`,
      n === 0
        ? toVisitor
          ? "No photos yet. Reply to your confirmation email with any and we'll read them before the call"
          : "No photos yet"
        : toOwner
          ? n === 1
            ? "1 photo sent with your intake"
            : `${n} photos sent with your intake`
          : `Your ${n === 1 ? "photo" : "photos"} did not reach us. We'll ask for ${n === 1 ? "it" : "them"} when we write to you`,
    ],
  };
}

// Local, because importing the formatter from lib/site into a "use server" file for one
// string is more indirection than the string is worth.
const money = (n: number) => (n % 1 === 0 ? `$${n.toLocaleString("en-US")}` : `$${n.toFixed(2)}`);

/* ── Co-management application ──────────────────────────────────────────────── */

/**
 * The application from his own outline: the room, the sensors, the person on the
 * floor, and what they want. It validates against COMANAGE_APPLY the way the booking
 * validates against INTAKE, so adding a question in lib/site.ts is the whole change.
 *
 * Answers that fail the stated conditions (TrolMaster, no sensors, no head grower)
 * still submit — see the capture-not-wall note on COMANAGE_APPLY — and the ticket
 * leads with the two numbers that price a room, so he can triage from the subject
 * line alone.
 */
export async function requestCoManagement(_prev: FormState, fd: FormData): Promise<FormState> {
  if (str(fd, "_trap")) return { status: "done", reference: reference(), summary: [] };

  const errors: Record<string, string> = {};
  const values: Record<string, string> = {};

  for (const q of COMANAGE_APPLY) {
    const v = str(fd, q.id);
    values[q.id] = v;
    if (q.required && !v) errors[q.id] = "Needed to read the room.";
    if (v && "options" in q && !(q.options as readonly string[]).includes(v)) {
      errors[q.id] = "Pick one of the listed options.";
    }
  }
  if (values.name && values.name.length < 2) errors.name = "Your name, so we know who we are talking to.";
  if (values.email && !emailLooksReal(values.email)) errors.email = "An email address we can reply to.";

  if (Object.keys(errors).length) return { status: "error", errors, values };

  // Counted per place, so a script cannot post this as fast as it likes. lib/throttle.ts.
  if (tooMany("message", await caller(), 5, 3_600_000)) {
    return { status: "error", values, errors: { name: "That is a lot of messages from one place. Try again in an hour." } };
  }

  const ref = reference();
  const ticket = [
    `Co-management application: ${values.lights} lights, ${values.state}`,
    "",
    ...COMANAGE_APPLY.map((q) => `${q.label}\n  ${values[q.id] || "not given"}`),
  ].join("\n");

  const toOwner = await sendMail({
    to: notifyTo(),
    subject: `[${ref}] Co-management - ${values.name}${values.facility ? ` (${values.facility})` : ""} - ${values.lights} lights, ${values.state}`,
    replyTo: values.email,
    text: ticket,
  });

  return {
    status: "done",
    reference: ref,
    delivered: { toOwner, toVisitor: true },
    summary: [
      toOwner
        ? "Got it. We'll read it and get back to you about a call and a price, or tell you why it isn't a fit yet."
        : "This could not be sent: email is not connected on this site yet. Message us on Instagram for now.",
    ],
  };
}

/* ── Request a call ─────────────────────────────────────────────────────────── */

/**
 * The light path, from Kevin's notes: "in addition to the calendly link - just
 * capturing random calls." Some visitors know exactly what they need and book with
 * the full intake; some just want to talk to a person. Three fields, one of which
 * can be skipped, so the visitor who will never finish an eight-question form still
 * converts instead of leaving.
 */
export async function requestCall(_prev: FormState, fd: FormData): Promise<FormState> {
  if (str(fd, "_trap")) return { status: "done", summary: [] };

  const values = {
    name: str(fd, "name"),
    phone: str(fd, "phone"),
    email: str(fd, "email"),
    about: str(fd, "about"),
  };
  const errors: Record<string, string> = {};
  if (values.name.length < 2) errors.name = "Your name.";
  // One route back is enough, either route. Requiring both is how a form loses the
  // exact person this one exists for.
  if (!values.phone && !values.email) {
    errors.phone = "A number or an email, either works.";
  } else if (values.email && !emailLooksReal(values.email)) {
    errors.email = "That does not look like an email address.";
  }
  if (Object.keys(errors).length) return { status: "error", errors, values };

  // Counted per place, so a script cannot post this as fast as it likes. lib/throttle.ts.
  if (tooMany("message", await caller(), 5, 3_600_000)) {
    return { status: "error", values, errors: { name: "That is a lot of messages from one place. Try again in an hour." } };
  }

  const toOwner = await sendMail({
    to: notifyTo(),
    subject: `Call request - ${values.name}`,
    replyTo: values.email || undefined,
    text: [
      `${values.name}`,
      values.phone ? `Phone: ${values.phone}` : null,
      values.email ? `Email: ${values.email}` : null,
      values.about ? `\nAbout:\n${values.about}` : null,
    ]
      .filter(Boolean)
      .join("\n"),
  });

  return {
    status: "done",
    delivered: { toOwner, toVisitor: true },
    summary: [
      toOwner
        ? "Got it. We'll call you back."
        : "This could not be sent: email is not connected on this site yet. Message us on Instagram for now.",
    ],
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
  if (!emailLooksReal(values.email)) errors.email = "An email address we can reply to.";
  if (values.message.length < 10) errors.message = "A sentence or two about what you need.";
  if (Object.keys(errors).length) return { status: "error", errors, values };

  // Counted per place, so a script cannot post this as fast as it likes. lib/throttle.ts.
  if (tooMany("message", await caller(), 5, 3_600_000)) {
    return { status: "error", values, errors: { name: "That is a lot of messages from one place. Try again in an hour." } };
  }

  const toOwner = await sendMail({
    to: notifyTo(),
    subject: `Question - ${values.name}${values.topic ? ` - ${values.topic}` : ""}`,
    replyTo: values.email,
    text: `${values.name} <${values.email}>\nTopic: ${values.topic || "not given"}\n\n${values.message}`,
  });
  return {
    status: "done",
    delivered: { toOwner, toVisitor: true },
    summary: [
      toOwner
        ? "Sent. We answer from the same inbox as bookings."
        : "This could not be sent: email is not connected on this site yet. Message us on Instagram for now.",
    ],
  };
}
