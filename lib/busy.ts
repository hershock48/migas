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
 * REPEATING EVENTS. Daily and weekly rules are expanded (see `expand` below). Monthly
 * and yearly rules are not: they are counted, logged, and shown on /admin, so a
 * standing monthly commitment belongs in the weekly hours or as a day off there.
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
 * else unrecognized skips that one event (see the per-event catch in parseFeed)
 * rather than blanking the feed, which is the fault this map exists to prevent.
 */
const WINDOWS_ZONES: Record<string, string> = {
  "Eastern Standard Time": "America/New_York",
  "Central Standard Time": "America/Chicago",
  "Mountain Standard Time": "America/Denver",
  "Pacific Standard Time": "America/Los_Angeles",
};

type When = {
  /** The instant, epoch ms. */
  ms: number;
  /** The wall-clock reading it was written as, "YYYY-MM-DDTHH:MM". */
  local: string;
  /** The zone that wall clock is in; "UTC" for a Z time. */
  zone: string;
  allDay: boolean;
};

/**
 * One DTSTART/DTEND value, in any of the three shapes calendars actually emit:
 *   DTSTART:20260827T130000Z                    an instant
 *   DTSTART;TZID=America/Detroit:20260827T0900  wall time in a named zone
 *   DTSTART;VALUE=DATE:20260827                 an all-day date
 * Returns null when the value cannot be read. All-day dates resolve in the
 * availability zone, since that is the zone the slot grid lives in. An unknown
 * TZID throws (Intl's RangeError), which the per-event catch in parseFeed turns
 * into one skipped event.
 */
function parseWhen(params: string, value: string): When | null {
  const v = value.trim();
  const allDay = /VALUE=DATE(?:;|$)/.test(params) || /^\d{8}$/.test(v);
  if (allDay) {
    const m = /^(\d{4})(\d{2})(\d{2})$/.exec(v);
    if (!m) return null;
    const local = `${m[1]}-${m[2]}-${m[3]}T00:00`;
    return { ms: toInstantIn(local, AVAILABILITY.timeZone).getTime(), local, zone: AVAILABILITY.timeZone, allDay: true };
  }
  const m = /^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})?(Z)?$/.exec(v);
  if (!m) return null;
  const local = `${m[1]}-${m[2]}-${m[3]}T${m[4]}:${m[5]}`;
  if (m[7] === "Z") {
    return { ms: Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5], +(m[6] ?? 0)), local, zone: "UTC", allDay: false };
  }
  // Outlook quotes some TZIDs; strip the quotes before the lookup.
  const raw = /TZID=([^;:]+)/.exec(params)?.[1]?.replace(/^"|"$/g, "");
  const zone = raw ? (WINDOWS_ZONES[raw] ?? raw) : AVAILABILITY.timeZone;
  return { ms: toInstantIn(local, zone).getTime(), local, zone, allDay: false };
}

const instantOf = (local: string, zone: string) =>
  zone === "UTC" ? Date.parse(`${local}:00Z`) : toInstantIn(local, zone).getTime();

const DAY = 86_400_000;
const BYDAY: Record<string, number> = { SU: 0, MO: 1, TU: 2, WE: 3, TH: 4, FR: 5, SA: 6 };
/** A daily rule with no end, walked from its first day: 20 years is the stop. */
const MAX_WALK_DAYS = 7_300;

/**
 * The occurrences of a repeating event that fall inside the window.
 *
 * ADDED 2026-11-12. Repeating events used to be skipped whole ("recurring
 * commitments belong in the availability windows"), which is not what somebody who
 * connects his calendar expects: a weekly Tuesday 9:30 meeting left Tuesday 9:30
 * bookable, every week. Daily and weekly rules are expanded here, which is what a
 * working calendar is mostly made of: INTERVAL, BYDAY, COUNT, UNTIL, EXDATE, and a
 * single occurrence moved or cancelled on its own (RECURRENCE-ID, passed in as
 * `replaced`). Monthly and yearly rules are still not expanded; they are counted,
 * and /admin says how many, so the gap is on the screen he reads and not in a log.
 *
 * The walk is by calendar day in the event's own zone, so a 9:30 meeting stays at
 * 9:30 across a clock change. Returns null for a rule this does not handle.
 */
