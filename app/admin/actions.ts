"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  ADMIN_COOKIE,
  cookieIsValid,
  cookieValueFor,
  pinMatches,
} from "@/lib/admin-auth";
import { saveAvailability, type StoredAvailability } from "@/lib/availability";

/**
 * The three admin actions: in, out, and save. All three finish with a redirect
 * rather than returned state, so the page works identically with JavaScript off —
 * a plain POST, a Location header, and the message rides in the query string.
 * Nothing personal ever goes in that query string; it carries one of a fixed set of
 * sentences the page maps back to text.
 */

const back = (params: Record<string, string>) => {
  const q = new URLSearchParams(params).toString();
  redirect(q ? `/admin?${q}` : "/admin");
};

export async function adminLogin(fd: FormData) {
  const pin = String(fd.get("pin") ?? "");
  if (!pinMatches(pin)) {
    // A flat second's delay is most of the brute-force defense a PIN this size
    // needs when every attempt is a full page round trip.
    await new Promise((r) => setTimeout(r, 1000));
    back({ error: "wrong-pin" });
  }
  (await cookies()).set(ADMIN_COOKIE, cookieValueFor(pin), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  back({});
}

export async function adminLogout() {
  (await cookies()).delete(ADMIN_COOKIE);
  back({});
}

export async function saveAvailabilityAction(fd: FormData) {
  const jar = await cookies();
  if (!cookieIsValid(jar.get(ADMIN_COOKIE)?.value)) back({ error: "signed-out" });

  const windows: StoredAvailability["windows"] = [];
  for (let day = 0; day < 7; day++) {
    for (const half of ["a", "b"]) {
      const from = String(fd.get(`w${day}${half}_from`) ?? "").trim();
      const to = String(fd.get(`w${day}${half}_to`) ?? "").trim();
      if (!from && !to) continue;
      if (!from || !to) back({ error: "half-window" });
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
    back({ error: "bad-days" });
  }

  const result = await saveAvailability(doc);
  if (result.error) back({ error: "invalid", detail: result.error });
  back({ saved: "1" });
}
