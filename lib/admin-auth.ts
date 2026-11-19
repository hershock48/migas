import { createHash, createHmac, timingSafeEqual } from "node:crypto";

/**
 * The gate on /admin. A PIN from the environment and a cookie that proves it
 * was typed. There is one operator and no account system; if the site ever
 * grows a second operator, replace this file, do not extend it.
 *
 * WHAT IT PROTECTS CHANGED, AND SO DID THIS (review of 2026-11-19). The gate
 * was sized for "his own opening hours". The page now also lists every
 * upcoming caller's name, email and phone, and can cancel their calls.
 *
 * The cookie used to be sha256("migas-admin-v1:" + PIN): a fixed, public
 * recipe. Anyone could work out the cookie for every possible PIN at home and
 * try them against GET /admin, which has no delay and no counter. Measured on
 * the build: fifty guesses answered in 0.15 seconds, so a four-digit PIN fell
 * in about half a minute without ever touching the sign-in form.
 *
 * Now the cookie is an HMAC of the PIN under a secret only the server holds,
 * so it cannot be computed outside. Guessing cookies is guessing 256 bits.
 * The only way left to try a PIN is the sign-in form, and that is counted and
 * locked in lib/throttle.ts.
 *
 * The secret is MIGAS_ADMIN_SECRET if it is set, else the storage token,
 * which every deployment that can save anything already has. With neither
 * (a bare local build) the key is a constant and the cookie is as weak as it
 * was; such a build stores no bookings and can save no hours.
 *
 * Changing the PIN, or the secret, signs every device out at once. Signing
 * out on one device does not sign out another: there is no session store.
 */

export const ADMIN_COOKIE = "migas_admin";

const key = () => `migas-admin-v2:${process.env.MIGAS_ADMIN_SECRET || process.env.BLOB_READ_WRITE_TOKEN || ""}`;

export const pinConfigured = () => Boolean(process.env.MIGAS_ADMIN_PIN);

/** A PIN this short can be guessed inside the lockout's allowance within weeks. The admin page says so. */
export const pinIsShort = () => (process.env.MIGAS_ADMIN_PIN ?? "").length < 6;

export const cookieValueFor = (pin: string) => createHmac("sha256", key()).update(pin).digest("hex");

export function pinMatches(pin: string): boolean {
  const expected = process.env.MIGAS_ADMIN_PIN;
  if (!expected || !pin) return false;
  const a = createHash("sha256").update(pin).digest();
  const b = createHash("sha256").update(expected).digest();
  return timingSafeEqual(a, b);
}

export function cookieIsValid(value: string | undefined): boolean {
  const expected = process.env.MIGAS_ADMIN_PIN;
  if (!expected || !value) return false;
  const a = Buffer.from(value, "utf8");
  const b = Buffer.from(cookieValueFor(expected), "utf8");
  return a.length === b.length && timingSafeEqual(a, b);
}
