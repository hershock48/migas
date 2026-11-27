import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";
import { blobTimeout } from "./blob";
import { bookingExists, type Booking } from "./bookings";
import { SITE } from "./site";

/**
 * Paying for a call by card, through Stripe Checkout, behind environment
 * variables he sets himself.
 *
 * THE PROCESSOR IS NOT SETTLED, AND THIS FILE DOES NOT SETTLE IT. Stripe's
 * published restricted-business list names "courses and information on
 * cultivating marijuana"; a cultivation consult is close enough that an
 * account could be closed for it. Square's and PayPal's lists are no kinder.
 * Jake asked for "schedule and pay" in his email of 2026-11-04, so the step
 * exists. Whether it goes live on Stripe, on another processor, or stays as
 * an invoice is a decision for him and whoever underwrites him, and until the
 * variables below are set the flow is exactly what it was: book, then an
 * invoice by email.
 *
 * THE PAY LINK IS OURS, NOT STRIPE'S (changed after the review of 2026-11-19).
 * This file used to make one Checkout Session when the call was booked and
 * store its address on the booking. Stripe ends a session after 24 hours at
 * most, and nothing made another, so the link in the confirmation email and
 * in the day-before reminder was dead for any call booked more than a day
 * ahead, which is most of them. And removing a call on /admin left its
 * session open, so a grower could pay for a call that no longer existed.
 *
 * Now a booking's pay link is an address on this site, /api/pay, that never
 * changes and never expires. Each time it is opened the site looks the
 * booking up, refuses if it is gone or paid, and only then sends the grower
 * on to a Checkout Session that lasts an hour: the one already open if there
 * is one, a new one if not. Nothing of Stripe's is stored on the booking.
 *
 * No SDK: a few calls to the Stripe REST API with fetch, and the webhook
 * signature checked with node:crypto. Same shape as glazedweb's lib/stripe.
 */

const secretKey = () => process.env.STRIPE_SECRET_KEY ?? "";
const storageToken = () => process.env.BLOB_READ_WRITE_TOKEN ?? "";

/**
 * Whether the card step is on. It needs all three, not just the key:
 *
 *  - the key, to open a payment page at all;
 *  - storage, because the pay link looks the booking up before it charges;
 *  - the webhook secret, because without it Stripe cannot tell the site a
 *    call was paid, and the site would go on showing "Not paid" on /admin
 *    and asking a grower who has paid to pay, in the reminder.
 *
 * With any one missing the booking goes on the invoice path, as if no key
 * were set, and /admin says which one is missing.
 */
export const payConfigured = () => Boolean(secretKey() && storageToken() && process.env.STRIPE_WEBHOOK_SECRET);

/** For /admin: is the card step on, and if a key is set but it is not, what is missing. */
export function payStatus(): { keySet: boolean; on: boolean; mode: "test" | "live"; missing: string[] } {
  const key = secretKey();
  const missing = [
    ...(storageToken() ? [] : ["storage"]),
    ...(process.env.STRIPE_WEBHOOK_SECRET ? [] : ["the webhook secret (STRIPE_WEBHOOK_SECRET)"]),
  ];
  return { keySet: Boolean(key), on: payConfigured(), mode: /^(sk|rk)_live/.test(key) ? "live" : "test", missing };
}

/* ── the pay link ────────────────────────────────────────────────────────── */

const REF = /^MG-[A-Z0-9]{6}$/;

/**
 * A short keyed hash of some text, under the storage token: the one secret
 * every deployment that stores bookings already has.
 *
 * The label in front of the reference matters. lib/bookings.ts names each
 * stored record with the same kind of hash of the bare reference, and that
 * name is the address of a public-read file holding a name, an email and a
 * phone number. If the pay link carried the same hash, every confirmation
 * email would be handing out the address of its own record. A different
 * label gives a different hash, and neither can be worked out from the other.
 */
