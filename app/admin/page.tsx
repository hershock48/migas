import type { Metadata } from "next";
import { cookies } from "next/headers";
import { ADMIN_COOKIE, cookieIsValid, pinConfigured, pinIsShort } from "@/lib/admin-auth";
import { DRAFT_FIELD, DRAFT_MAX, OPEN_EVERY_DAY, availabilityStatus, getAvailability } from "@/lib/availability";
import { upcomingBookings } from "@/lib/bookings";
import { busyFeedStatus } from "@/lib/busy";
import { mailConfigured } from "@/lib/mail";
import { AVAILABILITY, SITE, money } from "@/lib/site";
import { describeSlot } from "@/lib/slots";
import { addBlock, adminLogin, adminLogout, cancelBooking, openEveryDay, removeBlock, saveAvailabilityAction, sendTestMail } from "./actions";

export const metadata: Metadata = {
  title: "Availability",
  // Its own noindex, deliberately redundant with the site-wide one: the site-wide
  // pair comes off on launch day and this page must stay out of the index after.
  robots: { index: false, follow: false },
};

// Reads cookies and live status on every request; caching an admin page is how an
// operator edits a copy of it.
export const dynamic = "force-dynamic";

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

/** The fixed sentences the actions redirect back with. Mapped here rather than
 *  echoing arbitrary query text into the page. */
const MESSAGES: Record<string, string> = {
  "wrong-pin": "That PIN is not it. Try again.",
  locked: "Five wrong PINs from here in a row. Sign-in is paused for fifteen minutes.",
  "locked-all": "Too many wrong PINs have been tried, so sign-in is paused for everyone for up to an hour. A device that is already signed in still works.",
  "signed-out": "You were signed out. Sign in and save again; what you typed is kept.",
  "signed-out-again": "You were signed out, so that was not saved. Sign in and do it again.",
  "half-window": "A window needs both an open and a close time. One of them has only one.",
  "bad-days": "Lead days and days offered both need to be numbers.",
  invalid: "That could not be saved:",
};

/** What the three "time off" buttons redirect back with. */
const BLOCK_MESSAGES: Record<string, { text: string; bad?: boolean }> = {
  added: { text: "Blocked. That time comes off the booking page within a minute, and a booking for it is refused from now." },
  removed: { text: "Removed. That time is back on the booking page within a minute." },
  open: { text: "Your weekly hours are now 7:00 AM to 10:00 PM, every day. Block off what you can't do below." },
  "no-date": { text: "Pick the date first.", bad: true },
  past: { text: "That date has already passed.", bad: true },
  half: { text: "A blocked time needs both a start and an end. For a whole day, leave both empty.", bad: true },
  "weekly-day": { text: "To take the same weekday off every week, clear that day under Weekly hours.", bad: true },
  invalid: { text: "That could not be saved:", bad: true },
};

/** "13:30" as "1:30 PM". */
const clock12 = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number);
  return `${h % 12 === 0 ? 12 : h % 12}:${String(m).padStart(2, "0")} ${h < 12 ? "AM" : "PM"}`;
};
const dayLabel = (date: string, opts: Intl.DateTimeFormatOptions) => new Date(`${date}T12:00:00Z`).toLocaleDateString("en-US", { ...opts, timeZone: "UTC" });

/** The form as it was typed, handed back by a rejected save (see actions.ts). Only
 *  the form's own field names are read, and only strings. */
function readDraft(raw: unknown): Record<string, string> | null {
  if (typeof raw !== "string" || !raw || raw.length > DRAFT_MAX) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return null;
    const out: Record<string, string> = {};
    for (const [k, v] of Object.entries(parsed)) {
      if (DRAFT_FIELD.test(k) && typeof v === "string") out[k] = v;
    }
    return out;
  } catch {
    return null;
  }
}

/**
 * His availability, editable by him. The other half of "make it easy for me to
 * adjust my availability" from the 2026-08-27 call; the first half is that the
 * booking grid reads what this page saves (lib/availability.ts).
 *
 * Plain forms posting server actions, no client JavaScript anywhere on the page. An
 * admin surface an owner uses twice a month from a phone in a grow room should not
 * depend on a bundle downloading over facility wifi.
 */
