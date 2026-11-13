"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  ADMIN_COOKIE,
  cookieIsValid,
  cookieValueFor,
  pinMatches,
} from "@/lib/admin-auth";
import { DRAFT_FIELD, DRAFT_MAX, saveAvailability, type StoredAvailability } from "@/lib/availability";

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

  const doc: StoredAvailability = {
    windows,
    blockedDates,
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