function expand(
  rule: string,
  start: When,
  durationMs: number,
  exclude: Set<number>,
  windowStart: number,
  windowEnd: number
): BusyInterval[] | null {
  const part = (k: string) => new RegExp(`(?:^|;)${k}=([^;]+)`).exec(rule)?.[1];
  const freq = part("FREQ");
  if (freq !== "DAILY" && freq !== "WEEKLY") return null;
  // Rules that pick occurrences by position or month are beyond this walk.
  if (part("BYSETPOS") || part("BYMONTH") || part("BYMONTHDAY") || part("BYYEARDAY") || part("BYWEEKNO")) return null;
  const interval = Math.max(1, Number(part("INTERVAL") ?? 1) || 1);
  const count = part("COUNT") ? Number(part("COUNT")) : Infinity;
  const untilRaw = part("UNTIL");
  let until = Infinity;
  if (untilRaw) {
    const u = parseWhen("", untilRaw);
    if (!u) return null;
    until = u.allDay ? u.ms + DAY - 1 : u.ms;
  }
  const byday = part("BYDAY");
  let days: number[] | null = null;
  if (byday) {
    days = [];
    for (const d of byday.split(",")) {
      // "2TU" (the second Tuesday) only means something in a monthly rule.
      if (!(d in BYDAY)) return null;
      days.push(BYDAY[d]);
    }
  }
  const wkst = BYDAY[part("WKST") ?? "MO"] ?? 1;

  const [date, time] = start.local.split("T");
  const [y, mo, d] = date.split("-").map(Number);
  const first = Date.UTC(y, mo - 1, d);
  const firstDow = new Date(first).getUTCDay();
  // Days from the start of the first occurrence's week to the first occurrence.
  const intoWeek = (firstDow - wkst + 7) % 7;
  const wanted = days ?? (freq === "WEEKLY" ? [firstDow] : null);

  const out: BusyInterval[] = [];
  let made = 0;
  for (let i = 0; i < MAX_WALK_DAYS && made < count; i++) {
    const dayMs = first + i * DAY;
    // Nothing this late can reach the window; a day of slack covers any zone.
    if (dayMs - DAY > windowEnd) break;
    if (freq === "DAILY" && i % interval !== 0) continue;
    if (freq === "WEEKLY" && Math.floor((i + intoWeek) / 7) % interval !== 0) continue;
    if (wanted && !wanted.includes(new Date(dayMs).getUTCDay())) continue;
    const at = instantOf(`${new Date(dayMs).toISOString().slice(0, 10)}T${time}`, start.zone);
    if (at > until) break;
    made++;
    if (exclude.has(at)) continue;
    if (at + durationMs <= windowStart || at >= windowEnd) continue;
    out.push({ start: at, end: at + durationMs });
  }
  return out;
}

export type FeedReading = {
  intervals: BusyInterval[];
  /** Repeating events read and expanded. */
  repeating: number;
  /** Repeating events on a rule this does not expand (monthly, yearly). */
  unsupported: number;
  /** Events skipped because a time on them could not be read. */
  unreadable: number;
};

/** Parse one ICS document into the busy intervals inside the window. */
export function parseFeed(ics: string, windowStart: number, windowEnd: number): FeedReading {
  const intervals: BusyInterval[] = [];
  let repeating = 0;
  let unsupported = 0;
  let unreadable = 0;
  const blocks = unfold(ics)
    .split("BEGIN:VEVENT")
    .slice(1)
    .map((b) => b.split("END:VEVENT")[0]);

  /* First pass: single occurrences of a series that were moved or cancelled on their
     own. Each is its own VEVENT carrying the series' UID and a RECURRENCE-ID naming
     the occurrence it replaces, so the series must not also produce that one. */
  const replaced = new Map<string, Set<number>>();
  for (const body of blocks) {
    try {
      const rid = /^RECURRENCE-ID([^:]*):(.+)$/m.exec(body);
      const uid = /^UID:(.+)$/m.exec(body)?.[1]?.trim();
      if (!rid || !uid) continue;
      const when = parseWhen(rid[1], rid[2]);
      if (!when) continue;
      if (!replaced.has(uid)) replaced.set(uid, new Set());
      replaced.get(uid)!.add(when.ms);
    } catch {
      /* counted in the second pass */
    }
  }

  for (const body of blocks) {
    // Per-event isolation, and it was earned the hard way: before this try, one
    // event carrying a TZID Intl does not know threw out of the whole function,
    // getBusyIntervals caught it, and a single Outlook invite silently blanked
    // every busy block on the calendar. One unreadable event costs that event.
    try {
      // Free time and cancellations do not block. TRANSP:TRANSPARENT is how "free" is
      // spelled; STATUS:CANCELLED is an event that no longer exists.
      if (/^TRANSP:TRANSPARENT\s*$/m.test(body)) continue;
      if (/^STATUS:CANCELLED\s*$/m.test(body)) continue;

      const dtstart = /^DTSTART([^:]*):(.+)$/m.exec(body);
      if (!dtstart) continue;
      const start = parseWhen(dtstart[1], dtstart[2]);
      if (start === null) continue;

      const dtend = /^DTEND([^:]*):(.+)$/m.exec(body);
      const endWhen = dtend ? parseWhen(dtend[1], dtend[2]) : null;
      // No DTEND: an all-day event runs a day, anything else defaults to zero length
      // per the spec; a zero-length event cannot collide, so give it an hour instead
      // of pretending precision the data does not have.
      const end = endWhen ? endWhen.ms : start.ms + (start.allDay ? DAY : 3_600_000);

      const rule = /^RRULE:(.+)$/m.exec(body)?.[1]?.trim();
      if (rule) {
        const exclude = new Set<number>();
        for (const ex of body.matchAll(/^EXDATE([^:]*):(.+)$/gm)) {
          for (const v of ex[2].split(",")) {
            const w = parseWhen(ex[1], v);
            if (w) exclude.add(w.ms);
          }
        }
        const uid = /^UID:(.+)$/m.exec(body)?.[1]?.trim();
        for (const ms of (uid && replaced.get(uid)) || []) exclude.add(ms);
        const occurrences = expand(rule, start, end - start.ms, exclude, windowStart, windowEnd);
        if (occurrences === null) {
          unsupported++;
          continue;
        }
        repeating++;
        intervals.push(...occurrences);
        continue;
      }

      if (end <= windowStart || start.ms >= windowEnd) continue;
      intervals.push({ start: start.ms, end });
    } catch {
      unreadable++;
    }
  }

  if (unsupported > 0) {
    console.warn(
      `[migas] Busy feed: ${unsupported} repeating event(s) on a monthly or yearly rule are not read. ` +
        `They do not block slots; /admin shows the count.`
    );
  }
  if (unreadable > 0) {
    console.warn(
      `[migas] Busy feed: ${unreadable} event(s) skipped as unreadable ` +
        `(usually a timezone name Intl does not know). Those events do not block slots.`
    );
  }
  return { intervals, repeating, unsupported, unreadable };
}