const sign = (label: string, ref: string) => createHmac("sha256", storageToken()).update(`${label}:${ref}`).digest("hex").slice(0, 32);

const payKey = (ref: string) => sign("migas-pay-v1", ref);

/**
 * Whether `k` is the key that goes with this reference. A reference is only
 * sixteen million possibilities and the visitor is shown theirs, so without
 * the key anyone could walk the references and be sent to a payment page
 * with somebody else's email address filled in.
 */
export function payKeyOk(ref: string, k: string | null | undefined): boolean {
  if (!storageToken() || !REF.test(ref) || !k) return false;
  const a = Buffer.from(payKey(ref));
  const b = Buffer.from(k);
  return a.length === b.length && timingSafeEqual(a, b);
}

/** The booking's pay address on this site, from the site root. For a link on a page. */
export const payPath = (ref: string) => `/api/pay?ref=${encodeURIComponent(ref)}&k=${payKey(ref)}`;

/** The same address in full, for an email. */
export const payLink = (ref: string) => `${SITE.url}${payPath(ref)}`;

/* ── Stripe ──────────────────────────────────────────────────────────────── */

/**
 * Where the Stripe API is. Always Stripe itself, except that a test key can
 * be pointed at a local stand-in with STRIPE_API_BASE, which is how this file
 * is tested with no Stripe account (tools/stripe-standin.mjs). A live key is
 * never sent anywhere but api.stripe.com, whatever that variable says, so a
 * stray setting cannot leak the key that moves real money.
 */
function apiBase(): string {
  const over = process.env.STRIPE_API_BASE;
  if (over && !/^(sk|rk)_live/.test(secretKey())) return over.replace(/\/+$/, "");
  return "https://api.stripe.com";
}

class StripeError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message);
  }
}

/** Anything shaped like a Stripe key, taken out of text on its way to the log. */
const noKeys = (s: string) => s.replace(/\b(sk|rk|pk|whsec)_[A-Za-z0-9_]+/g, "[key]");

async function stripe(method: "GET" | "POST", path: string, body?: Record<string, string>): Promise<Record<string, unknown>> {
  const res = await fetch(`${apiBase()}/v1${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${secretKey()}`,
      ...(body ? { "Content-Type": "application/x-www-form-urlencoded" } : {}),
    },
    body: body ? new URLSearchParams(body).toString() : undefined,
    cache: "no-store",
    // The grower is waiting on a redirect. Ten seconds, then "try again".
    signal: AbortSignal.timeout(10_000),
  });
  const json = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (!res.ok) {
    const e = (json.error ?? {}) as { code?: string; type?: string; message?: string };
    throw new StripeError(res.status, String(e.code ?? e.type ?? ""), noKeys(`Stripe ${res.status} ${e.code ?? e.type ?? ""}: ${e.message ?? ""}`));
  }
  return json;
}

/* ── which payment pages are open for a booking ──────────────────────────── */

/**
 * Each Checkout Session made for a booking leaves one tiny file in storage,
 * checkouts/<reference>-<hash>/<time>-<session id>.json. The file is empty;
 * its name is the record. Two things need it:
 *
 *  - opening the pay link twice must reach the same payment page, not a
 *    second one, or a grower with two tabs could pay twice;
 *  - removing a call on /admin has to close whatever payment page is open
 *    for it, and Stripe cannot be asked "which sessions belong to MG-1234".
 *
 * WHY FILES BESIDE THE BOOKING AND NOT A FIELD ON IT. Writing the session
 * onto the booking would mean the pay link rewrites the booking record every
 * time it is opened, and a rewrite that lands a moment after he presses
 * Remove puts the call back. It would also be read back through the store's
 * CDN, which can serve the previous copy of an overwritten file for up to a
 * minute. These files are written once and never changed, and they are read
 * through the store's listing, which is not cached.
 */
