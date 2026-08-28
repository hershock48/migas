import { toInstantIn } from "./ics";
import { AVAILABILITY } from "./site";

/**
 * The busy feed: what closes the double-booking gap.
 *
 * lib/slots.ts has always said plainly that a weekly pattern does not know what is
 * already booked, and that the fix is a calendar feed, not hand-written state. This is
 * that feed. Point MIGAS_BUSY_ICS_URL at the private "secret address in iCal format"
 * of his own calendar (Google, iCloud and Outlook all publish one), and every event on
 * it removes the slots it covers. The loop this closes is the one the .ics invite
 * opens: a confirmed booking lands on his calendar, his calendar feeds this, and the
 * slot disappears for the next visitor. His calendar stays the single record.
 *
 * WHAT IT DELIBERATELY DOES NOT DO. Recurring events (RRULE) are not expanded. That is
 * a real limitation, stated rather than hidden: expanding RRULE correctly means
 * COUNT, UNTIL, BYDAY, EXDATE and the DST edge of each, which is a library's worth of
 * code guarding against a case his weekly AVAILABILITY windows already encode. The
 * windows say when he works; the feed exists for one-off collisions, and one-off
 * events are single VEVENTs. When the feed carries recurring events they are counted
 * and logged so the gap is visible in the server log, not silently absorbed.
 *
 * FAILURE IS OPEN, NOT CLOSED. If the feed is unset, unreachable, or unparseable, the
 * grid renders from the windows alone, exactly as it did before this file existed. A
 * calendar outage must never take the booking form down; the cost of the open failure
 * is a possible double-booking, which the confirmation email flow already survives (he
 * confirms by reply, so a collision costs an apology rather than a no-show).
 */

export type BusyInterval = { start: number; end: number };

const FEED_TTL_MS = 5 * 60_000;

/** Module-level cache. One fetch per five minutes per server instance, so the feed
 *  host is not hammered and a burst of visitors costs one request. */
let cache: { at: number; url: string; intervals: BusyInterval[] } | null = null;

/** Unfold RFC 5545 lines: a CRLF (or LF) followed by space or tab continues the line. */
const unfold = (text: string) => text.replace(/\r?\n[ \t]/g, "");

/**
 * Windows timezone names, the ones Outlook writes into TZID. Intl only speaks IANA
 * and throws RangeError on these, and an Outlook meeting invite is a certainty on a
 * US consultant's calendar. The four US zones cover the realistic traffic; anything
 * else unrecognized skips that one event (see the per-event catch in parseBusy)
 * rather than blanking the feed, which is the fault this map exists to prevent.
 */
const WINDOWS_ZONES: Record<string, string> = {
  "Eastern Standard Time": "America/New_York",
  "Central Standard Time": "America/Chicago",
  "Mountain Standard Time": "America/Denver",
  "Pacific Standard Time": "America/Los_Angeles",
};

/**
 * One DTSTART/DTEND value, in any of the three shapes calendars actually emit:
 *   DTSTART:20260827T130000Z                    an instant
 *   DTSTART;TZID=America/Detroit:20260827T0900  wall time in a named zone
 *   DTSTART;VALUE=DATE:20260827                 an all-day date
 * Returns epoch ms, or null when the value cannot be read. All-day dates resolve in
 * the availability zone, since that is the zone the slot grid lives in. An unknown
 * TZID throws (Intl's RangeError), which the per-event catch in parseBusy turns
 * into one skipped event.
 */
function parseWhen(params: string, value: string): number | null {
  const v = value.trim();
  const allDay = /VALUE=DATE(?:;|$)/.test(params) || /^\d{8}$/.test(v);
  if (allDay) {
    const m = /^(\d{4})(\d{2})(\d{2})$/.exec(v);
    if (!m) return null;
    return toInstantIn(`${m[1]}-${m[2]}-${m[3]}T00:00`, AVAILABILITY.timeZone).getTime();
  }
  const m = /^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})?(Z)?$/.exec(v);
  if (!m) return null;
  const local = `${m[1]}-${m[2]}-${m[3]}T${m[4]}:${m[5]}`;
  if (m[7] === "Z") return Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5], +(m[6] ?? 0));
  // Outlook quotes some TZIDs; strip the quotes before the lookup.
  const raw = /TZID=([^;:]+)/.exec(params)?.[1]?.replace(/^"|"$/g, "");
  const tzid = raw ? (WINDOWS_ZONES[raw] ?? raw) : AVAILABILITY.timeZone;
  return toInstantIn(local, tzid).getTime();
}

