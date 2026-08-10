import Link from "next/link";
import type { Metadata } from "next";
import Sun from "@/components/Sun";
import { Mark } from "@/components/Mark";
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
      <section className="relative isolate overflow-hidden">
        <div className="wrap relative grid gap-10 pb-4 pt-14 sm:gap-14 sm:pt-20 lg:min-h-[680px] lg:grid-cols-[1.05fr_minmax(0,0.95fr)] lg:items-center lg:gap-16">
          <div className="reveal relative">
            <p className="eyebrow">{SITE.region} &middot; Indoor cultivators worldwide</p>
            <h1 className="mt-5 text-[2.6rem] leading-[1.02] sm:text-6xl lg:text-[4.2rem]">
              Run the room
              <br />
              like a <span className="text-flare">facility</span>.
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-bone/85">
              Consulting, SOPs and full grow programs from a cultivator who runs a licensed
              Michigan facility. The same system, written down for your room.
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

          {/* ONE sun, positioned two ways rather than two suns with one hidden. On a
              phone it sits in the flow beneath the copy at full size. On a wide screen it
              goes absolute and crops off the right edge, so it reads as something burning
              past the frame rather than a circle placed on a page — and `-z-10` puts it
              behind the copy, which matters because `bone` on the disc measures 3.40:
              enough for a display heading, not enough for a paragraph. No paragraph is
              ever allowed over it. */}
          <div className="reveal pointer-events-none relative mx-auto w-[86%] max-w-[380px] lg:absolute lg:-right-[5%] lg:-top-[24%] lg:-z-10 lg:mx-0 lg:w-[40vw] lg:max-w-[560px]">
            <Sun />
            {/* His own device: the mark in near-black, over the fire. It appears only where the
                disc is whole — on a wide screen the sun is cropped off the frame and there is
                no room for a 2.4:1 lockup on a crescent.

                On contrast: WCAG 1.4.3 explicitly exempts "text that is part of a logo or brand
                name", which is the one place on this site where laying type over a gradient is
                not a machine-checkable-contrast problem being waved away. Everything that is
                actually text still sits on flat ground. */}
            <Mark
              stacked
              className="absolute left-1/2 top-[47%] -translate-x-1/2 -translate-y-1/2 text-[min(17vw,66px)] text-ink lg:hidden"
            />
          </div>
        </div>
      </section>

      {/* Credibility, as three flat statements. No badges, no fake logos. */}
      <section className="wrap mt-6 sm:mt-12">
        <dl className="reveal grid gap-px overflow-hidden rounded-xl2 border border-line bg-line sm:grid-cols-3">
          {CREDS.map((c) => (
            <div key={c.label} className="bg-ink-panel px-6 py-7">
              <dt className="font-display text-2xl font-extrabold text-flare">{c.stat}</dt>
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
          <h2 className="mt-4 text-3xl sm:text-4xl">Every call starts with your room</h2>
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
          <Link href="/consulting" className="text-flare hover:underline">
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
            <h2 className="mt-4 text-3xl sm:text-4xl">Four programs, clone to harvest</h2>
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
        <div className="reveal mt-6 flex flex-col gap-6 rounded-xl2 border border-ember/60 bg-ink-panel p-7 sm:flex-row sm:items-center sm:justify-between sm:p-9">
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
          <h2 className="mt-4 text-3xl sm:text-4xl">Growers on the programs</h2>
        </div>
        {/* Three identical "to supply" cards side by side read as a rendering fault rather
            than as a gap. While there is no real review text, this is one panel; the moment
            any of them is real, the grid comes back on its own. */}
        {REVIEWS.some((r) => !r.quote.startsWith("PLACEHOLDER")) ? (
          <>
            <div className="reveal mt-10 grid gap-6 md:grid-cols-3">
              {REVIEWS.map((r, i) => (
                <ReviewCard key={i} quote={r.quote} who={r.who} context={r.context} />
              ))}
            </div>
            <p className="reveal mt-8 text-sm text-muted">
              <Link href="/reviews" className="text-flare hover:underline">
                Read all of them
              </Link>
            </p>
          </>
        ) : (
          <div className="reveal mt-10 max-w-3xl rounded-xl2 border border-dashed border-edge/70 bg-ink-panel/40 p-7">
            <p className="eyebrow">To supply</p>
            <p className="mt-3 text-[15px] leading-relaxed text-muted">
              Six reviews exist on the current site, as screenshots &mdash; which means Google
              cannot read a word of them and neither can a screen reader. Send the text and
              they go here, and into structured data, so they can surface under his name in
              search results. No invented testimonials in the meantime.
            </p>
          </div>
        )}
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
              {MERCH.length} designs, all between runs
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

      {/* ── Close ─────────────────────────────────────────────────────────────
          The sun crests the top edge of this band and the copy sits underneath it, in
          the light. Two reasons it is arranged that way rather than with the heading
          laid over the disc, which was the first attempt and is closer to his poster:
          text over the sun cannot be contrast-checked by any tool, because the ground
          is a gradient rather than a colour — axe reports it as unverifiable and a
          human has to take it on trust. And an eclipsed heading is a worse heading. The
          black-on-fire device that makes his logo work is still here, on every primary
          button on the site: ink on ember, measured at 5.44.
          ───────────────────────────────────────────────────────────────────── */}
      <section className="relative isolate mt-24 overflow-hidden sm:mt-32">
        {/* Fixed widths per breakpoint rather than a vw width, because the horizon below
            is a fixed offset and the two have to agree. Sized in vw, the disc's bottom edge
            moved with the viewport while the hairline stayed put — so the sun crested at
            one width and sank behind the copy at another. The translate puts the disc's
            bottom just above the line: at 1100px wide, translated -83%, the disc ends at
            187px and the hairline is at 190px. */}
        <div className="pointer-events-none absolute inset-x-0 top-0 flex justify-center">
          <Sun className="w-[600px] shrink-0 -translate-y-[85%] sm:w-[1100px] sm:-translate-y-[83%]" />
        </div>
        {/* The horizon. A hairline where the disc meets the copy, so the crop reads as a
            deliberate edge rather than as an image running out. */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-[94px] h-px bg-gradient-to-r from-transparent via-ember/50 to-transparent sm:top-[190px]"
        />

        <div className="wrap relative pt-[130px] text-center sm:pt-[230px]">
          <p className="eyebrow reveal">Indoors, you are the sun</p>
          <h2 className="reveal mt-5 text-3xl sm:text-5xl">Every room has one.</h2>
          <p className="reveal mx-auto mt-5 max-w-xl text-lg leading-relaxed text-muted">
            Yours has a switch, a schedule and a feed chart. Bring it to the call &mdash;
            eight questions, your photos, and we have read both before you speak.
          </p>
          <div className="reveal mt-9 flex flex-wrap justify-center gap-3">
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
