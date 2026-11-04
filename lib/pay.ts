import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Paying for a call at the moment of booking, through Stripe Checkout, behind
 * one environment variable.
 *
 * THE PROCESSOR IS NOT SETTLED, AND THIS FILE DOES NOT SETTLE IT. Stripe's
 * published restricted-business list names "courses and information on
 * cultivating marijuana"; a cultivation consult is close enough that an
 * account could be closed for it. Square's and PayPal's lists are no kinder.
 * Jake asked for "schedule and pay" in his email of 2026-11-04, so the step
 * exists and works end to end against a test key. Whether it goes live on
 * Stripe, on another processor, or stays as an invoice is a decision for him
 * and whoever underwrites him, and until STRIPE_SECRET_KEY is set in the
 * dashboard the flow is exactly what it was: book, then an invoice by email.
 *
 * No SDK: two calls to the Stripe REST API with fetch, and the webhook
 * signature checked with node:crypto. Same shape as glazedweb's lib/stripe.
 */

export const payConfigured = () => Boolean(process.env.STRIPE_SECRET_KEY);

export const payMode = (): "test" | "live" | "off" => {
  const k = process.env.STRIPE_SECRET_KEY ?? "";
  return !k ? "off" : k.startsWith("sk_live") ? "live" : "test";
};

async function stripe(path: string, body: Record<string, string>): Promise<Record<string, unknown>> {
  const res = await fetch(`https://api.stripe.com/v1${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams(body).toString(),
  });
  const json = (await res.json()) as Record<string, unknown>;
  if (!res.ok) throw new Error(`Stripe ${res.status}: ${JSON.stringify(json.error ?? json)}`);
  return json;
}

/**
 * A Checkout Session for one call. Returns the hosted payment URL, or null
 * when payment is off or Stripe refused, so a booking is never blocked by
 * the payment step: the invoice path remains underneath it.
 */
export async function checkoutFor(opts: {
  ref: string;
  sessionName: string;
  minutes: number;
  priceDollars: number;
  customerEmail: string;
  siteUrl: string;
}): Promise<string | null> {
  if (!payConfigured()) return null;
  try {
    const s = await stripe("/checkout/sessions", {
      mode: "payment",
      "line_items[0][price_data][currency]": "usd",
      "line_items[0][price_data][unit_amount]": String(Math.round(opts.priceDollars * 100)),
      "line_items[0][price_data][product_data][name]": `${opts.sessionName}, ${opts.minutes} minutes, ${opts.ref}`,
      "line_items[0][quantity]": "1",
      customer_email: opts.customerEmail,
      client_reference_id: opts.ref,
      "metadata[ref]": opts.ref,
      success_url: `${opts.siteUrl}/consulting?paid=${encodeURIComponent(opts.ref)}#book`,
      cancel_url: `${opts.siteUrl}/consulting?unpaid=${encodeURIComponent(opts.ref)}#book`,
    });
    return typeof s.url === "string" ? s.url : null;
  } catch (err) {
    console.error("[migas] Stripe checkout failed; booking continues on the invoice path", err);
    return null;
  }
}

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
