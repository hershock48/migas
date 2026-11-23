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

/** Exchange also writes the long form, "(UTC-05:00) Eastern Time (US & Canada)". */
const windowsZoneByName = (raw: string): string | undefined =>
  /Eastern/i.test(raw) ? "America/New_York" : /Central/i.test(raw) ? "America/Chicago" : /Mountain/i.test(raw) ? "America/Denver" : /Pacific/i.test(raw) ? "America/Los_Angeles" : undefined;

/**
 * One property line of an event: its parameters and its value. The split is
 * at the first colon that is not inside quotes. Splitting at the first colon
 * of any kind dropped every event whose timezone name is quoted and contains
 * one, which is how some Exchange invites write it, and dropped it without
 * counting it (review, 2026-11-19).
 */
function prop(body: string, name: string): { params: string; value: string } | null {
  const m = new RegExp(`^${name}((?:;(?:[^:"\\r\\n]|"[^"\\r\\n]*")*)?):(.+)$`, "m").exec(body);
  return m ? { params: m[1], value: m[2] } : null;
}

/** DURATION, the other way an event says how long it is: P1D, PT4H, PT1H30M, P1W. */
function durationMs(body: string): number | null {
  const m = /^DURATION:\s*P(?:(\d+)W)?(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?)?\s*$/m.exec(body);
  if (!m) return null;
  const ms = (+(m[1] ?? 0) * 7 + +(m[2] ?? 0)) * 86_400_000 + +(m[3] ?? 0) * 3_600_000 + +(m[4] ?? 0) * 60_000 + +(m[5] ?? 0) * 1000;
  return ms > 0 ? ms : null;
}

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
  const tz = /TZID=(?:"([^"]+)"|([^;:]+))/.exec(params);
  const raw = tz?.[1] ?? tz?.[2];
  const zone = raw ? (WINDOWS_ZONES[raw] ?? windowsZoneByName(raw) ?? raw) : AVAILABILITY.timeZone;
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
  /* WHERE THE WALK STARTS. A series with no COUNT does not need its earlier
     occurrences counted, so the walk begins two days before the window. It
     used to begin at the series' first day and resolve every occurrence's
     timezone on the way: a daily event from four years back cost 130 ms on
     every read, and a series more than twenty years old ran out of walk and
     produced nothing at all (review, 2026-11-19). With a COUNT the earlier
     occurrences still have to be counted, but only counted: their instants
     are not resolved. */
  const i0 = count === Infinity ? Math.max(0, Math.floor((windowStart - first) / DAY) - 2) : 0;
  for (let i = i0; i < i0 + MAX_WALK_DAYS && made < count; i++) {
    const dayMs = first + i * DAY;
    // Nothing this late can reach the window; a day of slack covers any zone.
    if (dayMs - DAY > windowEnd) break;
    if (freq === "DAILY" && i % interval !== 0) continue;
    if (freq === "WEEKLY" && Math.floor((i + intoWeek) / 7) % interval !== 0) continue;
    if (wanted && !wanted.includes(new Date(dayMs).getUTCDay())) continue;
    if (dayMs + 2 * DAY < windowStart) {
      if (dayMs - DAY > until) break;
      made++;
      continue;
    }
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
      const rid = prop(body, "RECURRENCE-ID");
      const uid = /^UID:(.+)$/m.exec(body)?.[1]?.trim();
      if (!rid || !uid) continue;
      const when = parseWhen(rid.params, rid.value);
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

      const dtstart = prop(body, "DTSTART");
      if (!dtstart) continue;
      const start = parseWhen(dtstart.params, dtstart.value);
      // A start that cannot be read is an event that does not block. Say so:
      // it used to be skipped without being counted, so /admin showed nothing.
      if (start === null) {
        unreadable++;
        continue;
      }

      const dtend = prop(body, "DTEND");
      const endWhen = dtend ? parseWhen(dtend.params, dtend.value) : null;
      const hasDuration = durationMs(body);

      // Extra dates a series or a single event also happens on.
      for (const rd of body.matchAll(/^RDATE((?:;(?:[^:"\r\n]|"[^"\r\n]*")*)?):(.+)$/gm)) {
        for (const v of rd[2].split(",")) {
          const w = parseWhen(rd[1], v.split("/")[0]);
          if (!w) {
            unreadable++;
            continue;
          }
          const len = endWhen ? endWhen.ms - start.ms : (hasDuration ?? (start.allDay ? DAY : 3_600_000));
          if (w.ms + len > windowStart && w.ms < windowEnd) intervals.push({ start: w.ms, end: w.ms + len });
        }
      }
      // No DTEND: its DURATION if it gives one. With neither, an all-day event runs a day, anything else defaults to zero length
      // per the spec; a zero-length event cannot collide, so give it an hour instead
      // of pretending precision the data does not have.
      const end = endWhen ? endWhen.ms : start.ms + (hasDuration ?? (start.allDay ? DAY : 3_600_000));

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
  /** How many calendar links are set. */
  feeds?: number;
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

/** One link or several, separated by spaces or new lines (or by a comma before
 *  the next link). iCloud and Outlook hand theirs out as webcal://, which is https
 *  under another name that fetch does not know, so it is rewritten here. */
const feedUrls = (): string[] =>
  (process.env.MIGAS_BUSY_ICS_URL ?? "")
    .split(/\s+|,(?=\s*(?:https?|webcals?):)/i)
    .map((u) => u.trim().replace(/^webcals?:\/\//i, "https://"))
    .filter(Boolean);

/** Each link's last good reading, kept for the times that link does not answer. */
const lastGood = new Map<string, BusyInterval[]>();

/**
 * The busy intervals overlapping the booking horizon, or [] when no feed is set or
 * the feed cannot be read. Cached five minutes.
 */
export async function getBusyIntervals(now: Date = new Date()): Promise<BusyInterval[]> {
  const urls = feedUrls();
  if (urls.length === 0) {
    lastStatus = { connected: false, ok: false, blocks: 0, repeating: 0, unsupported: 0, unreadable: 0 };
    return [];
  }
  const key = urls.join(" ");
  if (cache && cache.url === key && now.getTime() - cache.at < FEED_TTL_MS) {
    return cache.intervals;
  }
  /* SEVERAL CALENDARS, EACH READ ON ITS OWN. He keeps more than one (call of
     2026-11-22: an iCloud calendar and one under each of two email accounts),
     and a phone shares each as its own link. One link not answering must not
     drop the others: each keeps its own last good reading, and that is what
     is used for a link that fails this time. */
  const read = await Promise.all(
    urls.map(async (url) => {
      try {
        const res = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(8_000) });
        if (!res.ok) throw new Error(`the calendar answered ${res.status}`);
        const text = await res.text();
        if (!text.includes("BEGIN:VCALENDAR")) throw new Error("the link did not return a calendar");
        const parsed = parseFeed(text, now.getTime(), now.getTime() + FEED_WINDOW_MS);
        lastGood.set(url, parsed.intervals);
        return { ok: true as const, parsed };
      } catch (err) {
        console.error("[migas] A busy calendar link is unreachable; its last good reading is used", err);
        return { ok: false as const, error: err instanceof Error ? err.message : String(err), stale: lastGood.get(url) ?? [] };
      }
    }),
  );
  const intervals = read.flatMap((r) => (r.ok ? r.parsed.intervals : r.stale));
  const good = read.flatMap((r) => (r.ok ? [r.parsed] : []));
  const failed = read.flatMap((r) => (r.ok ? [] : [r.error]));
  const sum = (pick: (p: FeedReading) => number) => good.reduce((n, p) => n + pick(p), 0);
  lastStatus = {
    connected: true,
    ok: failed.length === 0,
    feeds: urls.length,
    blocks: intervals.length,
    repeating: sum((p) => p.repeating),
    unsupported: sum((p) => p.unsupported),
    unreadable: sum((p) => p.unreadable),
    ...(failed.length
      ? { error: urls.length > 1 ? `${failed.length} of your ${urls.length} calendar links: ${failed[0]}` : failed[0] }
      : {}),
  };
  // After a failure, look again in a minute instead of in five.
  cache = { at: failed.length ? now.getTime() - FEED_TTL_MS + 60_000 : now.getTime(), url: key, intervals };
  return intervals;
}

/** For /admin: read the feed now and say how it went. */
export async function busyFeedStatus(now: Date = new Date()): Promise<FeedStatus> {
  await getBusyIntervals(now);
  return lastStatus;
}
