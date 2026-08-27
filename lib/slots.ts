import { toInstant } from "./ics";
import { AVAILABILITY, SESSIONS } from "./site";

/**
 * Slot generation.
 *
 * WHAT THIS IS. Given weekly windows, it produces the next couple of weeks of
 * bookable times as plain data, so the booking form can render them as real radio
 * inputs on the server. That is the reason to generate them here rather than in the
 * browser: the times exist in the HTML, so the form works with JavaScript switched
 * off, and a screen reader gets the same thing a mouse does.
 *
 * THE SEAM THIS FILE SPENT ITS FIRST WEEKS PROMISING IS NOW FILLED. The header used
 * to say, honestly, that a weekly pattern does not know what is already booked and
 * that a calendar feed belongs here. It does now: `slotGrid` takes a
 * RuntimeAvailability whose windows come from the /admin editor (lib/availability.ts)
 * and whose `busy` intervals come from his own calendar's ICS feed (lib/busy.ts). A
 * slot that collides with a calendar event is either shortened to the session that
 * still fits before it, or dropped. Called with no runtime it behaves exactly as it
 * always did — the static windows, nothing busy — which is what keeps it testable
 * with nothing mocked.
 *
 * WHAT IS STILL TRUE: two people submitting the same moment four seconds apart both
 * pass, because the feed only knows about a booking once it is on his calendar. The
 * confirmation flow absorbs that: he confirms by reply, so a collision costs an
 * apology, not a no-show.
 *
 * ONE GRID FOR ALL THREE SESSION LENGTHS. Slots step every 30 minutes, and each one
 * carries the longest session that still fits inside its window, so 10:30 in a window
 * that closes at noon offers a 90-minute consult and 11:30 does not. Rendering three
 * separate grids and hiding two of them was the first approach and it triples the DOM
 * to say the same thing.
 *
 * TIMEZONES. Every date is computed in AVAILABILITY.timeZone through Intl rather than
 * from the server's own offset, and every rendered time is labelled with the zone.
 * That pairing is deliberate: silently converting to the visitor's browser timezone is
 * how somebody dials in an hour late, and an hour is more expensive than a label.
 *
 * Days are stepped by anchoring each one at 12:00 UTC. Noon UTC is morning across the
 * Americas and evening across Europe and Asia, so adding 24 hours to it always lands
 * on the next calendar day in the target zone whether or not the clocks changed
 * overnight. Anchoring at midnight is the classic form of this bug.
 */

export type Slot = {
  /** Stable value posted by the form, e.g. "2026-08-12T09:30". Local to timeZone. */
  value: string;
  /** "9:30 AM" */
  time: string;
  /** Longest session, in minutes, that fits between here and the end of the window. */
  maxMinutes: number;
};

export type SlotDay = {
  /** "2026-08-12" */
  date: string;
  /** "Wed" */
  weekday: string;
  /** "Aug 12" */
  label: string;
  slots: Slot[];
};

/** What slotGrid actually renders from: the stored windows plus the calendar feed.
 *  lib/availability.ts assembles one; the default below reproduces the static build. */
export type RuntimeAvailability = {
  windows: readonly { day: number; from: string; to: string }[];
  /** "YYYY-MM-DD" days removed whole: harvests, holidays, travel. */
  blockedDates: readonly string[];
  leadDays: number;
  horizonDays: number;
  /** Busy intervals from his calendar, as epoch ms. */
  busy: readonly { start: number; end: number }[];
};

const STATIC_RUNTIME: RuntimeAvailability = {
  windows: AVAILABILITY.windows,
  blockedDates: [],
  leadDays: AVAILABILITY.leadDays,
  horizonDays: AVAILABILITY.horizonDays,
  busy: [],
};

const DAY_MS = 86_400_000;

/** Every session length the site offers, longest first. */
const LENGTHS = [...new Set(SESSIONS.map((s) => s.minutes))].sort((a, b) => b - a);

const parts = (d: Date) => {
  const f = new Intl.DateTimeFormat("en-US", {
    timeZone: AVAILABILITY.timeZone,
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
  });
  const out: Record<string, string> = {};
  for (const p of f.formatToParts(d)) if (p.type !== "literal") out[p.type] = p.value;
  return out;
};

