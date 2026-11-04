import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import Sun from "@/components/Sun";
import roomBench from "@/public/assets/rooms/bench.webp";
import roomCanopy from "@/public/assets/rooms/canopy.webp";
import roomCola from "@/public/assets/rooms/cola.webp";
import rgsOverview from "@/public/assets/rgs/rgs-overview.webp";
import { MirrorLockup } from "@/components/brand";
import { SessionCard } from "@/components/cards";
import { COMANAGEMENT, CONSULT_TOPICS, CREDS, INSTAGRAM_POSTS, PATREON, PATREON_POSTS, SESSIONS, SITE, money } from "@/lib/site";

export const metadata: Metadata = {
  title: `${SITE.tagline}`,
  description:
    "Learn it on Patreon and Instagram, book a half hour or an hour with a cultivator who runs a licensed Michigan facility, or put your rooms on co-management with weekly review.",
};

/**
 * FOUR SECTIONS, HIS ORDER, from his email of 2026-11-04:
 *
 *   1. Intro: the sun, the canopy, and a statement that makes a grower think
 *      "that looks better than anything I have done, I want that, and I can
 *      see several ways to get it."
 *   2. Patreon and Instagram: both clickable, four posts from each in a 2x2
 *      grid, a line each on what they are for.
 *   3. Schedule a consulting call: fill the facility profile first, what a
 *      call is for, half hour $250, full hour $400, the calendar.
 *   4. Co-management: the KPIs and results, the service, a visual of the
 *      software, the price breakdown in the proposal's own style.
 *
 * Nothing else. The reviews page and the close band that used to follow are
 * reachable from the nav and the footer; the home page stops where he said.
 */
