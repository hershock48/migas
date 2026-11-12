import Link from "next/link";
import { money, type SessionType } from "@/lib/site";

/**
 * The card shapes the site reuses. They live together because they share one
 * decision worth stating once: a card is a link only when the whole card goes
 * somewhere, and when it does, exactly one anchor covers it. Nested links and
 * duplicate "Learn more" anchors are why card grids are miserable with a screen reader
 * and a keyboard — you tab three times per card to move once.
 *
 * GuideCard lived here until the owner took guide selling off the site (2026-08-27).
 */

export function SessionCard({
  session,
  href,
}: {
  session: SessionType;
  href?: string;
}) {
  /* No "Most booked" badge. The full hour wore one from 2026-11-04, on a site that had
     not taken a single booking: social proof we made up, on the site of an owner who
     tells his audience to distrust exactly that. If a badge ever comes back it reads a
     real count. */
  return (
    <div className="card relative flex flex-col p-6">
      <p className="eyebrow">{session.minutes} minutes</p>
      <h3 className="mt-2 text-xl text-bone">{session.name}</h3>
      <p className="mt-3 font-display text-3xl font-extrabold text-bone">
        {money(session.price)}
      </p>
      <p className="mt-4 text-sm leading-relaxed text-bone/90">{session.forWho}</p>
      {/* flex-1 so the button lands on the card floor. Without it a card with two
          bullets puts its CTA higher than the card beside it with three, and a row of
          pricing cards with unaligned buttons reads as a rendering fault. */}
      <ul className="mt-5 flex-1 space-y-2 border-t border-line pt-5 text-sm text-muted">
        {session.includes.map((i) => (
          <li key={i} className="flex gap-2.5">
            <span aria-hidden className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-ember" />
            <span>{i}</span>
          </li>
        ))}
      </ul>
      {/* The link carries the session, so the form opens with it chosen. It used to be
          /consulting#book for both cards, and the choice was dropped on arrival. */}
      <Link href={href ?? `/consulting?session=${session.slug}#book`} className="btn-primary mt-6 w-full">
        Book {session.name}
      </Link>
    </div>
  );
}

/**
 * A review, or the shape of one.
 *
 * The live site publishes all six of its reviews as image files — R1.png to R6.png —
 * so the text is invisible to Google, invisible to a screen reader, and unreadable by
 * anyone auditing the site. For a consultant that is the product being hidden.
 *
 * Rather than invent testimonials to fill the grid, a card whose quote is still a
 * placeholder renders as an obvious empty slot. The layout is demonstrable, nobody is
 * quoted saying something they did not say, and the gap doubles as the request.
 */
export function ReviewCard({
  quote,
  who,
  context,
}: {
  quote: string;
  who: string;
  context?: string;
}) {
  const pending = quote.startsWith("PLACEHOLDER");
  if (pending) {
    return (
      <figure className="flex flex-col rounded-xl2 border border-dashed border-edge/70 bg-ink-panel/40 p-6">
        <p className="eyebrow">To supply</p>
        <blockquote className="mt-3 flex-1 text-sm leading-relaxed text-muted">
          A review goes here as text. The six on your current site are images, so search
          engines and screen readers can&rsquo;t read them.
        </blockquote>
        <figcaption className="mt-4 text-xs text-muted/80">
          Copy it from the review image, with whatever name the reviewer agreed to.
        </figcaption>
      </figure>
    );
  }
  return (
    <figure className="card flex flex-col p-6">
      <blockquote className="flex-1 text-[15px] leading-relaxed text-bone">
        &ldquo;{quote}&rdquo;
      </blockquote>
      <figcaption className="mt-5 border-t border-line pt-4 text-sm">
        <span className="font-semibold text-bone">{who}</span>
        {context ? <span className="text-muted"> &middot; {context}</span> : null}
      </figcaption>
    </figure>
  );
}
