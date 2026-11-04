import { NextResponse } from "next/server";
import { getBooking, saveBooking } from "@/lib/bookings";
import { notifyTo, sendMail } from "@/lib/mail";
import { webhookEventFrom } from "@/lib/pay";
import { describeSlot } from "@/lib/slots";
import { SITE } from "@/lib/site";

/**
 * Stripe tells us a Checkout Session was paid; we mark the booking and tell
 * him. The signature is checked before anything is read, and an unknown
 * reference is acknowledged and ignored rather than retried for ever.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const payload = await req.text();
  const event = webhookEventFrom(payload, req.headers.get("stripe-signature"), process.env.STRIPE_WEBHOOK_SECRET);
  if (!event) return NextResponse.json({ error: "Bad signature." }, { status: 400 });
  if (event.type !== "checkout.session.completed") return NextResponse.json({ ok: true, ignored: event.type });
  const session = (event.data as { object?: Record<string, unknown> })?.object ?? {};
  const ref = String((session.metadata as { ref?: string } | undefined)?.ref ?? session.client_reference_id ?? "");
  if (!ref) return NextResponse.json({ ok: true, ignored: "no reference" });
  const booking = await getBooking(ref);
  if (!booking) return NextResponse.json({ ok: true, ignored: "unknown reference" });
  if (booking.paidAt) return NextResponse.json({ ok: true, ignored: "already paid" });
  await saveBooking({ ...booking, paidAt: Date.now(), paymentId: String(session.id ?? "") });
  await sendMail({
    to: notifyTo(SITE.email),
    subject: `[${ref}] Paid: ${booking.sessionName} - ${booking.name} - ${describeSlot(booking.slot)}`,
    text: `${booking.name} <${booking.email}> paid $${booking.price} for the ${booking.sessionName} ${describeSlot(booking.slot)}. Stripe session ${session.id ?? ""}.`,
  });
  return NextResponse.json({ ok: true });
}