const SESSION_ID = /^cs_[A-Za-z0-9_]+$/;
const dirFor = (ref: string) => `checkouts/${ref}-${sign("migas-checkouts-v1", ref)}/`;

type Marker = { id: string; at: number; url: string };

async function markers(ref: string): Promise<Marker[]> {
  const { list } = await import("@vercel/blob");
  const dir = dirFor(ref);
  const page = await list({ prefix: dir, limit: 100, ...blobTimeout() });
  const out: Marker[] = [];
  for (const b of page.blobs) {
    const m = /^(\d+)-(cs_[A-Za-z0-9_]+)\.json$/.exec(b.pathname.slice(dir.length));
    if (m) out.push({ at: Number(m[1]), id: m[2], url: b.url });
  }
  return out.sort((a, b) => b.at - a.at);
}

async function forget(urls: string[]): Promise<void> {
  if (!urls.length) return;
  const { del } = await import("@vercel/blob");
  await del(urls, blobTimeout());
}

const sessionPath = (id: string) => `/checkout/sessions/${encodeURIComponent(id)}`;

/** An hour to find the card and pay. Stripe allows thirty minutes to a day. */
const SESSION_SECONDS = 3600;

export type Checkout =
  /** Send the grower here: an open Stripe payment page for this booking. */
  | { kind: "go"; url: string }
  /** A payment page for this booking was already completed. Do not open another. */
  | { kind: "paid" }
  /** The booking was removed while this was running. Nothing is open for it. */
  | { kind: "gone" }
  /** Stripe or storage did not answer. Nothing was opened; trying again is safe. */
  | { kind: "failed" };

/**
 * The payment page for a booking that exists and is not marked paid: the one
 * already open if there is one, otherwise a new one.
 *
 * The caller (app/api/pay) has already checked the link's key and looked the
 * booking up. This asks Stripe, not our own record, whether an earlier
 * session was completed, because the "paid" mark on the booking arrives by
 * webhook and can be seconds, or a broken webhook, behind the truth. A
 * completed session is never followed by a new one.
 */
export async function checkoutFor(booking: Booking): Promise<Checkout> {
  if (!payConfigured()) return { kind: "failed" };
  const ref = booking.ref;
  try {
    const stale: string[] = [];
    for (const m of await markers(ref)) {
      let s: Record<string, unknown>;
      try {
        s = await stripe("GET", sessionPath(m.id));
      } catch (err) {
        // A session Stripe has never heard of: made under another key, before
        // the key was changed. It cannot be paid under this one. Move on.
        if (err instanceof StripeError && err.status === 404) {
          stale.push(m.url);
          continue;
        }
        throw err;
      }
      if (s.status === "complete") return { kind: "paid" };
      if (s.status === "open" && typeof s.url === "string") return { kind: "go", url: s.url };
      stale.push(m.url); // expired
    }
    // Ended sessions are swept so the folder stays one file long. Not worth
    // failing a payment over.
    await forget(stale).catch((err) => console.error("[migas] ended checkout markers not swept", err));

    const k = payKey(ref);
    const s = await stripe("POST", "/checkout/sessions", {
      mode: "payment",
      "line_items[0][price_data][currency]": "usd",
      "line_items[0][price_data][unit_amount]": String(Math.round(booking.price * 100)),
      "line_items[0][price_data][product_data][name]": `${booking.sessionName}, ${booking.minutes} minutes, ${ref}`,
      "line_items[0][quantity]": "1",
      customer_email: booking.email,
      client_reference_id: ref,
      "metadata[ref]": ref,
      expires_at: String(Math.floor(Date.now() / 1000) + SESSION_SECONDS),
      success_url: `${SITE.url}/consulting?paid=${ref}#book`,
      // The key rides back so the page can offer the pay link again without
      // offering it to anyone who types a reference into the address.
      cancel_url: `${SITE.url}/consulting?unpaid=${ref}&k=${k}#book`,
    });
    const id = String(s.id ?? "");
    if (!SESSION_ID.test(id) || typeof s.url !== "string") throw new Error("Stripe answered without a session id or address");

    // The marker goes down before the grower is sent anywhere. A session we
    // could not write down is one /admin could not close, so it is closed here
    // and the grower is asked to try again.
    let marker: string;
    try {
      const { put } = await import("@vercel/blob");
      marker = (
        await put(`${dirFor(ref)}${Date.now()}-${id}.json`, "{}", {
          access: "public",
          contentType: "application/json",
          addRandomSuffix: false,
          ...blobTimeout(),
        })
      ).url;
    } catch (err) {
      await stripe("POST", `${sessionPath(id)}/expire`).catch(() => {});
      throw err;
    }

    /* Looked up once more, now that the marker is down. If he pressed Remove
       while Stripe was answering, one of two things is true: his removal read
       the markers after ours was written and closed this session itself, or
       it read them before, in which case the booking is already gone by now
       and we close the session here. Either way no payment page outlives the
       call. */
    if (!(await bookingExists(ref))) {
      await stripe("POST", `${sessionPath(id)}/expire`).catch((err) => console.error("[migas] a payment page for a removed call could not be closed", ref, err));
      await forget([marker]).catch(() => {});
      return { kind: "gone" };
    }
    return { kind: "go", url: s.url };
  } catch (err) {
    console.error("[migas] the payment page could not be opened", ref, err);
    return { kind: "failed" };
  }
}