/** Parse the events of one ICS document into busy intervals. Exported for the admin
 *  page's feed check; everything else goes through getBusyIntervals. */
export function parseBusy(ics: string, windowStart: number, windowEnd: number): BusyInterval[] {
  const intervals: BusyInterval[] = [];
  let recurring = 0;
  let unreadable = 0;

  for (const block of unfold(ics).split("BEGIN:VEVENT").slice(1)) {
    // Per-event isolation, and it was earned the hard way: before this try, one
    // event carrying a TZID Intl does not know threw out of the whole function,
    // getBusyIntervals caught it, and a single Outlook invite silently blanked
    // every busy block on the calendar. One unreadable event costs that event.
    try {
      const body = block.split("END:VEVENT")[0];
      // Free time and cancellations do not block. TRANSP:TRANSPARENT is how "free" is
      // spelled; STATUS:CANCELLED is an event that no longer exists.
      if (/^TRANSP:TRANSPARENT\s*$/m.test(body)) continue;
      if (/^STATUS:CANCELLED\s*$/m.test(body)) continue;
      if (/^RRULE[:;]/m.test(body)) {
        recurring++;
        continue;
      }

      const dtstart = /^DTSTART([^:]*):(.+)$/m.exec(body);
      if (!dtstart) continue;
      const start = parseWhen(dtstart[1], dtstart[2]);
      if (start === null) continue;

      const dtend = /^DTEND([^:]*):(.+)$/m.exec(body);
      let end = dtend ? parseWhen(dtend[1], dtend[2]) : null;
      if (end === null) {
        // No DTEND: an all-day event runs a day, anything else defaults to zero length
        // per the spec; a zero-length event cannot collide, so give it an hour instead
        // of pretending precision the data does not have.
        const allDay = /VALUE=DATE/.test(dtstart[1]) || /^\d{8}$/.test(dtstart[2].trim());
        end = start + (allDay ? 86_400_000 : 3_600_000);
      }

      if (end <= windowStart || start >= windowEnd) continue;
      intervals.push({ start, end });
    } catch {
      unreadable++;
    }
  }

  if (recurring > 0) {
    console.warn(
      `[migas] Busy feed: ${recurring} recurring event(s) not expanded. ` +
        `Recurring commitments belong in the availability windows (see /admin), ` +
        `not in the feed.`
    );
  }
  if (unreadable > 0) {
    console.warn(
      `[migas] Busy feed: ${unreadable} event(s) skipped as unreadable ` +
        `(usually a timezone name Intl does not know). Those events do not block slots.`
    );
  }
  return intervals;
}

/**
 * The busy intervals overlapping the booking horizon, or [] when no feed is set or
 * the feed cannot be read. Cached five minutes.
 */
export async function getBusyIntervals(now: Date = new Date()): Promise<BusyInterval[]> {
  const url = process.env.MIGAS_BUSY_ICS_URL;
  if (!url) return [];
  if (cache && cache.url === url && now.getTime() - cache.at < FEED_TTL_MS) {
    return cache.intervals;
  }
  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) throw new Error(`feed answered ${res.status}`);
    const horizon = (AVAILABILITY.leadDays + AVAILABILITY.horizonDays + 2) * 86_400_000;
    const intervals = parseBusy(await res.text(), now.getTime(), now.getTime() + horizon);
    cache = { at: now.getTime(), url, intervals };
    return intervals;
  } catch (err) {
    // Open failure, logged. See the header: an unreachable calendar must never take
    // the booking form down. A stale cache from the last good read beats nothing.
    console.error("[migas] Busy feed unreachable, slots render from windows alone", err);
    return cache?.url === url ? cache.intervals : [];
  }
}
