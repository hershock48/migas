"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  ADMIN_COOKIE,
  cookieIsValid,
  cookieValueFor,
  pinMatches,
} from "@/lib/admin-auth";
import { DRAFT_FIELD, DRAFT_MAX, OPEN_EVERY_DAY, getAvailability, saveAvailability, withoutPast, type StoredAvailability } from "@/lib/availability";
import { deleteBooking } from "@/lib/bookings";
import { notifyTo, sendMailChecked } from "@/lib/mail";
import { AVAILABILITY, SITE } from "@/lib/site";

/**
 * The three admin actions: in, out, and save. All three finish with a redirect
 * rather than returned state, so the page works identically with JavaScript off —
 * a plain POST, a Location header, and the message rides in the query string.
 * Nothing personal ever goes in that query string; it carries one of a fixed set of
 * sentences the page maps back to text, and, after a rejected save, what was typed
 * into the hours form (a draft), so the page can put it back. Measured 2026-11-12:
 * every rejected save reset all 31 fields to the stored hours, so one typo in a
 * date cost the whole edit, and the signed-out message promised "nothing was lost
 * from the form" while losing all of it.
 */

/** What was typed, as a `draft` query value. Too long to carry (a very long list
 *  of days off) means no draft rather than a broken URL. */
function draftOf(fd: FormData): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of fd.entries()) {
    if (typeof v === "string" && DRAFT_FIELD.test(k) && v.trim()) out[k] = v;
  }
  const json = JSON.stringify(out);
  return json.length <= DRAFT_MAX ? { draft: json } : {};
}

const back = (params: Record<string, string>) => {
  const q = new URLSearchParams(params).toString();
  redirect(q ? `/admin?${q}` : "/admin");
};