export default function Home() {
  const igImages = [roomBench, roomCanopy, roomCola];
  return (
    <>
      {/* ── 1. Intro ──────────────────────────────────────────────────────── */}
      <section className="relative isolate overflow-hidden">
        <div className="wrap relative grid gap-10 pb-4 pt-14 sm:gap-14 sm:pt-20 lg:min-h-[640px] lg:grid-cols-[1.05fr_minmax(0,0.95fr)] lg:items-center lg:gap-16">
          <div className="reveal relative z-10">
            <p className="eyebrow">{SITE.region} &middot; Indoor cultivators worldwide</p>
            <h1 aria-label="Grow with us" className="mt-5 text-[2.6rem] leading-[1.02] sm:text-6xl lg:text-[4.2rem]">
              <span className="grow-word text-flare">
                {"Grow".split("").map((c, i) => (
                  <span key={i} className="grow-letter" style={{ animationDelay: `${0.12 + i * 0.09}s`, ["--lean" as string]: `${i % 2 ? 5 : -5}deg` }}>
                    {c}
                  </span>
                ))}
              </span>{" "}
              <br />
              with us
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-bone/85">
              Rooms that look like the one below are not luck. They are a program, run the same way every time, by
              somebody who runs a licensed Michigan facility for a living. You can learn it, you can ask about your own
              room, or you can run your rooms with us.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link href="#learn" className="btn-ghost">
                Learn it
              </Link>
              <Link href="#call" className="btn-primary">
                Book a call
              </Link>
              <Link href="#co-management" className="btn-ghost">
                Run it with us
              </Link>
            </div>
          </div>

          {/* ONE sun, two placements; the rules on contrast over the disc are in git
              history on this file and still hold: no paragraph over the fire. */}
          <div className="reveal pointer-events-none relative mx-auto w-[86%] max-w-[380px] lg:absolute lg:-right-[5%] lg:-top-[24%] lg:-z-10 lg:mx-0 lg:w-[40vw] lg:max-w-[560px]">
            <Sun />
            <span
              aria-hidden
              className="pointer-events-none absolute inset-x-[-40%] bottom-full h-[200px] bg-[linear-gradient(to_bottom,#060403_0%,#060403_66%,rgba(6,4,3,0.6)_84%,transparent_100%)] lg:hidden"
            />
            <MirrorLockup className="absolute left-1/2 top-[47%] h-auto w-[62%] -translate-x-1/2 -translate-y-1/2 text-ink lg:hidden" />
          </div>
        </div>
        <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 hidden h-[124px] bg-gradient-to-b from-ink via-ink/45 to-transparent lg:-z-10 lg:block" />
      </section>

      {/* The canopy: the picture the statement is about. His own room, late in
          flower. Text sits beside it, never over it. */}
      <section className="wrap mt-6 sm:mt-10">
        <div className="reveal overflow-hidden rounded-xl2 border border-line">
          <Image src={roomCanopy} alt="The flower canopy at lights-off, colas standing through the trellis net." priority sizes="(min-width: 1152px) 1120px, 100vw" className="aspect-[16/7] h-auto w-full object-cover" />
        </div>
        <dl className="reveal mt-6 grid gap-px overflow-hidden rounded-xl2 border border-line bg-line sm:grid-cols-3">
          {CREDS.map((c) => (
            <div key={c.label} className="bg-ink-panel px-6 py-6">
              <dt className="font-display text-2xl font-extrabold text-flare">{c.stat}</dt>
              <dd className="mt-2 text-sm leading-relaxed text-muted">{c.label}</dd>
            </div>
          ))}
        </dl>
      </section>

      {/* ── 2. Patreon and Instagram ──────────────────────────────────────── */}
      <section id="learn" className="wrap mt-24 scroll-mt-24 sm:mt-32">
        <div className="reveal max-w-2xl">
          <p className="eyebrow">Learn it</p>
          <h2 className="mt-4 text-3xl sm:text-4xl">The work is public. The method is on Patreon.</h2>
        </div>
        <div className="mt-12 grid gap-10 lg:grid-cols-2 lg:gap-14">
          {/* Instagram */}
          <div className="reveal">
            <div className="flex flex-wrap items-baseline justify-between gap-3">
              <h3 className="text-2xl text-bone">Instagram</h3>
              <a href={SITE.instagram} className="text-sm font-semibold text-flare hover:underline" rel="noopener">
                @mi_gas_2.0
              </a>
            </div>
            <p className="mt-3 text-[15px] leading-relaxed text-muted">
              The foundation. Every run photographed in the same rooms, one after another, is the work that built the
              name. Scroll it and check the results against the writing.
            </p>
            <ul className="mt-5 grid grid-cols-2 gap-3">
              {INSTAGRAM_POSTS.map((p, i) =>
                p.caption === "PLACEHOLDER" ? (
                  <li key={i} className="flex aspect-square items-center justify-center rounded-xl2 border border-dashed border-edge/70 bg-ink-panel/40 p-4 text-center text-xs text-muted">
                    Fourth post: send the link and it goes here.
                  </li>
                ) : (
                  <li key={i}>
                    <a href={p.href} rel="noopener" className="group block overflow-hidden rounded-xl2 border border-line">
                      <Image src={igImages[i]} alt={p.caption} sizes="(min-width: 1024px) 270px, 45vw" className="aspect-square h-auto w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]" />
                    </a>
                  </li>
                )
              )}
            </ul>
          </div>

          {/* Patreon */}
          <div className="reveal">
            <div className="flex flex-wrap items-baseline justify-between gap-3">
              <h3 className="text-2xl text-bone">Patreon</h3>
              <a href={PATREON.url} className="text-sm font-semibold text-flare hover:underline" rel="noopener">
                patreon.com/Mi_gas_
              </a>
            </div>
            <p className="mt-3 text-[15px] leading-relaxed text-muted">
              Where you learn it, from {SITE.name} and other working pros: video SOPs and full clone-to-harvest guides.{" "}
              {PATREON.stats.totalMembers} growers inside, {PATREON.stats.posts} posts, from ${PATREON.stats.priceFrom} a
              month.
            </p>
            <ul className="mt-5 grid grid-cols-2 gap-3">
              {PATREON_POSTS.map((p) => (
                <li key={p.title}>
                  <a href={p.href} rel="noopener" className="card flex h-full flex-col p-5 transition-colors hover:border-flare">
                    <span className="eyebrow">Guide</span>
                    <span className="mt-2 font-display text-lg font-bold leading-snug text-bone">{p.title}</span>
                    <span className="mt-2 text-sm leading-relaxed text-muted">{p.blurb}</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ── 3. Schedule a consulting call ─────────────────────────────────── */}
      <section id="call" className="wrap mt-24 scroll-mt-24 sm:mt-32">
        <div className="reveal grid gap-8 lg:grid-cols-[1fr_1.1fr] lg:items-end">
          <div>
            <p className="eyebrow">Schedule a consulting call</p>
            <h2 className="mt-4 text-3xl sm:text-4xl">Fill in your facility profile, then pick a time</h2>
            <p className="mt-4 text-lg leading-relaxed text-muted">
              The profile takes a few minutes and saves the first twenty of the call. Rooms, lights, media, feed,
              sensors, what is happening, and your photos. We read all of it before we dial in.
            </p>
          </div>
          <ul className="grid gap-2 sm:grid-cols-2">
            {CONSULT_TOPICS.map((t) => (
              <li key={t} className="card flex items-center gap-3 px-4 py-3 text-[15px] text-bone/90">
                <span className="dot bg-flare" aria-hidden="true" />
                {t}
              </li>
            ))}
          </ul>
        </div>

        <div className="reveal mt-10 grid gap-6 md:grid-cols-2">
          {SESSIONS.map((s, i) => (
            <SessionCard key={s.slug} session={s} href="/consulting#book" featured={i === 1} />
          ))}
        </div>

        <div className="reveal mt-6 flex flex-col gap-6 rounded-xl2 border border-line bg-ink-panel p-7 sm:flex-row sm:items-center sm:justify-between sm:p-8">
          <p className="max-w-2xl text-[15px] leading-relaxed text-muted">
            Pick a time from the live calendar, pay, and the invite lands on both calendars with a reminder before the
            call. Times come off the grid the moment they are taken.
          </p>
          <Link href="/consulting#book" className="btn-primary shrink-0">
            Book a call
          </Link>
        </div>
      </section>

      {/* ── 4. Co-management ─────────────────────────────────────────────── */}
      <section id="co-management" className="wrap mt-24 scroll-mt-24 sm:mt-32">
        <div className="reveal flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-2xl">
            <p className="eyebrow">{SITE.name} co-management</p>
            <h2 className="mt-4 text-3xl sm:text-4xl">We run the room with you</h2>
            <p className="mt-4 text-lg leading-relaxed text-muted">
              Irrigation and environment steered off your own sensor data, run by run, with your head grower on the
              floor and a weekly call that ends in actions with names on them.
            </p>
          </div>
          <Link href="/co-management" className="btn-ghost">
            The full page
          </Link>
        </div>

        {/* The KPIs it is judged on, then the results so far. */}
        <div className="reveal mt-10 grid gap-6 lg:grid-cols-[1fr_1.4fr]">
          <div className="card p-6">
            <p className="eyebrow">What we are judged on</p>
            <ul className="mt-3 space-y-2">
              {COMANAGEMENT.kpis.map((k) => (
                <li key={k} className="flex items-center gap-3 text-[15px] text-bone/90">
                  <span className="dot bg-flare" aria-hidden="true" />
                  {k}
                </li>
              ))}
            </ul>
          </div>
          <dl className="grid gap-px overflow-hidden rounded-xl2 border border-line bg-line sm:grid-cols-3">
            {CREDS.map((c) => (
              <div key={c.label} className="bg-ink-panel px-6 py-6">
                <dt className="font-display text-2xl font-extrabold text-flare">{c.stat}</dt>
                <dd className="mt-2 text-sm leading-relaxed text-muted">{c.label}</dd>
              </div>
            ))}
          </dl>
        </div>

        {/* The service. */}
        <div className="reveal mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {COMANAGEMENT.services.map((s) => (
            <div key={s.name} className="card flex flex-col p-6">
              <h3 className="text-lg leading-snug text-bone">{s.name}</h3>
              <p className="mt-3 flex-1 text-sm leading-relaxed text-muted">{s.body}</p>
            </div>
          ))}
        </div>
        <ul className="reveal mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {COMANAGEMENT.cadence.map((c) => (
            <li key={c} className="flex gap-3 text-sm leading-relaxed text-muted">
              <span className="mt-2 dot bg-ember" aria-hidden="true" />
              {c}
            </li>
          ))}
        </ul>

        {/* The software. A real screenshot of the platform, with the live demo a click away. */}
        <div className="reveal mt-12 grid gap-8 lg:grid-cols-[1.3fr_1fr] lg:items-center">
          <a href={COMANAGEMENT.software.demo} rel="noopener" className="group block overflow-hidden rounded-xl2 border border-line" aria-label={`Open the ${COMANAGEMENT.software.name} demo`}>
            <Image src={rgsOverview} alt={`The ${COMANAGEMENT.software.name} overview: rooms needing a look, each run as a bar from flip to harvest, check-ins due this week.`} sizes="(min-width: 1024px) 640px, 100vw" className="h-auto w-full transition-transform duration-300 group-hover:scale-[1.01]" />
          </a>
          <div>
            <p className="eyebrow">The software</p>
            <h3 className="mt-3 text-2xl text-bone">{COMANAGEMENT.software.name}</h3>
            <p className="mt-3 text-[15px] leading-relaxed text-muted">{COMANAGEMENT.software.blurb}</p>
            <a href={COMANAGEMENT.software.demo} rel="noopener" className="btn-ghost mt-5">
              Open the demo
            </a>
          </div>
        </div>

        {/* The price breakdown, in the proposal's own shape: the number big, the
            terms small under it, one box per tier. */}
        <div className="reveal mt-12">
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <p className="eyebrow">Price breakdown</p>
            <p className="text-sm text-muted">{COMANAGEMENT.rule}</p>
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {COMANAGEMENT.tiers.map((t, i) => (
              <div key={t.name} className={`card p-6 ${i === 1 ? "border-ember/60" : ""}`}>
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">{t.name}</p>
                <p className="mt-2 font-display text-3xl font-extrabold text-bone">
                  {money(t.monthly)}
                  {t.open ? "+" : ""}
                  <span className="text-sm font-semibold text-muted">/mo</span>
                </p>
                <p className="mt-3 text-sm leading-relaxed text-muted">
                  {t.rooms}, or {t.lights}.
                </p>
              </div>
            ))}
          </div>
          <div className="mt-6 flex flex-wrap items-center gap-4">
            <Link href="/co-management#apply" className="btn-primary">
              Apply for co-management
            </Link>
            <Link href="/co-management#conditions" className="text-sm font-semibold text-flare hover:underline">
              What your room needs first
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
