import Link from "next/link";
import { money, type Guide, type SessionType } from "@/lib/site";

/**
 * The three card shapes the site reuses. They live together because they share one
 * decision worth stating once: a card is a link only when the whole card goes
 * somewhere, and when it does, exactly one anchor covers it. Nested links and
 * duplicate "Learn more" anchors are why card grids are miserable with a screen reader
 * and a keyboard — you tab three times per card to move once.
 */

export function GuideCard({ guide }: { guide: Guide }) {
  return (
    <Link
      href={`/guides/${guide.slug}`}
      className="card group flex flex-col p-6 transition-colors hover:border-edge"
    >
      <div className="flex items-start justify-between gap-4">
        <h3 className="text-lg leading-snug text-bone">{guide.name}</h3>
        <span className="shrink-0 font-display text-lg font-bold text-gas">
          {money(guide.price)}
        </span>
      </div>
      <p className="mt-1 text-xs uppercase tracking-[0.14em] text-muted">{guide.covers}</p>
      <p className="mt-4 flex-1 text-sm leading-relaxed text-muted">{guide.blurb}</p>
      <p className="mt-5 text-sm font-semibold text-bone group-hover:text-gas">
        What&rsquo;s inside <span aria-hidden>&rarr;</span>
      </p>
    </Link>
  );
}

export function SessionCard({
  session,
  href = "/consulting#book",
  featured = false,
}: {
  session: SessionType;
  href?: string;
  featured?: boolean;
}) {
  return (
    <div
      className={`card relative flex flex-col p-6 ${
        featured ? "border-gas/50" : ""
      }`}
    >
      {featured && (
        <span className="absolute -top-3 left-6 rounded-full bg-gas px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-ink">
          Most booked
        </span>
      )}
      <p className="eyebrow">{session.minutes} minutes</p>
      <h3 className="mt-2 text-xl text-bone">{session.name}</h3>
      <p className="mt-3 font-display text-3xl font-extrabold text-bone">
        {money(session.price)}
      </p>
      <p className="mt-4 text-sm leading-relaxed text-bone/90">{session.summary}</p>
      <p className="mt-3 text-sm leading-relaxed text-muted">{session.forWho}</p>
      {/* flex-1 so the button lands on the card floor. Without it a card with two
          bullets puts its CTA higher than the card beside it with three, and a row of
          pricing cards with unaligned buttons reads as a rendering fault. */}
      <ul className="mt-5 flex-1 space-y-2 border-t border-line pt-5 text-sm text-muted">
        {session.includes.map((i) => (
          <li key={i} className="flex gap-2.5">
            <span aria-hidden className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-gas" />
            <span>{i}</span>
          </li>
        ))}
      </ul>
      <Link href={href} className="btn-primary mt-6 w-full">
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
          A real review goes here, as text. The six on the current site are screenshots,
          which means search engines and screen readers cannot read a word of them.
        </blockquote>
        <figcaption className="mt-4 text-xs text-muted/80">
          Transcribe from the review images, with whatever attribution the reviewer agreed to.
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
