import { AVAILABILITY } from "./site";
import { upcomingBookings } from "./bookings";
import { getBusyIntervals } from "./busy";
import { slotGrid, type Block, type RuntimeAvailability, type SlotDay } from "./slots";

/**
 * Availability he can change himself, which is the half of "Calendly but better" the
 * first build did not have.
 *
 * On the 2026-08-27 call he asked for time frames that are easy to adjust. Until now
 * the windows lived in lib/site.ts, which means every change was a commit — fine for
 * us, useless to him at 6am when a harvest eats a morning. The windows now live in a
 * single JSON document in the project's Vercel Blob store, edited from /admin, read
 * here, with the lib/site.ts values as the defaults underneath.
 *
 * WHY BLOB AND NOT A DATABASE. The document is one small JSON object with one writer,
 * him. A database for that is architecture cosplay. Blob is part of the Vercel hosting
 * he already has (free tier covers this a thousand times over), needs no schema and no
 * connection pool, and if it is ever unset the site falls back to the defaults and
 * says so in the admin page rather than erroring.
 *
 * THE STORE IS PUBLIC-READ AT AN UNGUESSABLE URL, and that is fine for exactly this
 * document: his open hours are the most public fact on the site — the booking page
 * renders them to anyone. Nothing else may be stored through this module.
 */

export type StoredAvailability = {
  windows: { day: number; from: string; to: string }[];
  /** "YYYY-MM-DD" days removed from the grid: harvest days, holidays, travel. */
  blockedDates: string[];
  /** Stretches of a day blocked off, one-off or weekly. Absent in documents
   *  saved before 2026-11-16, which read as none. */
  blocks?: Block[];
  leadDays: number;
  horizonDays: number;
};

/**
 * HOW HE WANTS TO RUN IT (2026-11-16): "instead of setting availability, I'm
 * just blocking off windows I'm not available and outside of that I'm open
 * from 7 am to 10 pm." So the weekly hours can be set to this in one press on
 * /admin, and what he then manages is the list of blocks. The shipped default
 * is NOT changed to it: he wrote "I might", and opening fifteen hours a day,
 * seven days a week, before he has blocked anything would put strangers on
 * his Sunday night.
 */
export const OPEN_EVERY_DAY = { from: "07:00", to: "22:00" } as const;
export const MAX_BLOCKS = 80;

/** The admin form's field names. A rejected save hands these back in the query
 *  string so the form can be refilled; anything else in a draft is ignored. Open
 *  hours are the most public fact on the site, so they may ride in a URL. */
export const DRAFT_FIELD = /^(w[0-6][ab]_(from|to)|blocked|leadDays|horizonDays)$/;
export const DRAFT_MAX = 2000;

const PATHNAME = "config/availability.json";
const CACHE_TTL_MS = 60_000;

export const DEFAULTS: StoredAvailability = {
  windows: [...AVAILABILITY.windows],
  blockedDates: [],
  blocks: [],
  leadDays: AVAILABILITY.leadDays,
  horizonDays: AVAILABILITY.horizonDays,
};

let cache: { at: number; value: StoredAvailability | null } | null = null;

export const storeConfigured = () => Boolean(process.env.BLOB_READ_WRITE_TOKEN);

const HHMM = /^([01]\d|2[0-3]):[0-5]\d$/;
const DATE = /^\d{4}-\d{2}-\d{2}$/;

const DAY_WORDS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

/** Refuse anything that would render a broken grid. Returns the cleaned document or a
 *  sentence saying what is wrong, never both. */
export function validate(doc: StoredAvailability): { ok?: StoredAvailability; error?: string } {
  const windows = [];
  for (const w of doc.windows) {
    if (!Number.isInteger(w.day) || w.day < 0 || w.day > 6) return { error: "A window has a day outside Sunday to Saturday." };
    if (!HHMM.test(w.from) || !HHMM.test(w.to)) return { error: "Times must be HH:MM, 24-hour." };
    if (w.from >= w.to) return { error: `A window opens at ${w.from} and closes at ${w.to}, which closes it before it opens.` };
    windows.push({ day: w.day, from: w.from, to: w.to });
  }
  // No overlaps within a day. Two windows covering the same 11:00 would render that
  // slot twice: two radios with one value, duplicate React keys, and a grid that
  // looks glitched. Caught here with a sentence instead of shipped as a glitch.
  // Back-to-back (12:00 close, 12:00 open) is allowed; HH:MM compares as strings.
  for (let day = 0; day < 7; day++) {
    const ordered = windows.filter((w) => w.day === day).sort((a, b) => (a.from < b.from ? -1 : 1));
    for (let i = 1; i < ordered.length; i++) {
      if (ordered[i].from < ordered[i - 1].to) {
        return {
          error: `${DAY_WORDS[day]}'s windows overlap: ${ordered[i - 1].from}-${ordered[i - 1].to} and ${ordered[i].from}-${ordered[i].to}. Merge them or move one.`,
        };
      }
    }
  }
  for (const d of doc.blockedDates) {
    if (!DATE.test(d)) return { error: `Blocked dates must be YYYY-MM-DD; "${d}" is not.` };
  }
  const blocks: Block[] = [];
  for (const b of doc.blocks ?? []) {
    if (!DATE.test(b.date)) return { error: `A blocked time needs a date like 2026-09-03; "${b.date}" is not one.` };
    if (!HHMM.test(b.from) || !HHMM.test(b.to)) return { error: "A blocked time needs a start and an end, HH:MM, 24-hour." };
    if (b.from >= b.to) return { error: `A blocked time starts at ${b.from} and ends at ${b.to}, which ends it before it starts.` };
    // The same block typed twice is one block.
    if (blocks.some((x) => x.date === b.date && x.from === b.from && x.to === b.to && !!x.weekly === !!b.weekly)) continue;
    blocks.push(b.weekly ? { date: b.date, from: b.from, to: b.to, weekly: true } : { date: b.date, from: b.from, to: b.to });
  }
  if (blocks.length > MAX_BLOCKS) return { error: `That is more than ${MAX_BLOCKS} blocked times. Remove some that have passed.` };
  blocks.sort((a, b) => (a.date + a.from < b.date + b.from ? -1 : 1));
  const leadDays = Math.min(Math.max(Math.trunc(doc.leadDays), 0), 30);
  const horizonDays = Math.min(Math.max(Math.trunc(doc.horizonDays), 1), 60);
  return { ok: { windows, blockedDates: [...new Set(doc.blockedDates)].sort(), blocks, leadDays, horizonDays } };
}