export async function adminLogin(fd: FormData) {
  const pin = String(fd.get("pin") ?? "");
  // A draft carried through the sign-in form, from a save made after the sign-in
  // had lapsed. It goes back to the editor once the PIN is right.
  const carried = String(fd.get("draft") ?? "");
  const keep: Record<string, string> = carried && carried.length <= DRAFT_MAX ? { draft: carried } : {};
  if (!pinMatches(pin)) {
    // A flat second's delay is most of the brute-force defense a PIN this size
    // needs when every attempt is a full page round trip.
    await new Promise((r) => setTimeout(r, 1000));
    back({ error: "wrong-pin", ...keep });
  }
  (await cookies()).set(ADMIN_COOKIE, cookieValueFor(pin), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  back(keep.draft ? { ...keep, restored: "1" } : {});
}

export async function adminLogout() {
  (await cookies()).delete(ADMIN_COOKIE);
  back({});
}

export async function saveAvailabilityAction(fd: FormData) {
  const draft = draftOf(fd);
  const jar = await cookies();
  if (!cookieIsValid(jar.get(ADMIN_COOKIE)?.value)) back({ error: "signed-out", ...draft });

  const windows: StoredAvailability["windows"] = [];
  for (let day = 0; day < 7; day++) {
    for (const half of ["a", "b"]) {
      const from = String(fd.get(`w${day}${half}_from`) ?? "").trim();
      const to = String(fd.get(`w${day}${half}_to`) ?? "").trim();
      if (!from && !to) continue;
      if (!from || !to) back({ error: "half-window", ...draft });
      windows.push({ day, from, to });
    }
  }

  const blockedDates = String(fd.get("blocked") ?? "")
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  // The blocked times are edited by their own two buttons, not by this form,
  // so a save here carries them through untouched.
  const current = await getAvailability();
  const doc: StoredAvailability = {
    windows,
    blockedDates,
    blocks: current.blocks ?? [],
    leadDays: Number(fd.get("leadDays") ?? NaN),
    horizonDays: Number(fd.get("horizonDays") ?? NaN),
  };
  if (!Number.isFinite(doc.leadDays) || !Number.isFinite(doc.horizonDays)) {
    back({ error: "bad-days", ...draft });
  }

  const result = await saveAvailability(doc);
  if (result.error) back({ error: "invalid", detail: result.error, ...draft });
  back({ saved: "1" });
}

/* ------------------------------ time blocked off ------------------------------ */

/** Today in the site's own timezone, "YYYY-MM-DD". */
const todayLocal = () =>
  new Intl.DateTimeFormat("en-CA", { timeZone: AVAILABILITY.timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());

const signedIn = async () => cookieIsValid((await cookies()).get(ADMIN_COOKIE)?.value);
const toBlocks = (params: Record<string, string>) => {
  const q = new URLSearchParams(params).toString();
  redirect(`/admin?${q}#blocks`);
};

/**
 * Block a stretch of a day, or a whole day when both times are left empty.
 * "Every week" repeats it on that weekday from the date onward.
 */
export async function addBlock(fd: FormData) {
  if (!(await signedIn())) back({ error: "signed-out" });
  const date = String(fd.get("date") ?? "").trim();
  const from = String(fd.get("from") ?? "").trim();
  const to = String(fd.get("to") ?? "").trim();
  const weekly = fd.get("weekly") === "yes";
  const typed = { bdate: date, bfrom: from, bto: to, ...(weekly ? { bweekly: "1" } : {}) };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) toBlocks({ block: "no-date", ...typed });
  if (date < todayLocal()) toBlocks({ block: "past", ...typed });
  if ((from && !to) || (!from && to)) toBlocks({ block: "half", ...typed });
  if (!from && !to && weekly) toBlocks({ block: "weekly-day", ...typed });

  const current = withoutPast(await getAvailability(), todayLocal());
  const next: StoredAvailability =
    !from && !to
      ? { ...current, blockedDates: [...current.blockedDates, date] }
      : { ...current, blocks: [...(current.blocks ?? []), { date, from, to, ...(weekly ? { weekly: true } : {}) }] };
  const result = await saveAvailability(next);
  if (result.error) toBlocks({ block: "invalid", detail: result.error, ...typed });
  toBlocks({ block: "added" });
}

/** Remove one blocked time or one day off. The key is what the list printed. */
export async function removeBlock(fd: FormData) {
  if (!(await signedIn())) back({ error: "signed-out" });
  const key = String(fd.get("key") ?? "");
  const current = await getAvailability();
  const next: StoredAvailability = {
    ...current,
    blockedDates: current.blockedDates.filter((d) => `day|${d}` !== key),
    blocks: (current.blocks ?? []).filter((b) => `${b.weekly ? "weekly" : "once"}|${b.date}|${b.from}|${b.to}` !== key),
  };
  const result = await saveAvailability(withoutPast(next, todayLocal()));
  if (result.error) toBlocks({ block: "invalid", detail: result.error });
  toBlocks({ block: "removed" });
}

/** Open 7 AM to 10 PM, every day: the weekly hours in one press. Blocks, days
 *  off, lead time and reach are kept. */
export async function openEveryDay() {
  if (!(await signedIn())) back({ error: "signed-out" });
  const current = await getAvailability();
  const result = await saveAvailability({
    ...current,
    windows: Array.from({ length: 7 }, (_, day) => ({ day, from: OPEN_EVERY_DAY.from, to: OPEN_EVERY_DAY.to })),
  });
  if (result.error) toBlocks({ block: "invalid", detail: result.error });
  toBlocks({ block: "open" });
}

/**
 * "Send a test email": one message to the address bookings land in, through the
 * same mailer a booking uses. The status tile can only say that mail is configured;
 * this says whether it works, and when it does not, why, in the mail server's own
 * words. The reason goes back in the query string to the signed-in owner only.
 */
export async function sendTestMail() {
  const jar = await cookies();
  if (!cookieIsValid(jar.get(ADMIN_COOKIE)?.value)) back({ error: "signed-out" });
  const to = notifyTo(SITE.email);
  const result = await sendMailChecked({
    to,
    subject: `${SITE.name} - test from your admin page`,
    text: [
      "This is a test from the admin page of your site.",
      "",
      "If you are reading it, outgoing mail works: bookings, applications and questions will arrive at this address.",
    ].join("\n"),
  });
  if (result.ok) back({ mail: "sent" });
  back({ mail: "failed", detail: (result.error ?? "No reason given.").slice(0, 300) });
}

/** Remove a booked call, which puts its time back on the booking page. It does
 *  not tell the grower; the page says so beside the button. */
export async function cancelBooking(fd: FormData) {
  const jar = await cookies();
  if (!cookieIsValid(jar.get(ADMIN_COOKIE)?.value)) back({ error: "signed-out" });
  const ref = String(fd.get("ref") ?? "");
  if (!/^MG-[A-F0-9]{6}$/.test(ref)) back({ call: "missing" });
  const removed = await deleteBooking(ref).catch((err) => {
    console.error("[migas] could not remove booking", ref, err);
    return false;
  });
  back(removed ? { call: "removed", ref } : { call: "missing" });
}
