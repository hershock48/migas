/**
 * Loaded into the site's process by tools/pay-check.mjs for one check only:
 * that a live-looking Stripe key is aimed at Stripe itself and never at the
 * address in STRIPE_API_BASE.
 *
 * The check must not actually call Stripe, so this stops every name lookup
 * that is not this machine, and writes down the names that were asked for.
 * The test then reads the list: api.stripe.com should be on it, and the
 * stand-in should have heard nothing.
 */
const dns = require("node:dns");
const fs = require("node:fs");

const real = dns.lookup;
dns.lookup = function lookup(hostname, options, callback) {
  const cb = typeof options === "function" ? options : callback;
  if (hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1") return real.apply(dns, arguments);
  if (process.env.NO_EGRESS_LOG) fs.appendFileSync(process.env.NO_EGRESS_LOG, `${hostname}\n`);
  const err = Object.assign(new Error(`getaddrinfo ENOTFOUND ${hostname} (blocked by tools/no-egress.cjs)`), { code: "ENOTFOUND", hostname });
  process.nextTick(() => cb(err));
};
