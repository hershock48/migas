import { AVAILABILITY } from "./site";
import { BLOB_TIMEOUT_MS, blobTimeout } from "./blob";
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

/**
 * WHERE THE DOCUMENT LIVES, AND WHY EVERY SAVE IS A NEW FILE.
 *
 * It was one file, config/availability.json, overwritten on each save. A
 * public blob is served through a CDN, and an overwritten one can be answered
 * from the CDN's previous copy for a while. That did not matter while a save
 * replaced the whole document from the form. It matters now: "block this
 * time" reads the document, adds one line, and writes it back, and doing that
 * on top of a stale copy silently drops whatever was saved a moment before
 * (found in review, 2026-11-16). The SDK's cache bypass is for private stores
 * only, so it is no help here.
 *
 * So a save never overwrites. It writes config/availability.<time>.json, a
 * name nothing has ever been cached under, and a read asks the store's own
 * listing (the API, never the CDN) which file is newest and fetches that one.
 * The original config/availability.json shares the prefix, so a document
 * saved before this change is still found. The three newest are kept and the
 * rest swept on each save.
 */
const PREFIX = "config/availability";
const KEEP_VERSIONS = 3;
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
const DATE_SHAPE = /^\d{4}-\d{2}-\d{2}$/;
/** A date that is on the calendar. The shape alone lets 2026-02-31 through, which
 *  JavaScript quietly reads as March 3: it would block nothing and list as a day
 *  he never typed. */
const DATE = {
  test: (s: string) => {
    if (!DATE_SHAPE.test(s)) return false;
    const d = new Date(`${s}T00:00:00Z`);
    return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s;
  },
};

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
    if (!DATE.test(d)) return { error: `"${d}" is not a date on the calendar. Days off are written like 2026-09-03.` };
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

type Listed = { url: string; pathname: string; uploadedAt: Date | string };

/** Every stored version, newest first, from the store's listing. */
async function versions(): Promise<Listed[]> {
  const { list } = await import("@vercel/blob");
  const blobs = (await list({ prefix: PREFIX, limit: 100, ...blobTimeout() })).blobs as Listed[];
  const at = (x: Listed) => new Date(x.uploadedAt).getTime();
  return blobs.sort((x, y) => at(y) - at(x) || (x.pathname < y.pathname ? 1 : -1));
}

/**
 * The stored document, or null when nothing has been saved yet.
 *
 * `fresh` skips this instance's 60-second copy. `strict` is for a caller that
 * is about to write: a read that FAILS then throws, where the ordinary read
 * falls back to the last copy or to null. The difference is the whole point.
 * The booking page must keep working when storage hiccups, so it fails open
 * onto the defaults. An action that adds a block must never do that: it would
 * take "could not read" for "nothing is saved" and write the defaults back
 * over his real hours, days off and blocks.
 */
async function readStored(fresh = false, strict = false): Promise<StoredAvailability | null> {
  if (!storeConfigured()) return null;
  if (!fresh && cache && Date.now() - cache.at < CACHE_TTL_MS) return cache.value;
  try {
    const found = (await versions())[0];
    if (!found) {
      cache = { at: Date.now(), value: null };
      return null;
    }
    const res = await fetch(found.url, { cache: "no-store", signal: AbortSignal.timeout(BLOB_TIMEOUT_MS) });
    if (!res.ok) throw new Error(`blob answered ${res.status}`);
    const parsed = validate((await res.json()) as StoredAvailability);
    if (parsed.error) throw new Error(parsed.error);
    cache = { at: Date.now(), value: parsed.ok! };
    return parsed.ok!;
  } catch (err) {
    if (strict) throw err;
    // Open failure: the defaults render and the admin page says the store is
    // unreadable. The booking form does not go down because a JSON document did.
    console.error("[migas] Availability store unreadable, serving defaults", err);
    return cache?.value ?? null;
  }
}

export async function getAvailability(fresh = false): Promise<StoredAvailability> {
  return (await readStored(fresh)) ?? DEFAULTS;
}

/**
 * The document as it stands in the store right now, for an action about to
 * change it, or a sentence saying it could not be read. Never a guess: see
 * readStored on why a failed read must stop the write.
 */
export async function getAvailabilityForWrite(): Promise<{ doc: StoredAvailability; error?: undefined } | { error: string; doc?: undefined }> {
  if (!storeConfigured()) return { error: "The storage token is not set, so nothing can be saved yet. See the status panel." };
  try {
    return { doc: (await readStored(true, true)) ?? DEFAULTS };
  } catch (err) {
    console.error("[migas] Availability could not be read before a change; nothing written", err);
    return { error: "Your saved hours could not be read just now, so nothing was changed. Try again in a moment." };
  }
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
  const { put, del } = await import("@vercel/blob");
  // A new file every time; see PREFIX for why.
  await put(`${PREFIX}.${Date.now()}.json`, JSON.stringify(parsed.ok), {
    access: "public",
    addRandomSuffix: false,
    contentType: "application/json",
  });
  cache = { at: Date.now(), value: parsed.ok! };
  // Sweep the old versions. A failure here leaves a few small files behind and
  // is not worth failing a save that has already landed.
  try {
    const old = (await versions()).slice(KEEP_VERSIONS);
    if (old.length) await del(old.map((v) => v.url));
  } catch (err) {
    console.error("[migas] Old availability versions were not swept", err);
  }
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
    // Fresh on a booking submit: a block he added a moment ago on another
    // server instance must refuse the time, as a fresh booking does.
    getAvailability(fresh),
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
/**
 * The check a booking submit makes. "unknown" means the stored bookings could
 * not be read, so nobody can say whether the time is free. The page draws
 * without them when that happens; a booking is refused (review, 2026-11-19).
 */
export async function slotCheck(value: string, sessionMinutes: number, now: Date = new Date()): Promise<"open" | "taken" | "unknown"> {
  let booked;
  try {
    booked = await upcomingBookings(now.getTime(), true, true);
  } catch (err) {
    console.error("[migas] bookings unreadable at submit; the booking is refused", err);
    return "unknown";
  }
  const [availability, busy] = await Promise.all([getAvailability(true), getBusyIntervals(now)]);
  const taken = booked.map((b) => ({ start: b.startMs, end: b.startMs + b.minutes * 60_000 }));
  for (const day of slotGrid(now, runtime(availability, [...busy, ...taken]))) {
    const hit = day.slots.find((s) => s.value === value);
    if (hit) return hit.maxMinutes >= sessionMinutes ? "open" : "taken";
  }
  return "taken";
}

const runtime = (
  availability: StoredAvailability,
  busy: { start: number; end: number }[]
): RuntimeAvailability => ({ ...availability, busy });