export default async function Admin({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const error = typeof params.error === "string" ? params.error : undefined;
  const detail = typeof params.detail === "string" ? params.detail : undefined;
  const saved = params.saved === "1";
  const restored = params.restored === "1";
  const rawDraft = typeof params.draft === "string" ? params.draft : "";
  const draft = readDraft(rawDraft);

  const jar = await cookies();
  const authed = cookieIsValid(jar.get(ADMIN_COOKIE)?.value);

  if (!pinConfigured()) {
    return (
      <section className="wrap py-24">
        <p className="eyebrow">Admin</p>
        <h1 className="mt-5 text-3xl sm:text-4xl">Not switched on yet</h1>
        <p className="mt-5 max-w-xl text-[15px] leading-relaxed text-muted">
          Set MIGAS_ADMIN_PIN in the hosting dashboard and this page becomes the
          availability editor. Until then there is nothing to sign in to.
        </p>
      </section>
    );
  }

  if (!authed) {
    return (
      <section className="wrap py-24">
        <p className="eyebrow">Admin</p>
        <h1 className="mt-5 text-3xl sm:text-4xl">Your availability</h1>
        {error && MESSAGES[error] && (
          <p role="alert" className="mt-5 max-w-xl rounded-xl2 border border-alert/50 bg-ink-panel p-4 text-[15px] text-alert">
            {MESSAGES[error]}
          </p>
        )}
        <form action={adminLogin} className="mt-8 flex max-w-sm flex-wrap items-end gap-3">
          {/* What was typed before the sign-in lapsed rides through the sign-in. */}
          {draft && <input type="hidden" name="draft" value={rawDraft} />}
          <label className="flex-1">
            <span className="block text-sm text-muted">PIN</span>
            <input
              type="password"
              name="pin"
              inputMode="numeric"
              autoComplete="current-password"
              className="mt-2 w-full rounded-lg border border-edge bg-ink px-4 py-3 text-bone"
            />
          </label>
          <button type="submit" className="btn-primary">
            Sign in
          </button>
        </form>
      </section>
    );
  }

  const [availability, status, feed, calls] = await Promise.all([
    // Fresh, like the calls below: this is the page he edits from, and another
    // server instance may have saved since this one last looked.
    getAvailability(true),
    availabilityStatus(),
    busyFeedStatus(),
    // Fresh, not the 30-second cache: this is the list he acts on.
    upcomingBookings(Date.now(), true),
  ]);
  const mail = typeof params.mail === "string" ? params.mail : undefined;
  const call = typeof params.call === "string" ? params.call : undefined;
  const callRef = typeof params.ref === "string" && /^MG-[A-F0-9]{6}$/.test(params.ref) ? params.ref : "";

  const win = (day: number, half: number) =>
    availability.windows.filter((w) => w.day === day)[half];
  /* A field's starting value: what was typed, when a save was just rejected (an
     absent key means he had cleared that field), else what is stored. */
  const start = (name: string, stored: string | number) => (draft ? draft[name] ?? "" : stored);

  // Time off: what he blocked by hand, in date order, each with the key its
  // Remove button posts back.
  const block = typeof params.block === "string" ? BLOCK_MESSAGES[params.block] : undefined;
  const typed = (k: string) => (typeof params[k] === "string" ? (params[k] as string) : "");
  const timeOff = [
    ...availability.blockedDates.map((d) => ({ key: `day|${d}`, sort: `${d}T00:00`, when: dayLabel(d, { weekday: "short", month: "short", day: "numeric" }), what: "All day" })),
    ...(availability.blocks ?? []).map((b) => ({
      key: `${b.weekly ? "weekly" : "once"}|${b.date}|${b.from}|${b.to}`,
      sort: `${b.date}T${b.from}`,
      when: b.weekly ? `Every ${dayLabel(b.date, { weekday: "long" })}` : dayLabel(b.date, { weekday: "short", month: "short", day: "numeric" }),
      what: `${clock12(b.from)} to ${clock12(b.to)}${b.weekly ? `, from ${dayLabel(b.date, { month: "short", day: "numeric" })}` : ""}`,
    })),
  ].sort((a, b) => (a.sort < b.sort ? -1 : 1));
  const openAllWeek =
    availability.windows.length === 7 &&
    [0, 1, 2, 3, 4, 5, 6].every((d) => availability.windows.some((w) => w.day === d && w.from === OPEN_EVERY_DAY.from && w.to === OPEN_EVERY_DAY.to));

  const smtpOn = mailConfigured();
  const notifyReal = Boolean(
    (process.env.MIGAS_NOTIFY_TO ?? SITE.email) &&
      !(process.env.MIGAS_NOTIFY_TO ?? SITE.email).startsWith("PLACEHOLDER")
  );
  // The day-before reminder needs all three: the hourly job's secret, the stored
  // bookings it reads, and mail to send with.
  const remindersOn = Boolean(process.env.CRON_SECRET) && status.configured && smtpOn;
  const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

  return (
    <section className="wrap py-16 sm:py-20">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Admin</p>
          <h1 className="mt-4 text-3xl sm:text-4xl">Your availability</h1>
        </div>
        <form action={adminLogout}>
          <button type="submit" className="btn-ghost">
            Sign out
          </button>
        </form>
      </div>
      {pinIsShort() && (
        <p className="mt-6 max-w-2xl rounded-lg border border-alert/50 bg-ink px-4 py-3 text-sm leading-relaxed text-bone" role="status">
          Your PIN is shorter than six characters. This page lists your callers&rsquo; names, emails and phone numbers,
          and a short PIN can be guessed in about a week even with wrong tries limited. Ask Glazed Web to set a longer one.
        </p>
      )}

      {saved && (
        <p role="status" className="mt-6 max-w-xl rounded-xl2 border border-ember/50 bg-ink-panel p-4 text-[15px] text-bone">
          Saved. The booking page offers the new times from its next load.
        </p>
      )}
      {restored && draft && !error && (
        <p role="status" className="mt-6 max-w-xl rounded-xl2 border border-ember/50 bg-ink-panel p-4 text-[15px] text-bone">
          You&rsquo;re signed in again, and what you typed is back in the form. It isn&rsquo;t saved yet.
        </p>
      )}
      {error && MESSAGES[error] && (
        <p role="alert" className="mt-6 max-w-xl rounded-xl2 border border-alert/50 bg-ink-panel p-4 text-[15px] text-alert">
          {MESSAGES[error]}
          {error === "invalid" && detail ? ` ${detail}` : ""}
          {draft ? " What you typed is still in the form below." : ""}
        </p>
      )}

      {/* ── Status, before the form: what the machinery around the form is doing ──
          Written for the owner, who reads this page. The settings behind each, for
          whoever runs the hosting: a Blob store on the Vercel project
          (BLOB_READ_WRITE_TOKEN), MIGAS_BUSY_ICS_URL, SMTP_HOST and friends,
          MIGAS_NOTIFY_TO. They used to be named in the red text itself. */}
      <dl className="mt-10 grid gap-px overflow-hidden rounded-xl2 border border-line bg-line sm:grid-cols-2 lg:grid-cols-5">
        {[
          {
            k: "Saving changes",
            ok: status.configured,
            yes: status.stored ? "On, and your saved hours are live" : "On, saving for the first time works",
            no: "Off. Storage isn't connected yet, so changes here can't be saved. Ask Glazed Web to connect it",
          },
          {
            /* Three states, not two. It used to read "Connected, 0 busy blocks" when
               the link was dead, which is the one moment he needs to be told. */
            k: "Your calendar",
            ok: feed.connected && feed.ok,
            yes:
              `Connected${(feed.feeds ?? 1) > 1 ? `, ${feed.feeds} calendars` : ""}. ${plural(feed.blocks, "busy time", "busy times")} in the next three months are off the booking page` +
              (feed.repeating ? `, counting ${plural(feed.repeating, "repeating event", "repeating events")}` : "") +
              (feed.unsupported
                ? `. ${plural(feed.unsupported, "monthly or yearly repeating event", "monthly or yearly repeating events")} can't be read, so add those dates under Days off`
                : "") +
              (feed.unreadable ? `. ${plural(feed.unreadable, "event", "events")} could not be read` : ""),
            no: feed.connected
              ? (feed.feeds ?? 1) > 1
                ? `Not all of your calendars are answering (${feed.error ?? "no reason given"}). The others still take their busy times off the booking page. Send Glazed Web a fresh link for the one that is not`
                : `Your calendar link isn't answering (${feed.error ?? "no reason given"}), so your busy times are not being taken off the booking page. Send Glazed Web a fresh link`
              : "Not connected. Send Glazed Web your calendar's private iCal link, and the times you're busy will drop off the booking page",
          },
          {
            k: "Outgoing mail",
            ok: smtpOn,
            yes: "On, bookings and invites send",
            no: "Off. Until your mailbox is connected, bookings aren't emailed to anyone",
          },
          {
            k: "Where bookings land",
            ok: notifyReal,
            yes: process.env.MIGAS_NOTIFY_TO ?? SITE.email,
            no: "No address yet. Tell Glazed Web which email should get your bookings",
          },
          {
            k: "Day-before reminder",
            ok: remindersOn,
            yes: "On. You and the grower each get an email the day before a call",
            no: smtpOn && status.configured ? "Off. Mail is connected; it still needs its timer switched on by Glazed Web" : "Off. It starts once outgoing mail is connected",
          },
        ].map((s) => (
          <div key={s.k} className="bg-ink-panel px-5 py-5">
            <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">{s.k}</dt>
            <dd className={`mt-2 text-sm leading-relaxed ${s.ok ? "text-bone" : "text-alert"}`}>
              {s.ok ? s.yes : s.no}
            </dd>
          </div>
        ))}
      </dl>

      {/* ── Mail, checked: the tile above only knows mail is set up ── */}
      {smtpOn && notifyReal && (
        <form action={sendTestMail} className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2">
          <button type="submit" className="btn-ghost">
            Send a test email
          </button>
          <p className="text-sm text-muted">It goes to {process.env.MIGAS_NOTIFY_TO ?? SITE.email}, the way a booking would.</p>
        </form>
      )}
      {mail === "sent" && (
        <p role="status" className="mt-4 max-w-xl rounded-xl2 border border-ember/50 bg-ink-panel p-4 text-[15px] text-bone">
          Test email sent. Check the inbox, and the spam folder if it isn&rsquo;t there in a minute.
        </p>
      )}
      {mail === "failed" && (
        <p role="alert" className="mt-4 max-w-xl rounded-xl2 border border-alert/50 bg-ink-panel p-4 text-[15px] text-alert">
          The test email did not send. The mail server said: {detail ?? "nothing"}. Send that line to Glazed Web.
        </p>
      )}

      {/* ── The calls on the books ── */}
      <h2 className="mt-12 text-2xl">Upcoming calls</h2>
      {!status.configured ? (
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">Calls will be listed here once storage is connected.</p>
      ) : calls.length === 0 ? (
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
          None booked. When someone books, the call shows here and its time comes off the booking page.
        </p>
      ) : (
        <>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
            Each of these times is off the booking page. Removing one puts its time back. It does not tell the
            grower, so email them yourself.
          </p>
          <ul className="mt-5 divide-y divide-line border-y border-line">
            {calls.map((b) => (
              <li key={b.ref} className="flex flex-wrap items-center gap-x-6 gap-y-2 py-4">
                <div className="min-w-0 flex-1 basis-64">
                  <p className="font-medium text-bone">{describeSlot(b.slot)}</p>
                  <p className="mt-1 break-words text-sm text-muted">
                    {b.sessionName}, {money(b.price)} · {b.name} ·{" "}
                    <a href={`mailto:${b.email}`} className="text-flare hover:underline">
                      {b.email}
                    </a>
                    {b.phone ? ` · ${b.phone}` : ""} · {b.ref} · {b.paidAt ? "Paid" : "Not paid"}
                  </p>
                  {/* Only when his email for this booking failed to send. The room's
                      answers normally live in that email and nowhere else. */}
                  {b.mailFailed && b.brief && (
                    <details className="mt-2 rounded-lg border border-alert/50 bg-ink px-4 py-3">
                      <summary className="cursor-pointer text-sm font-semibold text-bone">
                        The email for this booking did not send. Their answers are here. Photos were not kept; ask for them.
                      </summary>
                      <pre className="mt-3 whitespace-pre-wrap break-words font-sans text-sm leading-relaxed text-muted">{b.brief}</pre>
                    </details>
                  )}
                </div>
                <form action={cancelBooking}>
                  <input type="hidden" name="ref" value={b.ref} />
                  <button type="submit" className="btn-ghost !px-4 !py-2" aria-label={`Remove the call ${b.ref}, ${describeSlot(b.slot)}`}>
                    Remove
                  </button>
                </form>
              </li>
            ))}
          </ul>
        </>
      )}
      {call === "removed" && (
        <p role="status" className="mt-4 max-w-xl rounded-xl2 border border-ember/50 bg-ink-panel p-4 text-[15px] text-bone">
          Removed{callRef ? ` ${callRef}` : ""}. Its time is back on the booking page.
        </p>
      )}
      {call === "missing" && (
        <p role="alert" className="mt-4 max-w-xl rounded-xl2 border border-alert/50 bg-ink-panel p-4 text-[15px] text-alert">
          That call was not found. It may already have been removed.
        </p>
      )}

      {/* ── Time off: the part he manages day to day ──
          His note of 2026-11-16: open 7 AM to 10 PM, and block off the windows he
          is not available, instead of setting availability. One press sets the
          hours; after that this list is the whole job. */}
      <section id="blocks" className="mt-12 scroll-mt-24">
        <h2 className="text-2xl">Time off</h2>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
          {openAllWeek
            ? "You're open 7:00 AM to 10:00 PM every day. Block the times you can't take a call and they come off the booking page."
            : "Block a time you can't take a call and it comes off the booking page, inside whatever weekly hours are set below."}{" "}
          Times are {AVAILABILITY.timeZoneLabel}.
        </p>
        {block && (
          <p
            role={block.bad ? "alert" : "status"}
            className={`mt-4 max-w-xl rounded-xl2 border bg-ink-panel p-4 text-[15px] ${block.bad ? "border-alert/50 text-alert" : "border-ember/50 text-bone"}`}
          >
            {block.text}
            {params.block === "invalid" && detail ? ` ${detail}` : ""}
          </p>
        )}

        {timeOff.length > 0 && (
          <ul className="mt-5 max-w-2xl divide-y divide-line border-y border-line">
            {timeOff.map((t) => (
              <li key={t.key} className="flex flex-wrap items-center gap-x-6 gap-y-1 py-3">
                <p className="min-w-0 flex-1 basis-56 text-[15px]">
                  <span className="font-medium text-bone">{t.when}</span>
                  <span className="text-muted"> · {t.what}</span>
                </p>
                <form action={removeBlock}>
                  <input type="hidden" name="key" value={t.key} />
                  <button type="submit" className="btn-ghost !px-4 !py-2" aria-label={`Remove the time off: ${t.when}, ${t.what}`}>
                    Remove
                  </button>
                </form>
              </li>
            ))}
          </ul>
        )}

        <form key={timeOff.map((t) => t.key).join(",")} action={addBlock} className="mt-6 grid max-w-2xl gap-x-4 gap-y-3 sm:grid-cols-[1.3fr_1fr_1fr] sm:items-end">
          <label>
            <span className="block text-sm text-muted">Date</span>
            <input type="date" name="date" required defaultValue={typed("bdate")} className="mt-2 w-full min-w-0 rounded-lg border border-edge bg-ink px-3 py-2.5 text-bone" />
          </label>
          <label>
            <span className="block text-sm text-muted">From</span>
            <input type="time" name="from" defaultValue={typed("bfrom")} className="mt-2 w-full min-w-0 rounded-lg border border-edge bg-ink px-3 py-2.5 text-bone" />
          </label>
          <label>
            <span className="block text-sm text-muted">To</span>
            <input type="time" name="to" defaultValue={typed("bto")} className="mt-2 w-full min-w-0 rounded-lg border border-edge bg-ink px-3 py-2.5 text-bone" />
          </label>
          <label className="flex items-center gap-3 text-sm text-bone sm:col-span-2">
            <input type="checkbox" name="weekly" value="yes" defaultChecked={typed("bweekly") === "1"} className="h-5 w-5 accent-ember" />
            Every week on this day
          </label>
          <button type="submit" className="btn-primary sm:justify-self-end">
            Block this time
          </button>
          <p className="text-sm text-muted sm:col-span-3">Leave From and To empty to take the whole day off.</p>
        </form>

        {!openAllWeek && (
          <form action={openEveryDay} className="mt-8 flex max-w-2xl flex-wrap items-center gap-x-4 gap-y-2 border-t border-line pt-6">
            <button type="submit" className="btn-ghost">
              Open 7 AM to 10 PM, every day
            </button>
            <p className="min-w-0 flex-1 basis-64 text-sm text-muted">
              Sets the weekly hours below to 7:00 AM to 10:00 PM, all seven days, in one press. Your time off stays as it is.
            </p>
          </form>
        )}
      </section>

      {/* Keyed on what is stored. A press on "Open 7 AM to 10 PM" or a block lands
          back on this page without a full load, and React keeps an input it has
          already shown: the new hours were in the HTML and the old ones stayed on
          screen (seen 2026-11-16, Monday still reading 9 to 12 after the press).
          A new key rebuilds the form from what is stored. */}
      <form key={JSON.stringify([availability.windows, availability.blockedDates, availability.leadDays, availability.horizonDays, rawDraft])} action={saveAvailabilityAction} className="mt-12">
        <h2 className="text-2xl">Weekly hours</h2>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
          Times are {AVAILABILITY.timeZoneLabel}, up to two windows a day, each an open
          time and a close time. Leave a day empty and it is off. Calls are offered inside these windows in{" "}
          {AVAILABILITY.stepMinutes}-minute steps.
        </p>

        {/* A list that stacks, not a table. At 390px the table scrolled sideways: the
            Close column was cut off mid-field and the second window was off screen
            with nothing to say it was there (seen 2026-11-12), on the page he uses
            from a phone. Each day is now two short rows on a phone and one row from
            640px, under the same five headings as before. */}
        <div className="mt-6">
          <div
            aria-hidden
            className="hidden grid-cols-[7.5rem_repeat(4,minmax(0,1fr))] gap-x-4 pb-2 text-xs font-semibold uppercase tracking-[0.14em] text-muted sm:grid"
          >
            <span>Day</span>
            <span>Open</span>
            <span>Close</span>
            <span>Second open</span>
            <span>Second close</span>
          </div>
          {DAY_NAMES.map((name, day) => (
            <div
              key={name}
              role="group"
              aria-label={name}
              className="grid gap-x-4 gap-y-2 border-t border-line py-3 text-sm sm:grid-cols-[7.5rem_repeat(4,minmax(0,1fr))] sm:items-center"
            >
              <p aria-hidden className="font-medium text-bone">
                {name}
              </p>
              {([0, 1] as const).map((half) => {
                const w = win(day, half);
                const prefix = `w${day}${half === 0 ? "a" : "b"}`;
                const which = half === 0 ? "first" : "second";
                return (
                  <div key={prefix} className="grid grid-cols-[3.75rem_minmax(0,1fr)_minmax(0,1fr)] items-center gap-2 sm:contents">
                    <span aria-hidden className="text-xs text-muted sm:hidden">
                      {half === 0 ? "First" : "Second"}
                    </span>
                    <input
                      type="time"
                      name={`${prefix}_from`}
                      defaultValue={start(`${prefix}_from`, w?.from ?? "")}
                      aria-label={`${name}, ${which} window opens`}
                      className="w-full min-w-0 rounded-lg border border-edge bg-ink px-3 py-2 text-bone"
                    />
                    <input
                      type="time"
                      name={`${prefix}_to`}
                      defaultValue={start(`${prefix}_to`, w?.to ?? "")}
                      aria-label={`${name}, ${which} window closes`}
                      className="w-full min-w-0 rounded-lg border border-edge bg-ink px-3 py-2 text-bone"
                    />
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        <div className="mt-10 grid max-w-2xl gap-8 sm:grid-cols-2">
          <label>
            <span className="block text-lg text-bone">Days off</span>
            <span className="mt-1 block text-sm text-muted">
              One date per line, like 2026-09-03. Harvest days, holidays, travel.
            </span>
            <textarea
              name="blocked"
              rows={5}
              defaultValue={start("blocked", availability.blockedDates.join("\n"))}
              className="mt-3 w-full rounded-lg border border-edge bg-ink px-4 py-3 font-mono text-sm text-bone"
            />
          </label>
          <div className="grid content-start gap-6">
            <label>
              <span className="block text-lg text-bone">Lead time, days</span>
              <span className="mt-1 block text-sm text-muted">
                Nothing bookable sooner than this, so intake and photos land first.
              </span>
              <input
                type="number"
                name="leadDays"
                min={0}
                max={30}
                defaultValue={start("leadDays", availability.leadDays)}
                className="mt-3 w-28 rounded-lg border border-edge bg-ink px-4 py-3 text-bone"
              />
            </label>
            <label>
              <span className="block text-lg text-bone">Days offered</span>
              <span className="mt-1 block text-sm text-muted">
                How far ahead the grid reaches. Two weeks looks booked without looking absent.
              </span>
              <input
                type="number"
                name="horizonDays"
                min={1}
                max={60}
                defaultValue={start("horizonDays", availability.horizonDays)}
                className="mt-3 w-28 rounded-lg border border-edge bg-ink px-4 py-3 text-bone"
              />
            </label>
          </div>
        </div>

        <button type="submit" className="btn-primary mt-10">
          Save availability
        </button>
      </form>
    </section>
  );
}
