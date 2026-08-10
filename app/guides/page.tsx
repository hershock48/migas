import type { Metadata } from "next";
import Link from "next/link";
import FeedRig from "@/components/FeedRig";
import { GuideCard } from "@/components/cards";
import { BUNDLE, GUIDES, bundleSeparately, money } from "@/lib/site";

export const metadata: Metadata = {
  // The live site titles this page "Store 1 — MI Gas", an unedited platform default, and
  // the nav item "Guides" points at /flower-guide. Both cost him search traffic on the
  // one page that sells something.
  title: "Grow programs and SOPs",
  description:
    "Four programs from a commercial cultivator: Flower, Veg, Run-Off and Hand-Water to Automation. $200 each, or the three-part Complete Package for $500.",
};

export default function Guides() {
  return (
    <>
      <section className="wrap grid gap-10 pt-14 sm:pt-20 lg:grid-cols-[1.15fr_minmax(0,0.85fr)] lg:items-center lg:gap-16">
        <div className="reveal">
          <p className="eyebrow">Programs</p>
          <h1 className="mt-5 text-[2.4rem] leading-[1.05] sm:text-6xl">
            The system, <span className="text-flare">written down</span>.
          </h1>
          <p className="mt-6 text-lg leading-relaxed text-bone/85">
            Four programs covering clone to harvest, the runoff SOP underneath all of them,
            and the transition off hand-watering. Video and PDF, bought once, yours to keep.
          </p>
        </div>
        {/* The fertigation diagram belongs on this page more than on the home page: it is a
            picture of what these four programs actually cover. */}
        <FeedRig className="reveal mx-auto w-full max-w-[290px] lg:max-w-[360px]" />
      </section>

      {/* The bundle goes first, because it is the best thing on the page and burying the
          best thing behind four cheaper ones is a choice with a cost. */}
      <section className="wrap mt-14">
        <div className="reveal flex flex-col gap-8 rounded-xl2 border border-ember/60 bg-ink-panel p-7 sm:p-10 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            <p className="eyebrow">Start here</p>
            <h2 className="mt-3 text-3xl text-bone">{BUNDLE.name}</h2>
            <p className="mt-4 text-[15px] leading-relaxed text-muted">{BUNDLE.detail?.[0]}</p>
            <ul className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted">
              {BUNDLE.contains.map((slug) => {
                const g = GUIDES.find((x) => x.slug === slug);
                return (
                  <li key={slug} className="flex items-center gap-2">
                    <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-ember" />
                    {g?.name}
                  </li>
                );
              })}
            </ul>
          </div>
          <div className="shrink-0 lg:text-right">
            <p className="font-display text-5xl font-extrabold text-bone">{money(BUNDLE.price)}</p>
            <p className="mt-1 text-sm text-muted">
              <s>{money(bundleSeparately())}</s> bought separately
            </p>
            <Link href={`/guides/${BUNDLE.slug}`} className="btn-primary mt-5">
              What&rsquo;s inside
            </Link>
          </div>
        </div>
      </section>

      <section className="wrap mt-14">
        <h2 className="reveal text-2xl text-bone">Individually</h2>
        <div className="reveal mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {GUIDES.map((g) => (
            <GuideCard key={g.slug} guide={g} />
          ))}
        </div>
      </section>

      <section className="wrap mt-24 sm:mt-32">
        <div className="reveal grid gap-8 rounded-xl2 border border-line bg-ink-panel p-7 sm:p-10 lg:grid-cols-2 lg:gap-16">
          <div>
            <p className="eyebrow">Guide or a call?</p>
            <h2 className="mt-4 text-2xl sm:text-3xl">A program teaches. A call answers.</h2>
          </div>
          <div className="text-[15px] leading-relaxed text-muted">
            <p>
              If you want to run the whole thing properly, start with a program &mdash; it is
              the same system, for a fraction of an hour of his time, and you keep it.
            </p>
            <p className="mt-4">
              If something is going wrong <em>this week</em>, a program is the slow route.
              Book the triage call, send photos, and get an answer.
            </p>
            <Link href="/consulting" className="btn-ghost mt-6">
              Consulting
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
