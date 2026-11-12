import type { Metadata } from "next";
import { cookies } from "next/headers";
import { ADMIN_COOKIE, cookieIsValid, pinConfigured } from "@/lib/admin-auth";
import { DRAFT_FIELD, DRAFT_MAX, availabilityStatus, getAvailability } from "@/lib/availability";
import { getBusyIntervals } from "@/lib/busy";
import { AVAILABILITY, SITE } from "@/lib/site";
import { adminLogin, adminLogout, saveAvailabilityAction } from "./actions";

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
  "signed-out": "You were signed out. Sign in and save again; what you typed is kept.",
  "half-window": "A window needs both an open and a close time. One of them has only one.",
  "bad-days": "Lead days and days offered both need to be numbers.",
  invalid: "That could not be saved:",
};

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

  const [availability, status, busy] = await Promise.all([
    getAvailability(),
    availabilityStatus(),
    getBusyIntervals(),
  ]);

  const win = (day: number, half: number) =>
    availability.windows.filter((w) => w.day === day)[half];
  /* A field's starting value: what was typed, when a save was just rejected (an
     absent key means he had cleared that field), else what is stored. */
  const start = (name: string, stored: string | number) => (draft ? draft[name] ?? "" : stored);

  const smtpOn = Boolean(process.env.SMTP_HOST);
  const notifyReal = Boolean(
    (process.env.MIGAS_NOTIFY_TO ?? SITE.email) &&
      !(process.env.MIGAS_NOTIFY_TO ?? SITE.email).startsWith("PLACEHOLDER")
  );
  const feedUrl = Boolean(process.env.MIGAS_BUSY_ICS_URL);

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
      <dl className="mt-10 grid gap-px overflow-hidden rounded-xl2 border border-line bg-line sm:grid-cols-2 lg:grid-cols-4">
        {[
          {
            k: "Saving changes",
            ok: status.configured,
            yes: status.stored ? "On, and your saved hours are live" : "On, saving for the first time works",
            no: "Off. Storage isn't connected yet, so changes here can't be saved. Ask Glazed Web to connect it",
          },
          {
            k: "Your calendar",
            ok: feedUrl,
            yes: `Connected, ${busy.length} busy ${busy.length === 1 ? "block" : "blocks"} in the next two weeks`,
            no: "Not connected. Send Glazed Web your calendar's private iCal link, and the times you're busy will drop off the booking page",
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
        ].map((s) => (
          <div key={s.k} className="bg-ink-panel px-5 py-5">
            <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">{s.k}</dt>
            <dd className={`mt-2 text-sm leading-relaxed ${s.ok ? "text-bone" : "text-alert"}`}>
              {s.ok ? s.yes : s.no}
            </dd>
          </div>
        ))}
      </dl>

      <form action={saveAvailabilityAction} className="mt-12">
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
