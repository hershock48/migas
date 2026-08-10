import Link from "next/link";
import type { Metadata } from "next";
import FeedRig from "@/components/FeedRig";
import { GuideCard, ReviewCard, SessionCard } from "@/components/cards";
import {
  BUNDLE,
  CREDS,
  GUIDES,
  MERCH,
  REVIEWS,
  SESSIONS,
  SITE,
  bundleSeparately,
  money,
} from "@/lib/site";

export const metadata: Metadata = {
  title: `${SITE.tagline}`,
  description:
    "Book a consult with the director of a licensed Michigan cultivation facility, or buy the flower, veg and run-off programs. Every call starts with an intake and your photos.",
};

export default function Home() {
  return (
    <>
      {/* ── Hero ──────────────────────────────────────────────────────────────
          The one job of this screen is to say what he does and for whom, in a
          sentence, above the fold. The live site opens on a logo and a slideshow, so
          a facility director landing on it has to scroll to find out it is for them.
          ───────────────────────────────────────────────────────────────────── */}
      <section className="wrap grid gap-10 pb-4 pt-14 sm:gap-14 sm:pt-20 lg:grid-cols-[1.15fr_minmax(0,0.85fr)] lg:items-center lg:gap-16">
        <div className="reveal">
          <p className="eyebrow">{SITE.region} &middot; Commercial cultivation</p>
          <h1 className="mt-5 text-[2.6rem] leading-[1.02] sm:text-6xl lg:text-[4.2rem]">
            Run the room
            <br />
            like a <span className="text-gas">facility</span>.
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-bone/85">
            Consulting, SOPs and full grow programs from a working commercial cultivator
            &mdash; not a forum thread, not a highlight reel.
          </p>

          <div className="mt-9 flex flex-wrap gap-3">
            <Link href="/consulting#book" className="btn-primary">
              Book a consult
            </Link>
            <Link href="/guides" className="btn-ghost">
              See the programs
            </Link>
          </div>

          <p className="mt-6 max-w-lg text-sm leading-relaxed text-muted">
            Every call starts with an eight-question room intake and your photos, read
            before you dial in. So it starts at the diagnosis instead of the
            introduction.
          </p>
        </div>

        <FeedRig className="reveal mx-auto w-full max-w-[300px] lg:max-w-[400px]" />
      </section>

      {/* Credibility, as three flat statements. No badges, no fake logos. */}
      <section className="wrap mt-6 sm:mt-12">
        <dl className="reveal grid gap-px overflow-hidden rounded-xl2 border border-line bg-line sm:grid-cols-3">
          {CREDS.map((c) => (
            <div key={c.label} className="bg-ink-panel px-6 py-7">
              <dt className="font-display text-2xl font-extrabold text-gas">{c.stat}</dt>
              <dd className="mt-2 text-sm leading-relaxed text-muted">{c.label}</dd>
            </div>
          ))}
        </dl>
      </section>

      {/* ── The router ────────────────────────────────────────────────────────
          "Streamline my consulting calls" is a routing problem before it is a
          calendar problem. Somebody with spider mite this morning and somebody
          standardising four rooms want different amounts of his time, and if the site
          does not sort them, the first ten minutes of every call does.
          ───────────────────────────────────────────────────────────────────── */}
      <section className="wrap mt-24 sm:mt-32">
        <div className="reveal max-w-2xl">
          <p className="eyebrow">Consulting</p>
          <h2 className="mt-4 text-3xl sm:text-4xl">Start where you actually are.</h2>
          <p className="mt-4 text-lg leading-relaxed text-muted">
            Three lengths, because a room on fire and a facility writing its SOPs are not
            the same conversation. Pick one and the intake adapts to it.
          </p>
        </div>

        <div className="reveal mt-12 grid gap-6 md:grid-cols-3">
          {SESSIONS.map((s, i) => (
            <SessionCard key={s.slug} session={s} featured={i === 1} />
          ))}
        </div>

        <p className="reveal mt-8 text-sm text-muted">
          Rates are a starting proposal, not published prices &mdash;{" "}
          <Link href="/consulting" className="text-gas hover:underline">
            how a consult runs
          </Link>
          .
        </p>
      </section>

      {/* ── Guides ───────────────────────────────────────────────────────────── */}
      <section className="wrap mt-24 sm:mt-32">
        <div className="reveal flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-2xl">
            <p className="eyebrow">Programs</p>
            <h2 className="mt-4 text-3xl sm:text-4xl">The whole system, written down.</h2>
            <p className="mt-4 text-lg leading-relaxed text-muted">
              Four programs covering clone to harvest, the runoff SOP behind all of them,
              and the transition off hand-watering. Video and PDF.
            </p>
          </div>
          <Link href="/guides" className="btn-ghost">
            All programs
          </Link>
        </div>

        <div className="reveal mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {GUIDES.map((g) => (
            <GuideCard key={g.slug} guide={g} />
          ))}
        </div>

        {/* The bundle, given its own weight because it is the highest-value thing on
            the site and the current site treats it as a fifth tile. */}
        <div className="reveal mt-6 flex flex-col gap-6 rounded-xl2 border border-gas/40 bg-ink-panel p-7 sm:flex-row sm:items-center sm:justify-between sm:p-9">
          <div className="max-w-2xl">
            <p className="eyebrow">Best value</p>
            <h3 className="mt-3 text-2xl text-bone">{BUNDLE.name}</h3>
            <p className="mt-3 text-[15px] leading-relaxed text-muted">{BUNDLE.blurb}</p>
          </div>
          <div className="shrink-0 sm:text-right">
            <p className="font-display text-4xl font-extrabold text-bone">
              {money(BUNDLE.price)}
            </p>
            {/* Derived, never typed. The saving is a subtraction the data can do, and
                a hardcoded "$600" is what goes stale the day a guide price moves. */}
            <p className="mt-1 text-sm text-muted">
              <s>{money(bundleSeparately())}</s> bought separately
            </p>
            <Link href={`/guides/${BUNDLE.slug}`} className="btn-primary mt-4">
              Get the package
            </Link>
          </div>
        </div>
      </section>

      {/* ── Reviews ──────────────────────────────────────────────────────────── */}
      <section className="wrap mt-24 sm:mt-32">
        <div className="reveal max-w-2xl">
          <p className="eyebrow">In their words</p>
          <h2 className="mt-4 text-3xl sm:text-4xl">What growers say after.</h2>
        </div>
        <div className="reveal mt-10 grid gap-6 md:grid-cols-3">
          {REVIEWS.map((r, i) => (
            <ReviewCard key={i} quote={r.quote} who={r.who} context={r.context} />
          ))}
        </div>
        <p className="reveal mt-8 text-sm text-muted">
          <Link href="/reviews" className="text-gas hover:underline">
            Read all of them
          </Link>
        </p>
      </section>

      {/* ── Shop, told the truth ─────────────────────────────────────────────
          Every item on the live store is sold out, and a storefront that can only say
          "sold out" costs trust on every visit. Saying so and taking an email is
          strictly better than letting somebody discover it item by item.
          ───────────────────────────────────────────────────────────────────── */}
      <section className="wrap mt-24 sm:mt-32">
        <div className="reveal flex flex-col gap-6 rounded-xl2 border border-line bg-ink-panel p-7 sm:flex-row sm:items-center sm:justify-between sm:p-9">
          <div className="max-w-xl">
            <p className="eyebrow">Merch</p>
            <h2 className="mt-3 text-2xl text-bone">
              {MERCH.length} designs, all between runs.
            </h2>
            <p className="mt-3 text-[15px] leading-relaxed text-muted">
              Hoodies, tees and the camo trucker are out of stock. Leave an address and
              you hear about the restock before the drop.
            </p>
          </div>
          <Link href="/shop" className="btn-ghost shrink-0">
            Notify me
          </Link>
        </div>
      </section>

      {/* ── Close ────────────────────────────────────────────────────────────── */}
      <section className="wrap mt-24 sm:mt-32">
        <div className="reveal relative overflow-hidden rounded-xl2 border border-line bg-ink-panel px-7 py-14 text-center sm:px-10 sm:py-20">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 -top-24 h-48 bg-gas/10 blur-3xl"
          />
          <h2 className="relative text-3xl sm:text-5xl">Bring the room to the call.</h2>
          <p className="relative mx-auto mt-5 max-w-xl text-lg leading-relaxed text-muted">
            Answer eight questions, upload your photos, pick a time. He reads it before
            you speak.
          </p>
          <div className="relative mt-9 flex flex-wrap justify-center gap-3">
            <Link href="/consulting#book" className="btn-primary">
              Book a consult
            </Link>
            <Link href="/connect" className="btn-ghost">
              Ask a question first
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