export type FeedStatus = {
  /** A link is set. */
  connected: boolean;
  /** The last read worked. False with `connected` means the link is not answering. */
  ok: boolean;
  blocks: number;
  repeating: number;
  unsupported: number;
  unreadable: number;
  error?: string;
};

let lastStatus: FeedStatus = { connected: false, ok: false, blocks: 0, repeating: 0, unsupported: 0, unreadable: 0 };

/**
 * How far ahead events are kept. It was the default lead time plus the default days
 * offered, 18 days, taken from lib/site.ts. But /admin lets him offer up to 60 days
 * with up to 30 of lead time, and every event past day 18 was dropped here, so those
 * later days were offered as if his calendar were empty. This covers the most the
 * admin page allows.
 */
const FEED_WINDOW_MS = (30 + 60 + 2) * DAY;

/** iCloud and Outlook hand out their private link as webcal://, which is https
 *  under another name and which fetch refuses. */
const feedUrl = () => (process.env.MIGAS_BUSY_ICS_URL ?? "").trim().replace(/^webcals?:\/\//i, "https://");

/**
 * The busy intervals overlapping the booking horizon, or [] when no feed is set or
 * the feed cannot be read. Cached five minutes.
 */
export async function getBusyIntervals(now: Date = new Date()): Promise<BusyInterval[]> {
  const url = feedUrl();
  if (!url) {
    lastStatus = { connected: false, ok: false, blocks: 0, repeating: 0, unsupported: 0, unreadable: 0 };
    return [];
  }
  if (cache && cache.url === url && now.getTime() - cache.at < FEED_TTL_MS) {
    return cache.intervals;
  }
  try {
    // Eight seconds: a calendar host that hangs must not hang the booking page.
    const res = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(8_000) });
    if (!res.ok) throw new Error(`the calendar answered ${res.status}`);
    const text = await res.text();
    if (!text.includes("BEGIN:VCALENDAR")) throw new Error("the link did not return a calendar");
    const read = parseFeed(text, now.getTime(), now.getTime() + FEED_WINDOW_MS);
    cache = { at: now.getTime(), url, intervals: read.intervals };
    lastStatus = {
      connected: true,
      ok: true,
      blocks: read.intervals.length,
      repeating: read.repeating,
      unsupported: read.unsupported,
      unreadable: read.unreadable,
    };
    return read.intervals;
  } catch (err) {
    // Open failure, logged. See the header: an unreachable calendar must never take
    // the booking form down. A stale cache from the last good read beats nothing.
    console.error("[migas] Busy feed unreachable, slots render from windows alone", err);
    lastStatus = {
      connected: true,
      ok: false,
      blocks: 0,
      repeating: 0,
      unsupported: 0,
      unreadable: 0,
      error: err instanceof Error ? err.message : String(err),
    };
    // Remember the failure for a minute. Without this every visitor to the booking
    // page waited out the full eight seconds while the calendar host was down.
    const stale = cache?.url === url ? cache.intervals : [];
    cache = { at: now.getTime() - FEED_TTL_MS + 60_000, url, intervals: stale };
    return stale;
  }
}

/** For /admin: read the feed now and say how it went. */
export async function busyFeedStatus(now: Date = new Date()): Promise<FeedStatus> {
  await getBusyIntervals(now);
  return lastStatus;
}
