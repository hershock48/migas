import { getBooking } from "@/lib/bookings";
import { checkoutFor, payConfigured, payKeyOk } from "@/lib/pay";

/**
 * A booking's pay link. The confirmation email, the confirmation screen, the
 * "not completed" banner and the day-before reminder all carry this one
 * address, and it works for as long as the booking is on the books.
 *
 * It takes no money itself. It checks that the link is real, looks the
 * booking up, and sends the grower on to a Stripe payment page that lasts an
 * hour (lib/pay.ts says why the link is ours and not Stripe's). When there is
 * nothing to pay it sends them to /consulting with a sentence saying why.
 *
 * It is a GET that can create something, a Checkout Session, because it has
 * to work from a link in an email. That is safe to repeat: opening it twice
 * reaches the same payment page, and a mail scanner that follows the link
 * leaves behind nothing but an unpaid session that ends within the hour.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** A 303 with nothing cached. The address is relative on purpose, so the
 *  grower stays on whichever host served the link. */
const to = (location: string) => new Response(null, { status: 303, headers: { Location: location, "Cache-Control": "no-store" } });

export async function GET(req: Request) {
  const q = new URL(req.url).searchParams;
  const ref = q.get("ref") ?? "";
  const k = q.get("k") ?? "";
  // A wrong key and a removed booking get the same answer, so the link cannot
  // be used to find out which references exist. Checked before storage is
  // touched: a guess costs nothing but this comparison.
  if (!payKeyOk(ref, k)) return to("/consulting?pay=gone#book");
  if (!payConfigured()) return to("/consulting?pay=off#book");

  const again = `/consulting?pay=later&ref=${ref}&k=${k}#book`;
  let booking;
  try {
    booking = await getBooking(ref);
  } catch (err) {
    console.error("[migas] pay link: the booking could not be read", ref, err);
    return to(again);
  }
  if (!booking || !booking.payByCard) return to("/consulting?pay=gone#book");
  if (booking.paidAt) return to(`/consulting?paid=${ref}#book`);

  const checkout = await checkoutFor(booking);
  if (checkout.kind === "go") return to(checkout.url);
  if (checkout.kind === "paid") return to(`/consulting?paid=${ref}#book`);
  if (checkout.kind === "gone") return to("/consulting?pay=gone#book");
  return to(again);
}
