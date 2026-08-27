import { AVAILABILITY } from "./site";
import { getBusyIntervals } from "./busy";
import { slotGrid, type RuntimeAvailability, type SlotDay } from "./slots";

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
  leadDays: number;
  horizonDays: number;
};

const PATHNAME = "config/availability.json";
const CACHE_TTL_MS = 60_000;

export const DEFAULTS: StoredAvailability = {
  windows: [...AVAILABILITY.windows],
  blockedDates: [],
  leadDays: AVAILABILITY.leadDays,
  horizonDays: AVAILABILITY.horizonDays,
};

let cache: { at: number; value: StoredAvailability | null } | null = null;

export const storeConfigured = () => Boolean(process.env.BLOB_READ_WRITE_TOKEN);

const HHMM = /^([01]\d|2[0-3]):[0-5]\d$/;
const DATE = /^\d{4}-\d{2}-\d{2}$/;

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
  for (const d of doc.blockedDates) {
    if (!DATE.test(d)) return { error: `Blocked dates must be YYYY-MM-DD; "${d}" is not.` };
  }
  const leadDays = Math.min(Math.max(Math.trunc(doc.leadDays), 0), 30);
  const horizonDays = Math.min(Math.max(Math.trunc(doc.horizonDays), 1), 60);
  return { ok: { windows, blockedDates: [...new Set(doc.blockedDates)].sort(), leadDays, horizonDays } };
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
 * whatever his calendar says he is doing. The two async sources load in parallel and
 * each fails open on its own.
 */
export async function openSlots(now: Date = new Date()): Promise<SlotDay[]> {
  const [availability, busy] = await Promise.all([getAvailability(), getBusyIntervals(now)]);
  return slotGrid(now, runtime(availability, busy));
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
  const days = await openSlots(now);
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
