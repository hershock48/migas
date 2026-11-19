import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ReviewCard } from "@/components/cards";
import { REVIEWS } from "@/lib/site";

export const metadata: Metadata = {
  title: "Reviews",
  description:
    "Reviews from growers who have worked with MI Gas.",
};

/**
 * Reviews, as text.
 *
 * The live site publishes all six of its reviews as image files. That means Google cannot
 * read a word of them, a screen reader announces nothing, and the one asset a consultant
 * cannot manufacture is invisible to everyone except a sighted visitor who scrolled to the
 * right page. Transcribing them is an hour of somebody's time and it is the highest-return
 * hour on the whole project.
 *
 * The cards below render as visible empty slots until real text exists, because inventing
 * a testimonial is not a placeholder, it is a lie with a name attached.
 */
export default function Reviews() {
  const real = REVIEWS.filter((r) => !r.quote.startsWith("PLACEHOLDER"));
  /* With no review yet there is no page. It used to show three "To supply"
     cards and a box headed "Note for MI Gas", linked from every page's footer.
     The first real quote in REVIEWS brings the page, its header link and its
     footer link back together (HAS_REVIEWS in lib/site.ts). */
  if (real.length === 0) notFound();

  return (
    <>
      <section className="wrap pt-14 sm:pt-20">
        <div className="reveal max-w-3xl">
          <p className="eyebrow">Reviews</p>
          <h1 className="mt-5 text-[2.4rem] leading-[1.05] sm:text-6xl">
            What growers <span className="text-flare">say</span>
          </h1>
          <p className="mt-6 text-lg leading-relaxed text-bone/85">
            From growers who have taken a call with us or learned from the guides.
          </p>
        </div>
      </section>

      <section className="wrap mt-14">
        <div className="stagger grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {real.map((r, i) => (
            <ReviewCard key={i} quote={r.quote} who={r.who} context={r.context} />
          ))}
        </div>

      </section>

      <section className="wrap mt-24 sm:mt-32">
        <div className="reveal flex flex-col gap-6 rounded-xl2 border border-line bg-ink-panel p-7 sm:flex-row sm:items-center sm:justify-between sm:p-9">
          <div className="max-w-xl">
            <h2 className="text-2xl text-bone">Worked with us?</h2>
            <p className="mt-3 text-[15px] leading-relaxed text-muted">
              Tell us what changed in your room. Numbers help.
            </p>
          </div>
          <Link href="/connect" className="btn-primary shrink-0">
            Leave a review
          </Link>
        </div>
      </section>
    </>
  );
}
