import "server-only";
import { createHmac } from "node:crypto";

/**
 * The bookings on record, so a reminder can go out before the call and a
 * payment can be matched to the booking it settles. One small JSON document
 * per booking in the project's Blob store (the same store that holds his
 * availability), under bookings/<reference>.json.
 *
 * Why Blob and not a database: a consultant takes a handful of calls a week,
 * each record is a few hundred bytes, and the only queries are "the ones in
 * the next day" and "this reference". Listing a prefix and reading a few
 * documents covers both. If the volume ever argues for a database, this file
 * is the whole seam.
 *
 * Without BLOB_READ_WRITE_TOKEN nothing is stored: the booking still reaches
 * him by email with the invite attached, and the confirmation says a reminder
 * is not on. Nothing is lost, only not automated.
 */

export type Booking = {
  ref: string;
  name: string;
  email: string;
  phone: string;
  sessionSlug: string;
  sessionName: string;
  minutes: number;
  price: number;
  /** The slot as the form carries it: local wall-clock, "YYYY-MM-DDTHH:MM". */
  slot: string;
  /** The same moment as epoch ms, for the reminder window. */
  startMs: number;
  createdAt: number;
  payUrl?: string;
  paidAt?: number;
  paymentId?: string;
  reminderSentAt?: number;
  /** When his own day-before note went out, tracked apart from the grower's so a
   *  bounce on one side never repeats the other every hour. */
  ownerRemindedAt?: number;
};

const PREFIX = "bookings/";
const configured = () => Boolean(process.env.BLOB_READ_WRITE_TOKEN);

/**
 * Where a booking lives: bookings/<reference>-<32 hex>.json, the hex an HMAC of the
 * reference keyed with the store's own token.
 *
 * It was bookings/<reference>.json. The store is public-read (his open hours live
 * in it, and those are public), a reference is MG- plus six hex characters, and the
 * visitor is shown theirs. So the address of every record, each holding a name, an
 * email and a phone number, was one of 16.7 million guessable URLs. Caught
 * 2026-11-12, the day the store was first connected, before any booking was
 * written. The suffix cannot be worked out without the token, and it is the same
 * every time for the same reference, so marking a booking paid or reminded still
 * overwrites the one file.
 */
const pathFor = (ref: string) =>
  `${PREFIX}${ref}-${createHmac("sha256", process.env.BLOB_READ_WRITE_TOKEN ?? "").update(ref).digest("hex").slice(0, 32)}.json`;

export const bookingsConfigured = configured;

export async function saveBooking(b: Booking): Promise<boolean> {
  if (!configured()) return false;
  const { put } = await import("@vercel/blob");
  await put(pathFor(b.ref), JSON.stringify(b), {
    access: "public",
    contentType: "application/json",
    addRandomSuffix: false,
    allowOverwrite: true,
  });
  if (upcoming) upcoming.list = [...upcoming.list.filter((x) => x.ref !== b.ref), b].sort((x, y) => x.startMs - y.startMs);
  return true;
}

/**
 * The calls still ahead, soonest first. Two readers: the slot grid, which takes
 * these times off the booking page, and /admin, which lists them.
 *
 * WHY THE GRID READS THIS (2026-11-12). The only thing that used to close a booked
 * time was his calendar feed, and a booking only reaches his calendar when he opens
 * the invite in his mail and adds it. Until then the time stayed open: on a test
 * build the same Monday 10:00 was booked twice in a row, both confirmed, while the
 * home page said booked times drop off right away. The record written at booking
 * is the fact, so the grid now subtracts it directly.
 *
 * Cached 30 seconds per server instance; `fresh` skips the cache, for the re-check
 * at submit, where a stale answer is a double booking.
 */
let upcoming: { at: number; list: Booking[] } | null = null;
const UPCOMING_TTL_MS = 30_000;

export async function upcomingBookings(nowMs: number = Date.now(), fresh = false): Promise<Booking[]> {
  if (!configured()) return [];
  if (!fresh && upcoming && nowMs - upcoming.at < UPCOMING_TTL_MS) return upcoming.list;
  try {
    // From an hour back, so a call in progress still holds its time.
    const list = (await bookingsStarting(nowMs - 3_600_000, nowMs + 100 * 86_400_000)).sort((a, b) => a.startMs - b.startMs);
    upcoming = { at: nowMs, list };
    return list;
  } catch (err) {
    // Open failure, like the calendar feed: the booking page must not go down
    // because the store did. The last good list beats none.
    console.error("[migas] Booking records unreadable, slots render without them", err);
    return upcoming?.list ?? [];
  }
}

/** Remove a booking's record, which reopens its time. Only /admin calls this,
 *  after its own PIN check. True when a record was found and removed. */
export async function deleteBooking(ref: string): Promise<boolean> {
  if (!configured()) return false;
  const { list, del } = await import("@vercel/blob");
  const found = (await list({ prefix: pathFor(ref), limit: 1 })).blobs[0];
  if (!found) return false;
  await del(found.url);
  if (upcoming) upcoming.list = upcoming.list.filter((x) => x.ref !== ref);
  return true;
}

export async function getBooking(ref: string): Promise<Booking | null> {
  if (!configured()) return null;
  const { list } = await import("@vercel/blob");
  const found = (await list({ prefix: pathFor(ref), limit: 1 })).blobs[0];
  if (!found) return null;
  const res = await fetch(found.url, { cache: "no-store" });
  if (!res.ok) return null;
  return (await res.json()) as Booking;
}

/** Every booking that starts inside [from, to], newest written last. */
export async function bookingsStarting(fromMs: number, toMs: number): Promise<Booking[]> {
  if (!configured()) return [];
  const { list } = await import("@vercel/blob");
  const out: Booking[] = [];
  let cursor: string | undefined;
  do {
    const page = await list({ prefix: PREFIX, limit: 200, cursor });
    for (const blob of page.blobs) {
      // A record this old cannot be for a call still ahead; skip the fetch. 120
      // days, because /admin allows booking up to 90 days out (30 of lead time
      // plus 60 offered). It was 60, which would have dropped the reminder for a
      // call booked more than two months ahead.
      if (Date.now() - blob.uploadedAt.getTime() > 120 * 86_400_000) continue;
      const res = await fetch(blob.url, { cache: "no-store" });
      if (!res.ok) continue;
      const b = (await res.json()) as Booking;
      if (b.startMs >= fromMs && b.startMs <= toMs) out.push(b);
    }
    cursor = page.hasMore ? page.cursor : undefined;
  } while (cursor);
  return out;
}
