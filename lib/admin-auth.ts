import { createHash, timingSafeEqual } from "node:crypto";

/**
 * The gate on /admin, sized to what it protects: his own opening hours, on a page
 * only he knows exists. A PIN from the environment, a cookie carrying its hash, and
 * nothing stored anywhere.
 *
 * The cookie holds sha256(PIN + salt) rather than a session id because there is no
 * session store to hold an id, and rather than the PIN itself so the cookie is not
 * the credential. Changing MIGAS_ADMIN_PIN invalidates every signed-in device at
 * once, which is the right failure mode for a one-person admin.
 *
 * What this is not: an account system. There is one operator. If this site ever
 * grows a second one, this file is the thing to replace, not extend.
 */

export const ADMIN_COOKIE = "migas_admin";

const salt = "migas-admin-v1";

export const pinConfigured = () => Boolean(process.env.MIGAS_ADMIN_PIN);

export const cookieValueFor = (pin: string) =>
  createHash("sha256").update(`${salt}:${pin}`).digest("hex");

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
