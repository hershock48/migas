import type { Metadata } from "next";
import Link from "next/link";
import { ReviewCard } from "@/components/cards";
import { REVIEWS } from "@/lib/site";

export const metadata: Metadata = {
  title: "Reviews",
  description:
    "What growers say after working through the programs and after a consult. Published as text, so they can actually be read.",
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

  return (
    <>
      <section className="wrap pt-14 sm:pt-20">
        <div className="reveal max-w-3xl">
          <p className="eyebrow">Reviews</p>
          <h1 className="mt-5 text-[2.4rem] leading-[1.05] sm:text-6xl">
            What growers say <span className="text-flare">after</span>
          </h1>
          <p className="mt-6 text-lg leading-relaxed text-bone/85">
            Published as text rather than screenshots &mdash; so a search engine can index
            them, a screen reader can read them, and you can quote one back at us.
          </p>
        </div>
      </section>

      <section className="wrap mt-14">
        <div className="reveal grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {REVIEWS.map((r, i) => (
            <ReviewCard key={i} quote={r.quote} who={r.who} context={r.context} />
          ))}
        </div>

        {real.length === 0 && (
          <div className="reveal mt-10 max-w-2xl rounded-xl2 border border-alert/40 bg-alert/[0.06] p-6">
            <p className="text-sm font-semibold text-alert">Note for MI Gas</p>
            <p className="mt-2 text-[15px] leading-relaxed text-bone/90">
              Your six existing reviews live on the current site as images. Send the text and
              they go here as text, with structured data so they can show up under your name
              in search results. Until then this page stays honest and empty.
            </p>
          </div>
        )}
      </section>

      <section className="wrap mt-24 sm:mt-32">
        <div className="reveal flex flex-col gap-6 rounded-xl2 border border-line bg-ink-panel p-7 sm:flex-row sm:items-center sm:justify-between sm:p-9">
          <div className="max-w-xl">
            <h2 className="text-2xl text-bone">Worked with us?</h2>
            <p className="mt-3 text-[15px] leading-relaxed text-muted">
              Say so, and say what changed. Specific beats glowing.
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