const WEEKDAY_INDEX: Record<string, number> = {
  Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6,
};

const MONTHS: Record<string, string> = {
  Jan: "01", Feb: "02", Mar: "03", Apr: "04", May: "05", Jun: "06",
  Jul: "07", Aug: "08", Sep: "09", Oct: "10", Nov: "11", Dec: "12",
};

const minutes = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
};

const pad = (n: number) => String(n).padStart(2, "0");

const clock = (mins: number) => {
  const h24 = Math.floor(mins / 60);
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${h12}:${pad(mins % 60)} ${h24 < 12 ? "AM" : "PM"}`;
};

/**
 * The next AVAILABILITY.horizonDays of open times, skipping the lead-time days and any
 * day with no window. `now` is an argument rather than a call to the clock so this is
 * testable. This used to claim "which is the only reason a test for it exists" — there is
 * no test, and no test runner in the repo. The seam is still worth having: passing a fixed
 * `now` is how the staleness of a cached page was measured rather than argued about.
 *
 * KNOWN EDGE, and it is conservative rather than dangerous. The first offered day is
 * derived from UTC midnight, not from midnight in AVAILABILITY.timeZone, so between 8pm
 * and midnight Detroit time — when the UTC date has already rolled over — the earliest
 * bookable day is leadDays + 1 rather than leadDays. It never offers a slot too soon; it
 * loses one day of availability during evenings. Fixing it properly means resolving the
 * zone's own day boundary, which is the same work as the calendar-feed seam below.
 */
export function slotGrid(
  now: Date = new Date(),
  runtime: RuntimeAvailability = STATIC_RUNTIME
): SlotDay[] {
  const days: SlotDay[] = [];
  const start = now.getTime() + runtime.leadDays * DAY_MS;
  // Noon UTC on the first offered day. See the header comment for why noon.
  const firstNoon = Math.floor(start / DAY_MS) * DAY_MS + 12 * 60 * 60 * 1000;

  // A busy interval blocks a length when the two overlap at all. `start < b.end`
  // rather than <=, so a call may begin the minute a calendar event ends.
  const collides = (startMs: number, endMs: number) =>
    runtime.busy.some((b) => startMs < b.end && endMs > b.start);

  for (let i = 0; i < runtime.horizonDays; i++) {
    const p = parts(new Date(firstNoon + i * DAY_MS));
    const windows = runtime.windows.filter((w) => w.day === WEEKDAY_INDEX[p.weekday]);
    if (windows.length === 0) continue;

    const date = `${p.year}-${MONTHS[p.month]}-${pad(Number(p.day))}`;
    if (runtime.blockedDates.includes(date)) continue;

    const slots: Slot[] = [];
    for (const w of windows) {
      const close = minutes(w.to);
      for (let t = minutes(w.from); t + LENGTHS[LENGTHS.length - 1] <= close; t += AVAILABILITY.stepMinutes) {
        const value = `${date}T${pad(Math.floor(t / 60))}:${pad(t % 60)}`;
        // Epoch resolution only when there is something to collide with: 72 slots
        // times two Intl passes is measurable, and an empty calendar needs neither.
        const startMs = runtime.busy.length ? toInstant(value).getTime() : 0;
        const maxMinutes = LENGTHS.find(
          (m) =>
            t + m <= close &&
            (!runtime.busy.length || !collides(startMs, startMs + m * 60_000))
        );
        if (!maxMinutes) continue;
        slots.push({ value, time: clock(t), maxMinutes });
      }
    }
    if (slots.length === 0) continue;
    days.push({ date, weekday: p.weekday, label: `${p.month} ${p.day}`, slots });
  }

  return days;
}

/**
 * "Wed, Aug 12 at 9:30 AM Eastern (Michigan)" — one formatter, shared by the form, the
 * confirmation and the notification, so the three can never disagree about when the
 * call is.
 */
export function describeSlot(value: string): string {
  const [date, time] = value.split("T");
  if (!date || !time) return value;
  const [y, m, d] = date.split("-").map(Number);
  const p = parts(new Date(Date.UTC(y, m - 1, d, 12)));
  return `${p.weekday}, ${p.month} ${p.day} at ${clock(minutes(time))} ${AVAILABILITY.timeZoneLabel}`;
}
