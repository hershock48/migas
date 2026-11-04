import { NextResponse } from "next/server";
import { bookingsStarting, saveBooking } from "@/lib/bookings";
import { notifyTo, sendMail } from "@/lib/mail";
import { describeSlot } from "@/lib/slots";
import { SITE } from "@/lib/site";

/**
 * The reminder before the call. Vercel's scheduler calls this every hour
 * (vercel.json) with the CRON_SECRET it was given; anything else is refused.
 * Every booking that starts in the next 24 hours and has not been reminded
 * gets one email to the grower and one to him, then is marked so it never
 * gets a second.
 *
 * Why email and the calendar, and not a text: the .ics invite that went out
 * at booking already puts the call on the grower's phone with the phone's
 * own alert, and that is the "phone" reminder in his email. A text message
 * needs a messaging provider and a number to send from, which is a cost and
 * a contract he has not chosen. The seam for it is this file.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Not for you." }, { status: 401 });
  }
  const now = Date.now();
  const due = (await bookingsStarting(now, now + 24 * 3_600_000)).filter((b) => !b.reminderSentAt);
  const sent: string[] = [];
  for (const b of due) {
    const when = describeSlot(b.slot);
    const toGrower = await sendMail({
      to: b.email,
      subject: `${SITE.name} - your ${b.sessionName} is ${when} (${b.ref})`,
      text: [
        `A reminder: your ${b.sessionName} with ${SITE.name} is ${when}.`,
        "",
        `Length:    ${b.minutes} minutes`,
        `Reference: ${b.ref}`,
        b.paidAt ? "Paid." : b.payUrl ? `Pay before the call: ${b.payUrl}` : "The invoice came with your confirmation.",
        "",
        "Reply to this email if you need to move it.",
      ].join("\n"),
    });
    await sendMail({
      to: notifyTo(SITE.email),
      subject: `[${b.ref}] Tomorrow: ${b.sessionName} - ${b.name} - ${when}`,
      text: `${b.name} <${b.email}> ${b.phone}\n${b.sessionName}, ${b.minutes} minutes, ${when}\n${b.paidAt ? "Paid." : "Not paid yet."}`,
    });
    if (toGrower) {
      await saveBooking({ ...b, reminderSentAt: Date.now() });
      sent.push(b.ref);
    }
  }
  return NextResponse.json({ checked: due.length, sent });
}
