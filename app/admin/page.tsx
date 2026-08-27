import type { Metadata } from "next";
import { cookies } from "next/headers";
import { ADMIN_COOKIE, cookieIsValid, pinConfigured } from "@/lib/admin-auth";
import { availabilityStatus, getAvailability } from "@/lib/availability";
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
  "signed-out": "You were signed out. Sign in and save again; nothing was lost from the form.",
  "half-window": "A window needs both an open and a close time. One of them has only one.",
  "bad-days": "Lead days and days offered both need to be numbers.",
  invalid: "That could not be saved:",
};

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
      {error && MESSAGES[error] && (
        <p role="alert" className="mt-6 max-w-xl rounded-xl2 border border-alert/50 bg-ink-panel p-4 text-[15px] text-alert">
          {MESSAGES[error]}
          {error === "invalid" && detail ? ` ${detail}` : ""}
        </p>
      )}

      {/* ── Status, before the form: what the machinery around the form is doing ── */}
      <dl className="mt-10 grid gap-px overflow-hidden rounded-xl2 border border-line bg-line sm:grid-cols-2 lg:grid-cols-4">
        {[
          {
            k: "Saving changes",
            ok: status.configured,
            yes: status.stored ? "On, and your saved hours are live" : "On, saving for the first time works",
            no: "Off. Add a Blob store to the Vercel project; edits here cannot be kept until then",
          },
          {
            k: "Your calendar",
            ok: feedUrl,
            yes: `Connected, ${busy.length} busy ${busy.length === 1 ? "block" : "blocks"} in the next two weeks`,
            no: "Not connected. Set MIGAS_BUSY_ICS_URL to your calendar's private iCal address and booked times drop off the grid",
          },
          {
            k: "Outgoing mail",
            ok: smtpOn,
            yes: "On, bookings and invites send",
            no: "Off. Bookings only reach the server log until SMTP is set",
          },
          {
            k: "Where bookings land",
            ok: notifyReal,
            yes: process.env.MIGAS_NOTIFY_TO ?? SITE.email,
            no: "No real address yet, so nothing can be delivered to you",
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
          Times are {AVAILABILITY.timeZoneLabel}, up to two windows a day. Leave a row
          empty and the day is off. Calls are offered inside these windows in{" "}
          {AVAILABILITY.stepMinutes}-minute steps.
        </p>

        <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-[560px] border-collapse text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-[0.14em] text-muted">
                <th className="py-2 pr-4 font-semibold">Day</th>
                <th className="py-2 pr-4 font-semibold">Open</th>
                <th className="py-2 pr-4 font-semibold">Close</th>
                <th className="py-2 pr-4 font-semibold">Second open</th>
                <th className="py-2 font-semibold">Second close</th>
              </tr>
            </thead>
            <tbody>
              {DAY_NAMES.map((name, day) => (
                <tr key={name} className="border-t border-line">
                  <th scope="row" className="py-3 pr-4 text-left font-medium text-bone">
                    {name}
                  </th>
                  {([0, 1] as const).flatMap((half) => {
                    const w = win(day, half);
                    const prefix = `w${day}${half === 0 ? "a" : "b"}`;
                    return [
                      <td key={`${prefix}f`} className="py-3 pr-4">
                        <input
                          type="time"
                          name={`${prefix}_from`}
                          defaultValue={w?.from ?? ""}
                          aria-label={`${name}, ${half === 0 ? "first" : "second"} window opens`}
                          className="rounded-lg border border-edge bg-ink px-3 py-2 text-bone"
                        />
                      </td>,
                      <td key={`${prefix}t`} className="py-3 pr-4">
                        <input
                          type="time"
                          name={`${prefix}_to`}
                          defaultValue={w?.to ?? ""}
                          aria-label={`${name}, ${half === 0 ? "first" : "second"} window closes`}
                          className="rounded-lg border border-edge bg-ink px-3 py-2 text-bone"
                        />
                      </td>,
                    ];
                  })}
                </tr>
              ))}
            </tbody>
          </table>
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
              defaultValue={availability.blockedDates.join("\n")}
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
                defaultValue={availability.leadDays}
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
                defaultValue={availability.horizonDays}
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
