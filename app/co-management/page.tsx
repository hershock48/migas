import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import Faq from "@/components/Faq";
import FeedRig from "@/components/FeedRig";
import MiniForm, { type MiniField } from "@/components/MiniForm";
import SteerLoop from "@/components/SteerLoop";
import { requestCoManagement } from "@/app/actions";
import { COMANAGE_APPLY, COMANAGE_FAQ, COMANAGEMENT, CREDS, SITE, money } from "@/lib/site";
import flowerDepth from "@/public/assets/rooms/flower-depth.webp";

export const metadata: Metadata = {
  title: "Co-Management",
  description:
    "Co-management for commercial grows: we steer irrigation and climate remotely off your sensor data while your head grower runs the floor. Four tiers, set by flower rooms or lights.",
  /**
   * This page gets its own link card, because it is the page that gets forwarded:
   * into a facility's ownership group, and into the division conversations. Next
   * does not deep-merge openGraph (see OG_IMAGE in lib/site.ts), so the block
   * restates everything; the url carries the same /demo seam as app/layout.tsx and
   * loses it in the same cutover commit.
   */
  openGraph: {
    type: "website",
    siteName: SITE.name,
    title: `Co-Management - ${SITE.name}`,
    description:
      "We steer irrigation and climate remotely off your sensor data while your head grower runs the floor. Four tiers, set by flower rooms or lights.",
    url: `${SITE.url}/demo/co-management`,
    images: [
      {
        url: "/og-comanagement.jpg",
        width: 1200,
        height: 630,
        alt: "The MI Gas mark over a burning sun, with the words Co-management",
      },
    ],
  },
  twitter: { card: "summary_large_image", images: ["/og-comanagement.jpg"] },
};

/**
 * The co-management offer, from the owner's own outline on the 2026-08-27 call.
 * Every term on this page reads from COMANAGEMENT in lib/site.ts, so his next
 * correction is one edit there.
 *
 * The page is ordered as a filter: what we run, what it costs, what your room has
 * to bring. The conditions sit before the closing CTA on purpose. A facility that
 * cannot meet the sensor requirement finds out here rather than on a paid call,
 * which is cheaper for both sides.
 */