/** The stored document, or null when the store is unset, empty, or unreadable. */
async function readStored(): Promise<StoredAvailability | null> {
  if (!storeConfigured()) return null;
  if (cache && Date.now() - cache.at < CACHE_TTL_MS) return cache.value;
  try {
    const { list } = await import("@vercel/blob");
    const found = (await list({ prefix: PATHNAME, limit: 1 })).blobs[0];
    if (!found) {
      cache = { at: Date.now(), value: null };
      return null;
    }
    const res = await fetch(found.url, { cache: "no-store" });
    if (!res.ok) throw new Error(`blob answered ${res.status}`);
    const parsed = validate((await res.json()) as StoredAvailability);
    if (parsed.error) throw new Error(parsed.error);
    cache = { at: Date.now(), value: parsed.ok! };
    return parsed.ok!;
  } catch (err) {
    // Open failure: the defaults render and the admin page says the store is
    // unreadable. The booking form does not go down because a JSON document did.
    console.error("[migas] Availability store unreadable, serving defaults", err);
    return cache?.value ?? null;
  }
}

export async function getAvailability(): Promise<StoredAvailability> {
  return (await readStored()) ?? DEFAULTS;
}

/** One-off blocks and days off that ended before `today` ("YYYY-MM-DD"). They
 *  do nothing any more, so each save sweeps them out and the list stays short. */
export function withoutPast(doc: StoredAvailability, today: string): StoredAvailability {
  return {
    ...doc,
    blockedDates: doc.blockedDates.filter((d) => d >= today),
    blocks: (doc.blocks ?? []).filter((b) => b.weekly || b.date >= today),
  };
}

/** For the admin status panel: is the store connected, and has he ever saved? */
export async function availabilityStatus(): Promise<{ configured: boolean; stored: boolean }> {
  const configured = storeConfigured();
  return { configured, stored: configured && (await readStored()) !== null };
}

/** Write the document. Only the admin action calls this, after its own PIN check. */
export async function saveAvailability(doc: StoredAvailability): Promise<{ error?: string }> {
  const parsed = validate(doc);
  if (parsed.error) return { error: parsed.error };
  if (!storeConfigured()) {
    return { error: "The storage token is not set, so nothing can be saved yet. See the status panel." };
  }
  const { put } = await import("@vercel/blob");
  await put(PATHNAME, JSON.stringify(parsed.ok), {
    access: "public",
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: "application/json",
  });
  cache = { at: Date.now(), value: parsed.ok! };
  return {};
}

/**
 * The slot grid the booking page renders: stored windows minus blocked dates minus
 * whatever his calendar says he is doing minus the calls already booked here (see
 * upcomingBookings for why the last one is not left to the calendar). The three
 * async sources load in parallel and each fails open on its own.
 */
export async function openSlots(now: Date = new Date(), fresh = false): Promise<SlotDay[]> {
  const [availability, busy, booked] = await Promise.all([
    getAvailability(),
    getBusyIntervals(now),
    upcomingBookings(now.getTime(), fresh),
  ]);
  const taken = booked.map((b) => ({ start: b.startMs, end: b.startMs + b.minutes * 60_000 }));
  return slotGrid(now, runtime(availability, [...busy, ...taken]));
}

/**
 * Server-side re-check of a posted slot, against the same sources the grid rendered
 * from. This is what actually refuses a time that got taken between page load and
 * submit: by then the first booking is on his calendar, the feed carries it, and the
 * second visitor gets "no longer open" instead of a silent collision.
 */
export async function bookableSlot(
  value: string,
  sessionMinutes: number,
  now: Date = new Date()
): Promise<boolean> {
  // Fresh booking records: this is the check that refuses a time somebody else
  // took a moment ago.
  const days = await openSlots(now, true);
  for (const day of days) {
    const hit = day.slots.find((s) => s.value === value);
    if (hit) return hit.maxMinutes >= sessionMinutes;
  }
  return false;
}

const runtime = (
  availability: StoredAvailability,
  busy: { start: number; end: number }[]
): RuntimeAvailability => ({ ...availability, busy });
