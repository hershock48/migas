/**
 * The card step, checked end to end in a real browser against a production
 * build, with no Stripe account: Stripe, storage and the mail server are the
 * local stand-ins beside this file.
 *
 *   npm run build
 *   node tools/pay-check.mjs
 *
 * It starts the stand-ins and the site itself (next start, ports 3011 to
 * 3013), so nothing else should be running on those ports. It needs
 * playwright-core, which this repo does not depend on; point PLAYWRIGHT_CORE
 * at a copy if node cannot find one, for example the one in the glazedweb
 * repo: PLAYWRIGHT_CORE=C:/path/to/glazedweb/node_modules/playwright-core
 *
 * What it walks through is what the review of 2026-11-19 said was wrong:
 * a pay link that died after a day, a removed call that could still be paid
 * for, and two visitors both confirmed for one time. Every key and secret
 * below is made up for this run and means nothing anywhere else.
 */
import { spawn } from "node:child_process";
import { createHmac } from "node:crypto";
import { existsSync, readFileSync, rmSync } from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { startBlobStandin } from "./blob-standin.mjs";
import { startSmtpSink } from "./smtp-sink.mjs";
import { startStripeStandin } from "./stripe-standin.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const { chromium } = createRequire(import.meta.url)(process.env.PLAYWRIGHT_CORE || "playwright-core");

const BASE = "http://127.0.0.1:3011";
const PIN = "482913";
const TEST_KEY = "sk_test_local_standin_only";
const WEBHOOK_SECRET = "whsec_local_test_only";
const BLOB_TOKEN = "vercel_blob_rw_localstore_localsecret";
const CRON = "local-cron-secret";
const OWNER = "owner@mi-gas.test";

/* ── bookkeeping ─────────────────────────────────────────────────────────── */

const results = [];
function check(name, ok, detail = "") {
  results.push({ name, ok: Boolean(ok) });
  console.log(`${ok ? "  ok  " : "  FAIL"} ${name}${!ok && detail ? `\n         ${detail}` : ""}`);
}
const section = (title) => console.log(`\n${title}`);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * With SHOTS=<folder>, a picture of the page at the moments worth looking at,
 * and with `phone` a second one at a phone's width.
 */
async function shot(page, name, phone = false) {
  if (!process.env.SHOTS) return;
  await settled(page);
  await page.screenshot({ path: path.join(process.env.SHOTS, `${name}.png`), fullPage: name.startsWith("admin") });
  if (!phone) return;
  // The same address in a second, narrow window, so the page under test is left alone.
  const ctx = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
  const narrow = await ctx.newPage();
  await narrow.goto(page.url());
  await settled(narrow);
  await narrow.screenshot({ path: path.join(process.env.SHOTS, `${name}-390.png`) });
  await ctx.close();
}

/* ── the stand-ins and the site ──────────────────────────────────────────── */

const blob = await startBlobStandin({ port: 4599 });
const mail = await startSmtpSink({ port: 2525 });
const stripe = await startStripeStandin({ port: 4598, webhookUrl: `${BASE}/api/stripe/webhook`, webhookSecret: WEBHOOK_SECRET, returnOrigin: BASE });

const sites = [];
async function startSite(port, env, nodeOptions = "") {
  // Nothing of the real environment's reaches the site under test.
  const clean = Object.fromEntries(Object.entries(process.env).filter(([k]) => !/^(STRIPE_|SMTP_|MIGAS_|BLOB_|CRON_|VERCEL_)/.test(k)));
  const child = spawn(process.execPath, ["node_modules/next/dist/bin/next", "start", "--port", String(port), "--hostname", "127.0.0.1"], {
    cwd: root,
    env: {
      ...clean,
      NODE_OPTIONS: nodeOptions,
      MIGAS_ADMIN_PIN: PIN,
      BLOB_READ_WRITE_TOKEN: BLOB_TOKEN,
      VERCEL_BLOB_API_URL: blob.base,
      SMTP_HOST: "127.0.0.1",
      SMTP_PORT: "2525",
      SMTP_FROM: "calls@mi-gas.test",
      MIGAS_NOTIFY_TO: OWNER,
      CRON_SECRET: CRON,
      ...env,
    },
    stdio: ["ignore", "pipe", "pipe"],
  });
  const site = { child, log: "", origin: `http://127.0.0.1:${port}` };
  child.stdout.on("data", (d) => (site.log += d));
  child.stderr.on("data", (d) => (site.log += d));
  sites.push(site);
  for (let i = 0; i < 120; i++) {
    if (child.exitCode !== null) throw new Error(`the site on ${port} stopped:\n${site.log}`);
    try {
      if ((await fetch(`${site.origin}/robots.txt`)).ok) return site;
    } catch {}
    await sleep(250);
  }
  throw new Error(`the site on ${port} never answered:\n${site.log}`);
}