export default function CoManagement() {
  return (
    <>
      <section className="wrap pt-14 sm:pt-20">
        <div className="grid gap-10 lg:grid-cols-[1.1fr_minmax(0,0.9fr)] lg:items-center lg:gap-16">
          <div className="reveal max-w-3xl">
            <p className="eyebrow">Co-management</p>
            <h1 className="mt-5 text-[2.4rem] leading-[1.05] sm:text-6xl">
              Co-management for commercial <span className="text-flare">flower rooms</span>
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-bone/85">{COMANAGEMENT.intro}</p>
            <div className="mt-9 flex flex-wrap gap-3">
              {/* The full hour, already chosen: its own description names "a facility
                  weighing co-management". */}
              <Link href="/consulting?session=hour#book" className="btn-primary">
                Book a call
              </Link>
              <Link href="#conditions" className="btn-ghost">
                What your room needs
              </Link>
            </div>
          </div>
          {/* The page's own picture: the steering circuit, with the sensor platforms and
              the head grower drawn into it, because both are conditions and the drawing
              should say so before the prose does. */}
          <SteerLoop className="reveal mx-auto w-full max-w-[320px] lg:max-w-[380px]" />
        </div>
      </section>

      {/* ── What we run ──────────────────────────────────────────────────────── */}
      <section className="wrap mt-24 sm:mt-32">
        <div className="reveal max-w-2xl">
          <p className="eyebrow">What we run</p>
          <h2 className="mt-4 text-3xl sm:text-4xl">What we take over</h2>
        </div>
        <div className="mt-12 grid gap-12 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-start">
          <div className="reveal grid gap-6 sm:grid-cols-2">
            {COMANAGEMENT.services.map((s) => (
              <div key={s.name} className="card flex flex-col p-7">
                <h3 className="text-xl leading-snug text-bone">{s.name}</h3>
                <p className="mt-4 flex-1 text-[15px] leading-relaxed text-muted">{s.body}</p>
              </div>
            ))}
          </div>
          {/* The fertigation cross-section, moved here from the retired guides page:
              irrigation is the first card in this grid, and the drawing shows the thing
              that card steers — feed in, wet front down, runoff read at the bottom. */}
          <FeedRig className="reveal mx-auto w-full max-w-[290px] lg:mx-0 lg:max-w-none" />
        </div>
      </section>

      {/* ── The record ───────────────────────────────────────────────────────
          The proof, on the page that costs the most. The home page has carried these
          three since the creds strip was rebuilt out of his own posts; a facility
          director who lands here directly, off a forwarded link, was seeing the
          biggest ask on the site with no evidence anywhere on it. Same data, one
          source (CREDS in lib/site.ts), so the two pages can never disagree. */}
      <section className="wrap mt-24 sm:mt-32">
        {/* The paragraph says the rooms "are photographed run after run so you can check
            the claim against the pictures", and until 2026-11-11 there was not one picture
            on the page. Now there is one of his rooms beside the numbers. On a phone it
            follows the figures rather than leading, so the claim is read before the proof. */}
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)] lg:items-center lg:gap-14">
          <div>
            <div className="reveal max-w-2xl">
              <p className="eyebrow">The record</p>
              <h2 className="mt-4 text-3xl sm:text-4xl">The numbers behind the program</h2>
              <p className="mt-4 text-lg leading-relaxed text-muted">
                All three come from our own published posts, and the rooms are on
                Instagram run after run, so you can check the numbers against the pictures.
              </p>
            </div>
            <dl className="reveal mt-10 grid gap-px overflow-hidden rounded-xl2 border border-line bg-line sm:grid-cols-3">
              {CREDS.map((c) => (
                <div key={c.label} className="bg-ink-panel px-6 py-7">
                  <dt className="font-display text-2xl font-extrabold text-flare">{c.stat}</dt>
                  <dd className="mt-2 text-sm leading-relaxed text-muted">{c.label}</dd>
                </div>
              ))}
            </dl>
            {/* Same dashed note as the home strip, shorter: these figures are his, from
                dated posts, and go live only once he confirms they still hold. */}
            <div className="reveal mt-6 rounded-xl2 border border-dashed border-edge/70 bg-ink-panel/40 p-5">
              <p className="eyebrow">Your figures, needing a re-check</p>
              <p className="mt-2 text-[15px] leading-relaxed text-muted">
                These are the same three as on the home page. The posts they come from are
                dated, so please confirm the numbers still hold before launch.
              </p>
            </div>
          </div>
          <Image
            src={flowerDepth}
            alt="A long bed of flowering plants in the trellis net under LED light bars, the far end of the room out of focus."
            sizes="(min-width: 1024px) 420px, 100vw"
            className="reveal aspect-[4/5] h-auto w-full rounded-xl2 border border-line object-cover sm:aspect-[16/10] lg:aspect-[4/5]"
          />
        </div>
      </section>

      {/* ── Price ────────────────────────────────────────────────────────────── */}
      <section className="wrap mt-24 sm:mt-32">
        <div className="reveal max-w-2xl">
          <p className="eyebrow">Price breakdown</p>
          <h2 className="mt-3 text-2xl text-bone sm:text-3xl">Priced by flower rooms or lights, whichever is higher</h2>
          <p className="mt-3 text-[15px] leading-relaxed text-muted">{COMANAGEMENT.rule}</p>
        </div>
        <div className="reveal mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
        <ul className="reveal mt-6 grid gap-2 sm:grid-cols-2">
          {COMANAGEMENT.cadence.map((c) => (
            <li key={c} className="flex gap-3 text-sm leading-relaxed text-muted">
              <span className="mt-2 dot bg-ember" aria-hidden="true" />
              {c}
            </li>
          ))}
        </ul>
        <div className="reveal mt-8 flex flex-wrap items-center gap-4">
          {/* Straight to the application: it collects the two facts a tier needs,
              room count and light count, and the sensors. */}
          <Link href="#apply" className="btn-primary">
            Apply for co-management
          </Link>
          <a href={COMANAGEMENT.software.demo} rel="noopener" className="text-sm font-semibold text-flare hover:underline">
            See the software it runs on
          </a>
        </div>
      </section>

      {/* ── Conditions ───────────────────────────────────────────────────────── */}
      <section id="conditions" className="wrap mt-24 scroll-mt-24 sm:mt-32">
        <div className="reveal max-w-2xl">
          <p className="eyebrow">The conditions</p>
          <h2 className="mt-4 text-3xl sm:text-4xl">What your room has to bring</h2>
          <p className="mt-4 text-lg leading-relaxed text-muted">
            We don&rsquo;t take on a room without both, because we can&rsquo;t steer it
            remotely without them.
          </p>
        </div>
        <div className="reveal mt-12 grid gap-6 md:grid-cols-2">
          {COMANAGEMENT.requirements.map((r) => (
            <div key={r.name} className="card flex flex-col border-ember/40 p-7">
              <h3 className="text-xl leading-snug text-bone">{r.name}</h3>
              <p className="mt-4 flex-1 text-[15px] leading-relaxed text-muted">{r.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── The application ──────────────────────────────────────────────────
          His outline, from the call: "enter in a bunch of info about their grow and
          what they're looking for to become a client." It sits AFTER the conditions
          on purpose: a facility that reaches this form has read what the room has to
          bring, and the sensor answer here still accepts the disqualifying options —
          see the capture-not-wall note on COMANAGE_APPLY in lib/site.ts. */}
      <section id="apply" className="wrap mt-24 scroll-mt-24 sm:mt-32">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:gap-16">
          <div className="reveal">
            <p className="eyebrow">Apply</p>
            <h2 className="mt-4 text-3xl sm:text-4xl">Tell us about the room</h2>
            <p className="mt-4 text-lg leading-relaxed text-muted">
              Your light count and sensors set the price, and the rest helps us plan the
              first call. We&rsquo;ll read it and get back to you with a call, your tier and
              a start date, or tell you why it isn&rsquo;t a fit yet.
            </p>
            <p className="mt-4 text-sm leading-relaxed text-muted">
              If you&rsquo;d rather talk first,{" "}
              <Link href="/consulting#call" className="text-flare hover:underline">
                leave a number and we&rsquo;ll call you
              </Link>
              .
            </p>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              If you&rsquo;re deciding with partners,{" "}
              <Link href="/co-management/one-pager" className="text-flare hover:underline">
                the whole model fits on one printable page
              </Link>
              .
            </p>
          </div>
          <MiniForm
            className="reveal"
            action={requestCoManagement}
            columns={2}
            fields={COMANAGE_APPLY as readonly MiniField[]}
            submit="Send the application"
            note="This comes straight to us. You can send it even if you don't meet a condition yet, and we'll tell you what the room would need."
          />
        </div>
      </section>

      {/* ── What comes with it ───────────────────────────────────────────────── */}
      <section className="wrap mt-24 sm:mt-32">
        <div className="reveal max-w-2xl">
          <p className="eyebrow">Around the program</p>
          <h2 className="mt-4 text-3xl sm:text-4xl">What comes with it</h2>
        </div>
        <div className="reveal mt-12 grid gap-px overflow-hidden rounded-xl2 border border-line bg-line sm:grid-cols-2">
          {COMANAGEMENT.extras.map((e) => (
            <div key={e.name} className="bg-ink-panel p-7">
              <h3 className="text-lg leading-snug text-bone">{e.name}</h3>
              <p className="mt-3 text-[15px] leading-relaxed text-muted">{e.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────────────────────
          What a licensed operation asks before letting outsiders steer its rooms.
          Half the answers are drafts awaiting him, rendered as drafts, because the
          questions get asked whether or not the page answers them. */}
      <section className="wrap mt-24 sm:mt-32">
        <div className="reveal max-w-2xl">
          <p className="eyebrow">Before you apply</p>
          <h2 className="mt-4 text-3xl sm:text-4xl">What facilities ask first</h2>
        </div>
        <Faq items={COMANAGE_FAQ} />
      </section>

      {/* ── Close ────────────────────────────────────────────────────────────── */}
      <section className="wrap mt-24 sm:mt-32">
        <div className="reveal max-w-2xl">
          <p className="eyebrow">Start with a call</p>
          <h2 className="mt-4 text-3xl sm:text-4xl">The first call sets your tier</h2>
          <p className="mt-4 text-lg leading-relaxed text-muted">
            Bring your light count, your sensors, your media, and where you think the room
            is losing money. By the end of the call you&rsquo;ll know your tier and a start
            date, or why it isn&rsquo;t a fit yet.
          </p>
          <div className="mt-9 flex flex-wrap gap-3">
            <Link href="/consulting?session=hour#book" className="btn-primary">
              Book a call
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
