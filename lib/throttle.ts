import "server-only";

import { createHmac, randomBytes } from "node:crypto";
import { headers } from "next/headers";
import { blobTimeout } from "./blob";

/**
 * Counting, so that nothing on this site can be tried or sent without limit.
 * Found missing in the review of 2026-11-19: the admin PIN could be guessed as
 * fast as requests could be made, and a script could post the booking form
 * once per open time and empty the calendar.
 *
 * WHO IS ASKING. The caller's address comes from x-forwarded-for, which the
 * hosting sets itself and a visitor cannot forge there. It is kept only as a
 * keyed hash, never as the address.
 */
export async function caller(): Promise<string> {
  const h = await headers();
  const ip = (h.get("x-forwarded-for") ?? "").split(",")[0].trim() || h.get("x-real-ip") || "unknown";
  return createHmac("sha256", process.env.BLOB_READ_WRITE_TOKEN ?? "migas").update(ip).digest("hex").slice(0, 16);
}

/* ── wrong PINs ──────────────────────────────────────────────────────────── */

/**
 * Five wrong PINs from one place in fifteen minutes locks that place out for
 * the rest of the fifteen. Thirty wrong PINs from anywhere in an hour locks
 * the sign-in for everyone until the hour has passed, because an attacker
 * with many addresses is not slowed by the first rule at all.
 *
 * One place alone can make at most twenty wrong tries an hour, so one person
 * cannot trip the lock for everybody. Several working together can, and that
 * keeps the owner from signing in on a NEW device for as long as they keep it
 * up. A device that is already signed in is not affected. That trade was
 * chosen over leaving the PIN guessable.
 *
 * At thirty tries an hour a six-digit PIN takes years; a four-digit one takes
 * about a week. The admin page tells him when his PIN is short.
 *
 * Each wrong try is a tiny file in storage, named by its time and who made
 * it, and they are counted through storage's own listing, which is not cached
 * the way an overwritten public file is. With no storage, or with storage
 * down, the count is kept in this server instance's memory instead, which is
 * weaker but never nothing.
 */
const DIR = "admin-fails/";
const ONE_PLACE = { limit: 5, windowMs: 15 * 60_000 };
const EVERYONE = { limit: 30, windowMs: 60 * 60_000 };

type Fail = { at: number; who: string; url?: string };
const memory: Fail[] = [];

async function stored(): Promise<Fail[]> {
  const { list } = await import("@vercel/blob");
  const page = await list({ prefix: DIR, limit: 1000, ...blobTimeout() });
  const out: Fail[] = [];
  for (const b of page.blobs) {
    const m = /^admin-fails\/(\d+)-([0-9a-f]+)-/.exec(b.pathname);
    if (m) out.push({ at: Number(m[1]), who: m[2], url: b.url });
  }
  return out;
}

async function fails(): Promise<Fail[]> {
  if (!process.env.BLOB_READ_WRITE_TOKEN) return memory;
  try {
    return await stored();
  } catch (err) {
    console.error("[migas] wrong-PIN count unreadable, counting in memory", err);
    return memory;
  }
}

/** Is sign-in closed to this caller right now, and why. Checked BEFORE the PIN is looked at. */
export async function adminLock(who: string, now: number = Date.now()): Promise<"place" | "everyone" | null> {
  const all = await fails();
  if (all.filter((f) => now - f.at < EVERYONE.windowMs).length >= EVERYONE.limit) return "everyone";
  if (all.filter((f) => f.who === who && now - f.at < ONE_PLACE.windowMs).length >= ONE_PLACE.limit) return "place";
  return null;
}

export async function recordAdminFail(who: string, now: number = Date.now()): Promise<void> {
  memory.push({ at: now, who });
  while (memory.length && now - memory[0].at > EVERYONE.windowMs) memory.shift();
  if (!process.env.BLOB_READ_WRITE_TOKEN) return;
  try {
    const { put, del } = await import("@vercel/blob");
    await put(`${DIR}${now}-${who}-${randomBytes(6).toString("hex")}.json`, "{}", {
      access: "public",
      contentType: "application/json",
      addRandomSuffix: false,
      ...blobTimeout(),
    });
    // Sweep what no longer counts, so the folder stays a page long.
    const old = (await stored()).filter((f) => now - f.at > EVERYONE.windowMs && f.url).map((f) => f.url!);
    if (old.length) await del(old, blobTimeout());
  } catch (err) {
    console.error("[migas] wrong PIN not recorded in storage; it is counted in memory", err);
  }
}

/* ── the forms ───────────────────────────────────────────────────────────── */

/**
 * A small counter per server instance, for the three message forms, which
 * keep no records to count against. It will not stop someone determined, who
 * can land on several instances, but it turns "as fast as you can post" into
 * a handful an hour from one place. The booking form is limited durably, from
 * its own stored records, in app/actions.ts.
 */
const hits = new Map<string, number[]>();

export function tooMany(bucket: string, who: string, limit: number, windowMs: number, now: number = Date.now()): boolean {
  const k = `${bucket}:${who}`;
  const recent = (hits.get(k) ?? []).filter((t) => now - t < windowMs);
  if (recent.length >= limit) {
    hits.set(k, recent);
    return true;
  }
  recent.push(now);
  hits.set(k, recent);
  if (hits.size > 5000) for (const [key, v] of hits) if (!v.some((t) => now - t < windowMs)) hits.delete(key);
  return false;
}