const browser = await chromium.launch();
let visitors = 0;
/** A new visitor: their own cookies, and their own address as the site will see it. */
async function visitor({ js = false } = {}) {
  const ctx = await browser.newContext({ javaScriptEnabled: js, extraHTTPHeaders: { "x-forwarded-for": `203.0.113.${++visitors}` } });
  return ctx.newPage();
}

/* ── things a visitor does ───────────────────────────────────────────────── */

const formOf = (page) => page.locator('form:has(input[name="slot"])');

async function openSlots(origin = BASE) {
  const page = await visitor();
  await page.goto(`${origin}/consulting`);
  const values = await formOf(page).locator('input[name="slot"]:not([disabled])').evaluateAll((els) => els.map((e) => e.value));
  await page.context().close();
  return values;
}

/** Fill the booking form with scripts off, where it is one long form. Does not send it. */
async function fill(page, { email, slot, origin = BASE }) {
  await page.goto(`${origin}/consulting`);
  const form = formOf(page);
  await form.locator('input[name="session"][value="half"]').check({ force: true });
  for (const sel of await form.locator("select").all()) await sel.selectOption({ index: 1 });
  for (const box of await form.locator('input[type="text"]:not([name="_trap"]), textarea').all()) await box.fill("Test answer");
  await form.locator('input[name="name"]').fill("Test Grower");
  await form.locator('input[name="email"]').fill(email);
  await form.locator(`input[name="slot"][value="${slot}"]`).check({ force: true });
}

/** Press send and read what came back. */
async function send(page) {
  await formOf(page).locator('button[type="submit"]').click();
  // Inside the booking section only: Next keeps a hidden role="alert" of its own on every page.
  await page.locator('#book h3:has-text("Thanks"), #book [role="alert"]').first().waitFor({ timeout: 30_000 });
  const text = await page.locator("body").innerText();
  const confirmed = /Thanks, we.ve got it/.test(text);
  const pay = page.locator('a:has-text("Pay for the call")');
  return {
    confirmed,
    // When it was refused: the sentences the form put up, for the report.
    text: confirmed ? text : (await page.locator('#book [role="alert"]').allInnerTexts()).filter(Boolean).join(" / ") || text,
    ref: confirmed ? (/Reference\s+(MG-[A-F0-9]{6})/.exec(text)?.[1] ?? "") : "",
    payHref: confirmed && (await pay.count()) ? await pay.first().getAttribute("href") : null,
  };
}

async function book(email, slot, origin = BASE) {
  const page = await visitor();
  await fill(page, { email, slot, origin });
  return { page, ...(await send(page)) };
}

/** The same booking through the step-by-step form, scripts on, the way most visitors see it. */
async function bookWithWizard(email) {
  const page = await visitor({ js: true });
  await page.goto(`${BASE}/consulting#book`, { waitUntil: "networkidle" });
  const form = formOf(page);
  const next = () => form.getByRole("button", { name: "Continue" }).click();
  await form.locator('input[name="session"][value="half"]').check();
  await next();
  for (const sel of await form.locator("select:visible").all()) await sel.selectOption({ index: 1 });
  for (const box of await form.locator('input[type="text"]:visible:not([name="_trap"]), textarea:visible').all()) await box.fill("Test answer");
  await next();
  await form.locator('fieldset.bk-day:not(.bk-hide) label:has(input[name="slot"]:not([disabled]))').first().click();
  const slot = await form.locator('input[name="slot"]:checked').inputValue();
  await next();
  await form.locator("#bk-name").fill("Test Grower");
  await form.locator("#bk-email").fill(email);
  return { page, slot, ...(await send(page)) };
}

