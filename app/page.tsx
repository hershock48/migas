import Link from "next/link";
import Image from "next/image";
import { preload } from "react-dom";
import type { Metadata } from "next";
import Sun from "@/components/Sun";
import roomBench from "@/public/assets/rooms/bench.webp";
import roomCanopy from "@/public/assets/rooms/canopy.webp";
import roomCola from "@/public/assets/rooms/cola.webp";
import flowerRows from "@/public/assets/rooms/flower-rows.webp";
import flowerAisle from "@/public/assets/rooms/flower-aisle.webp";
import flowerDepth from "@/public/assets/rooms/flower-depth.webp";
import rgsOverview from "@/public/assets/rgs/rgs-overview.webp";
import { MirrorLockup } from "@/components/brand";
import { SessionCard } from "@/components/cards";
import { COMANAGEMENT, CONSULT_TOPICS, CREDS, INSTAGRAM_POSTS, PATREON, PATREON_POSTS, SESSIONS, SITE, money } from "@/lib/site";

export const metadata: Metadata = {
  // absolute, because the layout's "%s - MI Gas" template only reaches child segments,
  // never the page beside it. The plain string made the home page the one title on the
  // site without the name in it, in the tab and in search results.
  title: { absolute: `${SITE.name} - ${SITE.tagline}` },
  description:
    "Cultivation advice from a licensed Michigan facility: guides on Patreon from $100 a month, consulting calls at $250 and $400, and co-management from $2,000 a month.",
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
/**
 * The three photographs under the intro, sent by Kevin on 2026-11-11 and taken from
 * Jake's camera roll on 2026-11-04. They replaced the lights-off canopy shot, which was
 * a 720px image stretched to 1120 and mostly black: the hero says "rooms that look like
 * the ones below", and below was a dark smudge. Converted to WebP with every byte of
 * metadata dropped (no GPS was present; a licensed facility's location is still not
 * something to ship by accident). The alt text describes what is in the frame and
 * claims nothing about which run, strain or week it is, because we do not know.
 */
const ROOMS = [
  { src: flowerRows, alt: "A flower room in late flower: rows of frosted colas under LED light bars, trellis posts down each bed." },
  { src: flowerAisle, alt: "The same kind of room seen down the aisle, the canopy level from bed to bed." },
  { src: flowerDepth, alt: "A long bed of flowering plants in the trellis net, the far end of the room out of focus." },
];

export default function Home() {
  /* THE LCP IS A CSS BACKGROUND, SO THE BROWSER FINDS IT LATE. On a throttled phone the
     largest paint on this page is the sun's flame layer, and its texture is a
     background-image in globals.css: nothing requests it until the stylesheet has
     arrived and been parsed, about 540ms in on the perf-check profile. This hint puts it
     in the head, so it starts with the fonts. Home only, because the sun is only here. */
  preload("/noise/plasma-a.webp", { as: "image", fetchPriority: "high" });
  const igImages = [roomBench, roomCanopy, roomCola];
  /* THE THREE WAYS IN, WITH THEIR PRICES. Jake's intro is "the sun, his canopy, three
     ways in", and the three ways were three pill buttons that said what each path was
     called and nothing about what it cost. His own writing is the brief here: one real
     number outperforms a paragraph of positioning. Each row now carries its entry price,
     read from the same constants the sections below use, so the ladder from $100 a month
     to $2,000 a month is visible before the first scroll. The call is the one in ember,
     because booking is what the site was built for. */
  const ways = [
    { href: "#learn", label: "Learn it", detail: `On Patreon, from $${PATREON.stats.priceFrom} a month`, primary: false },
    {
      href: "#call",
      label: "Book a call",
      detail: SESSIONS.map((s) => `${s.name.toLowerCase()} ${money(s.price)}`).join(", ").replace(/^./, (c) => c.toUpperCase()),
      primary: true,
    },
    { href: "#co-management", label: "Run it with us", detail: `Co-management from ${money(COMANAGEMENT.tiers[0].monthly)} a month`, primary: false },
  ];
  return (
    <>
      {/* ── 1. Intro ──────────────────────────────────────────────────────── */}
      <section className="relative isolate overflow-hidden">
        {/* pb-24 / sm:pb-32: below lg the sun sits in the flow at the foot of this
            section, and its glow reaches 34% of its width past the disc (the corona's
            inset in globals.css). With pb-4 the section's overflow-hidden cut the glow
            16px under the disc at 390px and 66px short at 320px, a hard straight edge
            across the screen. Measured 2026-11-11; the padding is the overhang. */}
        <div className="wrap relative grid gap-10 pb-24 pt-14 sm:gap-14 sm:pb-32 sm:pt-20 lg:min-h-[640px] lg:grid-cols-[1.05fr_minmax(0,0.95fr)] lg:items-center lg:gap-16 lg:pb-4 print:pb-4">
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
              Rooms like the ones below come from a program run the same way every time. We run one at a licensed
              facility in Michigan, and we teach it.
            </p>
            <ul className="mt-9 grid max-w-xl gap-2.5">
              {ways.map((w) => (
                <li key={w.href}>
                  <Link
                    href={w.href}
                    className={`group flex items-center gap-4 rounded-xl2 border px-5 py-4 transition-colors ${
                      w.primary ? "border-ember/70 bg-ember/[0.09] hover:border-flare" : "border-line bg-ink-panel/70 hover:border-edge"
                    }`}
                  >
                    <span className="min-w-0 flex-1">
                      <span className={`block font-display text-lg font-semibold ${w.primary ? "text-flare" : "text-bone"}`}>{w.label}</span>
                      <span className="mt-0.5 block text-sm text-muted">{w.detail}</span>
                    </span>
                    <span aria-hidden className="text-lg text-flare transition-transform duration-150 group-hover:translate-x-1">
                      &rarr;
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* ONE sun, two placements; the rules on contrast over the disc are in git
              history on this file and still hold: no paragraph over the fire. */}
          <div className="reveal pointer-events-none relative mx-auto w-[86%] max-w-[380px] print:hidden lg:absolute lg:-right-[5%] lg:-top-[24%] lg:-z-10 lg:mx-0 lg:w-[40vw] lg:max-w-[560px]">
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

      {/* The rooms: the pictures the statement is about. Text sits beside them, never
          over them. Three across from a tablet up. On a phone, ONE: the first draft was a
          swipeable row of all three, and on the throttled phone profile those 316KB raced
          the sun's textures for the same 1.6Mbps and pushed LCP from 3,120ms to 3,720ms.
          Hidden lazy images are never fetched, so the other two cost a phone nothing, and
          both appear elsewhere (consulting, co-management). The results strip that used to
          sit here is in section 4, where Jake asked for "the KPIs and results"; it ran
          twice on the page. */}
      <section aria-label="Our flower rooms" className="wrap mt-6 sm:mt-10">
        <div className="reveal grid gap-3 md:grid-cols-3">
          {/* Not priority, and low fetch priority: the largest paint on this page is the
              sun, and on a phone this photo sits below it, off the first screen. q60
              because foliage is the worst case for WebP and 75 bought nothing visible. */}
          {ROOMS.map((r, i) => (
            <div key={r.alt} className={i === 0 ? "" : "hidden md:block"}>
              <Image
                src={r.src}
                alt={r.alt}
                quality={60}
                fetchPriority="low"
                sizes="(min-width: 1152px) 368px, (min-width: 768px) 32vw, calc(100vw - 2.5rem)"
                className="aspect-[4/5] h-auto w-full rounded-xl2 border border-line object-cover"
              />
            </div>
          ))}
        </div>
      </section>

      {/* ── 2. Patreon and Instagram ──────────────────────────────────────── */}
      <section id="learn" className="wrap mt-24 scroll-mt-24 sm:mt-32">
        <div className="reveal max-w-2xl">
          <p className="eyebrow">Learn it</p>
          <h2 className="mt-4 text-3xl sm:text-4xl">Instagram and Patreon</h2>
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
              We post every run from the same rooms, one after another, so you can scroll back and check the results
              against what we write.
            </p>
            <ul className="mt-5 grid grid-cols-2 gap-3">
              {INSTAGRAM_POSTS.map((p, i) =>
                p.caption === "PLACEHOLDER" ? (
                  /* Until he names a fourth post, the slot is a way through to the
                     profile. It said "Fourth post: send the link and it goes here.",
                     which is a note to him printed on his public home page. */
                  <li key={i}>
                    <a
                      href={SITE.instagram}
                      rel="noopener"
                      className="flex aspect-square flex-col justify-end rounded-xl2 border border-line bg-ink-panel bg-[radial-gradient(120%_90%_at_100%_0%,rgba(217,94,39,0.32),transparent_62%)] p-5 transition-colors hover:border-flare"
                    >
                      <span className="eyebrow">More</span>
                      <span className="mt-2 font-display text-lg font-bold leading-snug text-bone">See every run on the profile</span>
                      <span className="mt-2 text-sm font-semibold text-flare">@mi_gas_2.0 &rarr;</span>
                    </a>
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
              Video SOPs and full clone-to-harvest guides, from us and from other working growers.{" "}
              {PATREON.stats.totalMembers} members and {PATREON.stats.posts} posts so far. Paid tiers start at{" "}
              {money(PATREON.stats.priceFrom)} a month.
            </p>
            <ul className="mt-5 grid grid-cols-2 gap-3">
              {PATREON_POSTS.map((p) => (
                <li key={p.title}>
                  {/* The arrow says "link" on a phone, where there is no hover to say it. */}
                  <a href={p.href} rel="noopener" className="card flex h-full flex-col p-5 transition-colors hover:border-flare">
                    <span className="eyebrow">Guide</span>
                    <span className="mt-2 font-display text-lg font-bold leading-snug text-bone">{p.title}</span>
                    <span className="mt-2 text-sm leading-relaxed text-muted">{p.blurb}</span>
                    <span aria-hidden className="mt-auto pt-3 text-flare">
                      &rarr;
                    </span>
                  </a>
                </li>
              ))}
            </ul>
            {/* Each of the other two ways in ends on a button; this one ended on four
                cards and a handle in the corner. */}
            <a href={PATREON.url} rel="noopener" className="btn-ghost mt-6">
              Join on Patreon
            </a>
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
              The profile asks about your rooms, lights, media, feed, sensors and what&rsquo;s going wrong, and you
              can add photos. It takes a few minutes. We read it before the call so we don&rsquo;t spend the first twenty
              minutes asking.
            </p>
          </div>
          {/* A plain list, as on /consulting. Bordered chips beside the session cards
              looked like options to tap, and tapping one did nothing. */}
          <ul className="grid gap-x-6 gap-y-2.5 sm:grid-cols-2">
            {CONSULT_TOPICS.map((t) => (
              <li key={t} className="flex gap-3 text-[15px] leading-relaxed text-bone/90">
                <span className="dot mt-[9px] bg-flare" aria-hidden="true" />
                {t}
              </li>
            ))}
          </ul>
        </div>

        <div className="reveal mt-10 grid gap-6 md:grid-cols-2">
          {SESSIONS.map((s) => (
            <SessionCard key={s.slug} session={s} />
          ))}
        </div>

        {/* This was a third panel with a third "Book a call" button under two cards that
            each already end in one. The sentence is what it was for. */}
        <p className="reveal mt-6 max-w-3xl text-[15px] leading-relaxed text-muted">
          You pick a time from the live calendar, and the invite goes on both calendars with a reminder the day
          before. Booked times drop off the calendar right away.
        </p>
      </section>

      {/* ── 4. Co-management ─────────────────────────────────────────────── */}
      <section id="co-management" className="wrap mt-24 scroll-mt-24 sm:mt-32">
        <div className="reveal flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-2xl">
            <p className="eyebrow">{SITE.name} co-management</p>
            <h2 className="mt-4 text-3xl sm:text-4xl">We run the room with you</h2>
            <p className="mt-4 text-lg leading-relaxed text-muted">
              We steer irrigation and climate off your own sensor data, run by run. Your head grower runs the floor,
              and every week there&rsquo;s a call that ends with a list of who does what.
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
          <div className="mt-4 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            {COMANAGEMENT.tiers.map((t) => (
              <div key={t.name} className="card p-4 sm:p-6">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">{t.name}</p>
                <p className="mt-2 whitespace-nowrap font-display text-lg font-extrabold text-bone min-[360px]:text-xl min-[375px]:text-2xl sm:text-3xl">
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
          {/* What every tier includes. It sat in four columns under the four service
              cards, where each line read as a caption for the card above it ("Clone,
              mother and veg advisory" under "Cost reduction"). Here, as on
              /co-management, and two across so it is not one line per tier either. */}
          <ul className="mt-6 grid gap-2 sm:grid-cols-2">
            {COMANAGEMENT.cadence.map((c) => (
              <li key={c} className="flex gap-3 text-sm leading-relaxed text-muted">
                <span className="mt-2 dot bg-ember" aria-hidden="true" />
                {c}
              </li>
            ))}
          </ul>
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