/**
 * Close every payment page open for a booking. /admin calls this after
 * removing a call, so nobody can pay for a call that is no longer on the
 * books. The pay link itself already refuses once the record is gone; this
 * is for the Stripe page a grower may have had open in a tab at that moment.
 *
 * `paid` is true when Stripe says one of them was completed, so /admin can
 * tell him there is money to refund. `failed` counts pages that could not be
 * closed; each ends by itself within the hour.
 */
export async function closeCheckouts(ref: string): Promise<{ closed: number; failed: number; paid: boolean }> {
  const out = { closed: 0, failed: 0, paid: false };
  if (!secretKey() || !storageToken()) return out;
  let found: Marker[];
  try {
    found = await markers(ref);
  } catch (err) {
    console.error("[migas] could not look for open payment pages", ref, err);
    return { ...out, failed: 1 };
  }
  for (const m of found) {
    try {
      const s = await stripe("GET", sessionPath(m.id));
      if (s.status === "complete") out.paid = true;
      else if (s.status === "open") {
        await stripe("POST", `${sessionPath(m.id)}/expire`);
        out.closed++;
      }
    } catch (err) {
      if (err instanceof StripeError && err.status === 404) continue;
      console.error("[migas] an open payment page could not be closed", ref, err);
      out.failed++;
    }
  }
  await forget(found.map((m) => m.url)).catch((err) => console.error("[migas] checkout markers not removed", ref, err));
  return out;
}

/* ── the webhook ─────────────────────────────────────────────────────────── */

/** Stripe's webhook signature: v1 = HMAC-SHA256 over "<t>.<payload>" with the endpoint secret. */
export function webhookEventFrom(payload: string, sigHeader: string | null, secret: string | undefined): Record<string, unknown> | null {
  if (!sigHeader || !secret) return null;
  const parts = Object.fromEntries(sigHeader.split(",").map((p) => p.split("=") as [string, string]));
  const t = parts.t;
  const v1 = parts.v1;
  if (!t || !v1) return null;
  // Five minutes of tolerance, same as Stripe's SDK default.
  if (Math.abs(Date.now() / 1000 - Number(t)) > 300) return null;
  const expected = createHmac("sha256", secret).update(`${t}.${payload}`).digest("hex");
  const a = Buffer.from(expected);
  const b = Buffer.from(v1);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    return JSON.parse(payload) as Record<string, unknown>;
  } catch {
    return null;
  }
}