const stored = (ref) => blob.json(`bookings/${ref}-`);
const markersOf = (ref) => blob.names(`checkouts/${ref}-`);
const sessionOf = (pageUrl) => stripe.sessions.get(pageUrl.split("/pay/")[1]);
/** The pay link as written in an email, and where that is on the site under test. */
function linkIn(text) {
  const m = /https?:\/\/[^\s/]+(\/api\/pay\?ref=MG-[A-F0-9]{6}&k=[0-9a-f]{32})/.exec(text ?? "");
  return m ? { written: m[0], local: m[1] } : null;
}
const banner = (page) => page.locator("#book").innerText();
/**
 * Wait for the page to finish scrolling itself to #book. The site scrolls
 * smoothly, and a click that Playwright starts in the middle of that scroll
 * never completes. A person just waits the second; so does this.
 */
async function settled(page) {
  let last = -1;
  for (let same = 0; same < 3; ) {
    const y = await page.evaluate(() => scrollY);
    same = y === last ? same + 1 : 0;
    last = y;
    await sleep(150);
  }
}
const signedNotice = (event, secret = WEBHOOK_SECRET, at = Math.floor(Date.now() / 1000)) => {
  const payload = JSON.stringify(event);
  return { payload, header: `t=${at},v1=${createHmac("sha256", secret).update(`${at}.${payload}`).digest("hex")}` };
};
const postNotice = (payload, header) => fetch(`${BASE}/api/stripe/webhook`, { method: "POST", headers: { "stripe-signature": header }, body: payload });
const noticeFor = (id, ref, extra = {}) => ({ type: "checkout.session.completed", data: { object: { id, payment_status: "paid", metadata: { ref }, client_reference_id: ref, ...extra } } });

async function admin(origin = BASE) {
  const page = await visitor();
  await page.goto(`${origin}/admin`);
  await page.locator('input[name="pin"]').fill(PIN);
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.getByRole("heading", { name: "Upcoming calls" }).waitFor();
  return page;
}
async function removeCall(page, ref) {
  await page.goto(new URL("/admin", page.url()).href); // the list as it is now
  await page.locator("li", { hasText: ref }).getByRole("button", { name: /Remove/ }).click();
  await page.locator(`[role="status"], [role="alert"]`, { hasText: `Removed ${ref}` }).waitFor();
  return page.locator(`[role="status"], [role="alert"]`, { hasText: `Removed ${ref}` }).innerText();
}

/* ── the run ─────────────────────────────────────────────────────────────── */

let failed = null;
try {
  const site = await startSite(3011, { STRIPE_SECRET_KEY: TEST_KEY, STRIPE_API_BASE: stripe.base, STRIPE_WEBHOOK_SECRET: WEBHOOK_SECRET });

  section("1. Booking with the card step on");
  const one = await bookWithWizard("grower1@example.test");
  check("the booking is confirmed", one.confirmed, one.text.slice(0, 300));
  check("the confirmation offers this site's own pay link", /^\/api\/pay\?ref=MG-[A-F0-9]{6}&k=[0-9a-f]{32}$/.test(one.payHref ?? ""), String(one.payHref));
  await shot(one.page, "confirmation");
  check("nothing was asked of Stripe at booking", stripe.calls.length === 0, JSON.stringify(stripe.calls));
  const rec1 = stored(one.ref);
  check("the stored booking is marked for card payment and holds nothing of Stripe's", rec1?.payByCard === true && !("payUrl" in rec1) && !/cs_|stripe/i.test(JSON.stringify(rec1)), JSON.stringify(rec1));
  const confirmation = mail.to("grower1@example.test")[0];
  const emailed = linkIn(confirmation?.text);
  check("the confirmation email carries the same link", emailed?.local === one.payHref, confirmation?.text);
  check("the email names no Stripe address", !/stripe\.com|\/pay\/cs_/.test(confirmation?.text ?? ""));
  const recordName = blob.names(`bookings/${one.ref}-`)[0] ?? "";
  check("the link's key is not the hash in the stored record's address", Boolean(recordName) && !recordName.includes(new URLSearchParams(one.payHref.split("?")[1]).get("k")));
  check("his email says a card link went out", /Payment: card link sent/.test(mail.to(OWNER).find((m) => m.subject.includes(one.ref))?.text ?? ""));

  section("2. The link opens a payment page");
  await one.page.locator('a:has-text("Pay for the call")').click();
  await one.page.waitForURL(/\/pay\/cs_test_/);
  const s1 = sessionOf(one.page.url());
  check("the visitor lands on a Stripe payment page", Boolean(s1));
  check("for the right amount, person and booking", s1.amount_total === 25000 && s1.customer_email === "grower1@example.test" && s1.client_reference_id === one.ref && s1.metadata.ref === one.ref, JSON.stringify(s1));
  check("that lasts about an hour, not a day", Math.abs(s1.expires_at - s1.created - 3600) < 30, String(s1.expires_at - s1.created));
  check("and returns to the site either way", new RegExp(`/consulting\\?paid=${one.ref}#book$`).test(s1.success_url) && new RegExp(`/consulting\\?unpaid=${one.ref}&k=[0-9a-f]{32}#book$`).test(s1.cancel_url), `${s1.success_url} ${s1.cancel_url}`);
  check("one marker was written for it", markersOf(one.ref).length === 1 && markersOf(one.ref)[0].endsWith(`-${s1.id}.json`), markersOf(one.ref).join());
  await one.page.locator("#back").click();
  await one.page.waitForURL(/unpaid=/);
  const unpaidText = await banner(one.page);
  check("backing out says nothing was charged and offers the link again", /was not completed, and nothing was charged/.test(unpaidText) && (await one.page.locator('#book a:has-text("Pay for the call")').count()) === 1, unpaidText.slice(0, 300));
  await shot(one.page, "banner-unpaid", true);
  await settled(one.page);
  await one.page.locator('#book a:has-text("Pay for the call")').click();
  await one.page.waitForURL(/\/pay\/cs_test_/);
  check("which reaches the same payment page, not a second one", sessionOf(one.page.url()) === s1 && stripe.sessions.size === 1);
  const nosy = await visitor();
  await nosy.goto(`${BASE}/consulting?unpaid=${one.ref}#book`);
  check("typing a reference into the address gets no pay button", (await nosy.locator('#book a[href^="/api/pay"]').count()) === 0 && /confirmation email, and it keeps working/.test(await banner(nosy)));
  await nosy.goto(`${BASE}/consulting?unpaid=${one.ref}&k=${"0".repeat(32)}#book`);
  check("nor with a made-up key", (await nosy.locator('#book a[href^="/api/pay"]').count()) === 0);

  section("3. More than a day later (Stripe has ended the session)");
  stripe.passTime(25 * 3600);
  await one.page.goto(s1.url);
  check("the old payment page is dead, as on Stripe", /expired/.test(await one.page.locator("#state").innerText()));
  await one.page.goto(`${BASE}${emailed.local}`);
  await one.page.waitForURL(/\/pay\/cs_test_/);
  const s2 = sessionOf(one.page.url());
  check("the link in the confirmation email still works: a fresh payment page", s2 && s2 !== s1 && s2.status === "open", one.page.url());
  check("the ended session's marker was swept", markersOf(one.ref).length === 1 && markersOf(one.ref)[0].endsWith(`-${s2.id}.json`), markersOf(one.ref).join());

  section("4. The day-before reminder");
  const refused = await fetch(`${BASE}/api/cron/reminders`, { headers: { authorization: "Bearer wrong" } });
  check("the reminder job still refuses a wrong secret", refused.status === 401);
  blob.patch(`bookings/${one.ref}-`, { startMs: Date.now() + 3 * 3_600_000 });
  const ran = await (await fetch(`${BASE}/api/cron/reminders`, { headers: { authorization: `Bearer ${CRON}` } })).json();
  const reminder = mail.to("grower1@example.test").find((m) => /^A reminder/.test(m.text));
  const reminded = linkIn(reminder?.text);
  check("the reminder went out", ran.sent?.includes(one.ref) && Boolean(reminder), JSON.stringify(ran));
  check("and carries the working pay link", /Pay before the call: /.test(reminder?.text ?? "") && reminded?.local === one.payHref, reminder?.text);
  await one.page.goto(`${BASE}${reminded.local}`);
  await one.page.waitForURL(/\/pay\/cs_test_/);
  check("which opens the payment page already open", sessionOf(one.page.url()) === s2 && stripe.sessions.size === 2);

  section("5. Paying");
  const mailsBefore = mail.to(OWNER).length;
  await one.page.locator("#pay").click();
  await one.page.waitForURL(/consulting\?paid=/);
  check("Stripe's notice was accepted", stripe.webhooks.at(-1)?.status === 200 && stripe.webhooks.at(-1)?.id === s2.id, JSON.stringify(stripe.webhooks.at(-1)));
  check("the visitor is thanked", /Paid, thank you/.test(await banner(one.page)));
  check("the booking is marked paid with that session", Boolean(stored(one.ref)?.paidAt) && stored(one.ref)?.paymentId === s2.id);
  check("he is emailed once", mail.to(OWNER).length === mailsBefore + 1 && mail.to(OWNER).at(-1).subject.startsWith(`[${one.ref}] Paid:`));
  await one.page.goto(`${BASE}${one.payHref}`);
  check("the pay link now says paid and opens nothing", /consulting\?paid=/.test(one.page.url()) && stripe.sessions.size === 2, one.page.url());
  const again = signedNotice(noticeFor(s2.id, one.ref));
  const repeat = await (await postNotice(again.payload, again.header)).json();
  check("the same notice twice is ignored", repeat.ignored === "already paid" && mail.to(OWNER).length === mailsBefore + 1, JSON.stringify(repeat));
  const other = signedNotice(noticeFor("cs_test_someOtherSession", one.ref));
  const twice = await (await postNotice(other.payload, other.header)).json();
  check("a second, different payment for it emails him", twice.ignored === "paid twice" && mail.to(OWNER).at(-1).subject === `[${one.ref}] Paid twice`, JSON.stringify(twice));

  section("6. The webhook's own checks are as they were");
  const two = await book("grower2@example.test", (await openSlots())[0]);
  check("a second booking is confirmed", two.confirmed && Boolean(two.payHref), two.text.slice(0, 300));
  const good = signedNotice(noticeFor("cs_test_forged", two.ref));
  check("a bad signature is refused", (await postNotice(good.payload, good.header.replace(/v1=..../, "v1=0000"))).status === 400);
  const wrongSecret = signedNotice(noticeFor("cs_test_forged", two.ref), "whsec_someone_elses");
  check("a signature made with another secret is refused", (await postNotice(wrongSecret.payload, wrongSecret.header)).status === 400);
  const old = signedNotice(noticeFor("cs_test_forged", two.ref), WEBHOOK_SECRET, Math.floor(Date.now() / 1000) - 600);
  check("a notice ten minutes old is refused", (await postNotice(old.payload, old.header)).status === 400);
  const pending = signedNotice(noticeFor("cs_test_pending", two.ref, { payment_status: "unpaid" }));
  const pendingAnswer = await (await postNotice(pending.payload, pending.header)).json();
  check("a checkout whose money has not arrived is not marked paid", /payment is unpaid/.test(pendingAnswer.ignored ?? "") && !stored(two.ref)?.paidAt, JSON.stringify(pendingAnswer));
  const stranger = signedNotice(noticeFor("cs_test_stranger", "MG-000000"));
  await postNotice(stranger.payload, stranger.header);
  check("a payment for a booking not on file emails him", mail.to(OWNER).at(-1).subject === "[MG-000000] Paid, but this booking is not on file");

  section("7. Paid on Stripe, but the site has not been told");
  await two.page.locator('a:has-text("Pay for the call")').click();
  await two.page.waitForURL(/\/pay\/cs_test_/);
  const s3 = sessionOf(two.page.url());
  stripe.muteWebhook = true;
  await two.page.locator("#pay").click();
  await two.page.waitForURL(/consulting\?paid=/);
  stripe.muteWebhook = false;
  check("the visitor is told the payment is being confirmed", /being confirmed/.test(await banner(two.page)) && !stored(two.ref)?.paidAt);
  const count = stripe.sessions.size;
  await two.page.goto(`${BASE}${two.payHref}`);
  check("opening the pay link again does not open a second payment page", /consulting\?paid=/.test(two.page.url()) && stripe.sessions.size === count, two.page.url());
  // Now the notice lands, but the store's CDN keeps serving the unpaid copy of the record.
  blob.cdnLagMs = 60_000;
  const late = signedNotice(noticeFor(s3.id, two.ref));
  await postNotice(late.payload, late.header);
  check("(the record on file is paid; its cached copy is not)", Boolean(stored(two.ref)?.paidAt));
  await two.page.goto(`${BASE}${two.payHref}`);
  check("a stale copy of the record cannot cause a second charge either", /consulting\?paid=/.test(two.page.url()) && stripe.sessions.size === count, two.page.url());

  section("8. Removing a call on /admin");
  const slots = await openSlots();
  const three = await book("grower3@example.test", slots[0]);
  await three.page.locator('a:has-text("Pay for the call")').click();
  await three.page.waitForURL(/\/pay\/cs_test_/);
  const s4 = sessionOf(three.page.url());
  check("a third booking has a payment page open in a tab", three.confirmed && s4?.status === "open");
  const owner = await admin();
  check("/admin says card payment is on, with a test key", /Card payment is on with a test key/.test(await owner.locator("body").innerText()));
  const removed = await removeCall(owner, three.ref); // the CDN is still serving deleted files
  check("he is told the link no longer works", /its link to pay no longer works/.test(removed), removed);
  check("the open payment page was closed at Stripe", s4.status === "expired");
  check("its marker is gone", markersOf(three.ref).length === 0);
  await three.page.locator("#pay").click();
  check("the tab left open cannot pay", /expired/.test(await three.page.locator("#state").innerText()) && s4.payment_status === "unpaid");
  const before = stripe.sessions.size;
  await three.page.goto(`${BASE}${three.payHref}`);
  check("the pay link refuses, though the deleted record is still cached", /consulting\?pay=gone/.test(three.page.url()) && stripe.sessions.size === before, three.page.url());
  check("and says so plainly", /doesn.t match a call on our calendar, so nothing was charged/.test(await banner(three.page)));
  await shot(three.page, "banner-gone", true);
  const paidRemoved = await removeCall(owner, one.ref);
  check("removing a paid call tells him to refund it", /already been paid for by card\. Nothing was refunded/.test(paidRemoved), paidRemoved);
  await shot(owner, "admin-removed-paid");
  blob.cdnLagMs = 0;

  section("9. Removed in the instant the payment page was being made");
  const four = await book("grower4@example.test", (await openSlots())[0]);
  stripe.onCreate = () => {
    for (const name of blob.names(`bookings/${four.ref}-`)) blob.files.delete(name);
  };
  await four.page.goto(`${BASE}${four.payHref}`);
  stripe.onCreate = null;
  const s5 = [...stripe.sessions.values()].at(-1);
  check("the visitor is refused", /consulting\?pay=gone/.test(four.page.url()), four.page.url());
  check("and the page that was just made is closed again", s5.client_reference_id === four.ref && s5.status === "expired" && markersOf(four.ref).length === 0, `${s5.status} ${markersOf(four.ref).join()}`);

  section("10. Stripe not answering");
  const five = await book("grower5@example.test", (await openSlots())[0]);
  stripe.down = true;
  await five.page.goto(`${BASE}${five.payHref}`);
  const laterText = await banner(five.page);
  check("the visitor is told to try again, and that nothing was charged", /consulting\?pay=later/.test(five.page.url()) && /couldn.t open the payment page just now, and nothing was charged/.test(laterText), laterText.slice(0, 300));
  await shot(five.page, "banner-try-again", true);
  check("the booking itself is untouched", Boolean(stored(five.ref)) && !stored(five.ref).paidAt);
  stripe.down = false;
  await settled(five.page);
  await five.page.locator('#book a:has-text("Try again")').click();
  await five.page.waitForURL(/\/pay\/cs_test_/);
  check("Try again works once Stripe is back", sessionOf(five.page.url())?.client_reference_id === five.ref);
  // A call removed while Stripe is down: the record goes, the page cannot be closed, and he is told.
  const six = await book("grower6@example.test", (await openSlots())[0]);
  await six.page.goto(`${BASE}${six.payHref}`);
  await six.page.waitForURL(/\/pay\/cs_test_/);
  stripe.down = true;
  const removedOpen = await removeCall(owner, six.ref);
  stripe.down = false;
  check("removing a call while Stripe is down says a page may still be open", /could not be closed just now/.test(removedOpen), removedOpen);
  await shot(owner, "admin-removed-page-open");
  await six.page.goto(`${BASE}${six.payHref}`);
  check("and its pay link refuses all the same", /consulting\?pay=gone/.test(six.page.url()));

  section("11. Links that are not real");
  const k5 = new URLSearchParams(five.payHref.split("?")[1]).get("k");
  const location = async (q) => {
    const res = await fetch(`${BASE}/api/pay${q}`, { redirect: "manual" });
    return `${res.status} ${res.headers.get("location")} ${res.headers.get("cache-control")}`;
  };
  const gone = "303 /consulting?pay=gone#book no-store";
  const bad = [await location(""), await location(`?ref=${five.ref}`), await location(`?ref=${five.ref}&k=${"a".repeat(32)}`), await location(`?ref=MG-000000&k=${k5}`), await location(`?ref=../../etc&k=${k5}`), await location(`?ref=${five.ref}&k=${k5}x`)];
  check("no key, a wrong key, a key for another booking and a malformed reference all get one answer", bad.every((b) => b === gone), bad.join(" | "));

  section("12. With the webhook secret missing, the card step stays off");
  const half = await startSite(3012, { STRIPE_SECRET_KEY: TEST_KEY, STRIPE_API_BASE: stripe.base });
  const seven = await book("grower7@example.test", (await openSlots(half.origin))[0], half.origin);
  check("a booking goes on the invoice path", seven.confirmed && !seven.payHref && /invoiced before the call/.test(seven.text), seven.text.slice(0, 400));
  check("its email promises an invoice, not a link", /send an invoice/.test(mail.to("grower7@example.test")[0]?.text ?? "") && !linkIn(mail.to("grower7@example.test")[0]?.text));
  check("and it is not marked for card payment", stored(seven.ref) && !stored(seven.ref).payByCard);
  await seven.page.goto(`${half.origin}${five.payHref}`);
  check("an existing pay link says card payment is not available", /consulting\?pay=off/.test(seven.page.url()) && /Paying by card isn.t available right now/.test(await banner(seven.page)), seven.page.url());
  const halfAdmin = await admin(half.origin);
  check("/admin says what is missing", /card payment is off because it still needs the webhook secret/.test(await halfAdmin.locator("body").innerText()));
  await shot(halfAdmin, "admin-card-off");

  section("13. A live-looking key is never sent to STRIPE_API_BASE");
  const log = path.join(tmpdir(), `migas-no-egress-${process.pid}.log`);
  rmSync(log, { force: true });
  const live = await startSite(3013, { STRIPE_SECRET_KEY: "sk_live_not_a_real_key", STRIPE_API_BASE: stripe.base, STRIPE_WEBHOOK_SECRET: WEBHOOK_SECRET, NO_EGRESS_LOG: log }, `--require=${path.join(root, "tools", "no-egress.cjs").replace(/\\/g, "/")}`);
  const callsBefore = stripe.calls.length;
  const livePage = await visitor();
  await livePage.goto(`${live.origin}${five.payHref}`);
  const asked = existsSync(log) ? readFileSync(log, "utf8") : "";
  check("the stand-in heard nothing", stripe.calls.length === callsBefore, JSON.stringify(stripe.calls.slice(callsBefore)));
  check("the site reached for api.stripe.com instead (and was stopped by the test)", /^api\.stripe\.com$/m.test(asked) && /consulting\?pay=later/.test(livePage.url()), `${asked} ${livePage.url()}`);
  rmSync(log, { force: true });

  section("14. Two visitors, one time");
  blob.clear();
  const free = await openSlots();
  // Both writes land together, so each sees the other.
  let waits = [900, 900];
  blob.holdPut = (name) => (name.startsWith("bookings/") ? waits.shift() : 0);
  const [a, b] = [await visitor(), await visitor()];
  await fill(a, { email: "racer-a@example.test", slot: free[0] });
  await fill(b, { email: "racer-b@example.test", slot: free[0] });
  const tie = await Promise.all([send(a), send(b)]);
  const tieWon = tie.filter((r) => r.confirmed).length;
  const tieMail = [...mail.to("racer-a@example.test"), ...mail.to("racer-b@example.test")];
  check("pressed in the same instant: not both confirmed", tieWon <= 1, `${tieWon} confirmed`);
  check("the records, the emails and the screens agree", blob.names("bookings/").length === tieWon && tieMail.length === tieWon, `${blob.names("bookings/").length} stored, ${tieMail.length} emailed, ${tieWon} confirmed`);
  check("whoever stepped back is told why", tie.filter((r) => !r.confirmed).every((r) => /Someone else asked for that time at the same moment|can.t check the calendar right now, so nothing was sent/.test(r.text)));
  console.log(`         (${tieWon === 0 ? "each saw the other and both stepped back; the time is open again" : "one got in ahead and kept the time"})`);
  // One write lands well ahead of the other.
  blob.clear();
  waits = [300, 2500];
  // A third visitor has the page open with the same time picked, and sends it afterwards.
  const stale = await visitor();
  await fill(stale, { email: "latecomer@example.test", slot: free[1] });
  const [c, d] = [await visitor(), await visitor()];
  await fill(c, { email: "racer-c@example.test", slot: free[1] });
  await fill(d, { email: "racer-d@example.test", slot: free[1] });
  const split = await Promise.all([send(c), send(d)]);
  blob.holdPut = null;
  const splitMail = [...mail.to("racer-c@example.test"), ...mail.to("racer-d@example.test")];
  check("a moment apart, both past the first check: exactly one is confirmed", split.filter((r) => r.confirmed).length === 1, split.map((r) => r.confirmed).join());
  check("one record, and one email with one pay link", blob.names("bookings/").length === 1 && splitMail.length === 1 && Boolean(linkIn(splitMail[0]?.text)), `${blob.names("bookings/").length} stored, ${splitMail.length} emailed`);
  check("the other is told the time is not held", /nothing was sent and the time is not held/.test(split.find((r) => !r.confirmed)?.text ?? ""));
  check("the time is off the booking page", !(await openSlots()).includes(free[1]));
  const lateAnswer = await send(stale);
  check("and a visitor whose page still showed it is refused, as before", !lateAnswer.confirmed && /no longer open/.test(lateAnswer.text), lateAnswer.text);

  section("15. What the site wrote to its log");
  const logs = sites.map((s) => s.log).join("\n");
  check("no key, secret or token appears in it", ![TEST_KEY, "sk_live_not_a_real_key", WEBHOOK_SECRET, BLOB_TOKEN, CRON].some((secret) => logs.includes(secret)));
  void site;
} catch (err) {
  failed = err;
} finally {
  await browser.close().catch(() => {});
  for (const s of sites) s.child.kill();
  await Promise.all([blob.close(), mail.close(), stripe.close()].map((p) => p.catch(() => {})));
}

const bad = results.filter((r) => !r.ok);
console.log(`\n${results.length - bad.length} of ${results.length} checks passed.`);
if (failed) {
  console.error("\nThe run stopped early:\n", failed);
  if (process.env.SHOW_LOG) console.error(sites.map((s) => s.log).join("\n---\n"));
}
process.exit(bad.length || failed ? 1 : 0);
