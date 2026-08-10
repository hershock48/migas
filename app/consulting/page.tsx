import type { Metadata } from "next";
import Link from "next/link";
import Booking from "@/components/Booking";
import { SessionCard } from "@/components/cards";
import { AVAILABILITY, FAQ, PROCESS, SESSIONS } from "@/lib/site";
import { slotGrid } from "@/lib/slots";

export const metadata: Metadata = {
  title: "Consulting",
  description:
    "Book a cultivation consult: room triage, a full program review, or facility SOP work. Every call starts with an eight-question room intake and your photos, read before you dial in.",
};

/**
 * Slots are generated per request, not at build, or the calendar would be frozen on the
 * day of the deploy. An hour of caching is plenty — availability here comes from a
 * weekly pattern, so it only changes when somebody edits lib/site.ts.
 */
export const revalidate = 3600;

export default function Consulting() {
  const days = slotGrid();

  return (
    <>
      <section className="wrap pt-14 sm:pt-20">
        <div className="reveal max-w-3xl">
          <p className="eyebrow">Consulting</p>
          <h1 className="mt-5 text-[2.4rem] leading-[1.05] sm:text-6xl">
            A call that starts at the <span className="text-flare">diagnosis</span>
          </h1>
          <p className="mt-6 text-lg leading-relaxed text-bone/85">
            Most paid consults spend their first twenty minutes on questions a form could
            have asked. This one asks them first &mdash; stage, canopy, media, feed, lights,
            runoff &mdash; and takes your photos with them, so the time you pay for is spent
            on the answer.
          </p>
          <div className="mt-9 flex flex-wrap gap-3">
            <Link href="#book" className="btn-primary">
              Book a consult
            </Link>
            <Link href="#how" className="btn-ghost">
              How it runs
            </Link>
          </div>
        </div>
      </section>

      {/* ── How it runs ──────────────────────────────────────────────────────── */}
      <section id="how" className="wrap mt-24 scroll-mt-24 sm:mt-32">
        <div className="reveal max-w-2xl">
          <p className="eyebrow">Before, during, after</p>
          <h2 className="mt-4 text-3xl sm:text-4xl">The call is the middle of it</h2>
        </div>
        <ol className="reveal mt-12 grid gap-px overflow-hidden rounded-xl2 border border-line bg-line md:grid-cols-3">
          {PROCESS.map((p, i) => (
            <li key={p.step} className="flex flex-col bg-ink-panel p-7">
              <p className="font-display text-sm font-bold uppercase tracking-[0.16em] text-flare">
                {String(i + 1).padStart(2, "0")} &middot; {p.step}
              </p>
              <h3 className="mt-4 text-xl leading-snug text-bone">{p.title}</h3>
              <p className="mt-3 text-[15px] leading-relaxed text-muted">{p.body}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* ── Sessions ─────────────────────────────────────────────────────────── */}
      <section className="wrap mt-24 sm:mt-32">
        <div className="reveal max-w-2xl">
          <p className="eyebrow">Sessions</p>
          <h2 className="mt-4 text-3xl sm:text-4xl">How long do you need?</h2>
          <p className="mt-4 text-lg leading-relaxed text-muted">
            A room on fire and a facility writing its SOPs are not the same conversation,
            and pricing them the same serves neither.
          </p>
        </div>
        <div className="reveal mt-12 grid gap-6 md:grid-cols-3">
          {SESSIONS.map((s, i) => (
            <SessionCard key={s.slug} session={s} href="#book" featured={i === 1} />
          ))}
        </div>
      </section>

      {/* ── The booking flow ─────────────────────────────────────────────────── */}
      <section id="book" className="wrap mt-24 scroll-mt-20 sm:mt-32">
        <div className="reveal max-w-2xl">
          <p className="eyebrow">Book</p>
          <h2 className="mt-4 text-3xl sm:text-4xl">Bring the room with you</h2>
          <p className="mt-4 text-lg leading-relaxed text-muted">
            Four steps. The middle two are the ones that matter &mdash; they are what we
            read before you speak.
          </p>
        </div>
        <div className="reveal mt-10">
          <Booking days={days} />
        </div>
      </section>

      {/* ── What to have ready ───────────────────────────────────────────────── */}
      <section className="wrap mt-24 sm:mt-32">
        <div className="reveal grid gap-10 rounded-xl2 border border-line bg-ink-panel p-7 sm:p-10 lg:grid-cols-[1fr_1fr] lg:gap-16">
          <div>
            <p className="eyebrow">Have it ready</p>
            <h2 className="mt-4 text-2xl sm:text-3xl">Five minutes now saves twenty on the call</h2>
            <p className="mt-4 text-[15px] leading-relaxed text-muted">
              None of this is required to book. All of it makes the hour worth more.
            </p>
          </div>
          <ul className="grid gap-4 text-[15px]">
            {[
              "Your last two runs' yields, and what you changed between them.",
              "Runoff EC and pH if you take them, in and out, for the last week.",
              "Room temperature, humidity and CO₂ over a 24-hour cycle — day and night numbers, not averages.",
              "A wide shot of the canopy plus close-ups of whatever is wrong.",
              "Your feed chart, even if it is the one off the bottle.",
            ].map((line) => (
              <li key={line} className="flex gap-3 border-b border-line pb-4 last:border-0 last:pb-0">
                <span aria-hidden className="mt-[9px] h-1.5 w-1.5 shrink-0 rounded-full bg-ember" />
                <span className="leading-relaxed text-bone/90">{line}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────────────────────── */}
      <section className="wrap mt-24 sm:mt-32">
        <div className="reveal max-w-2xl">
          <p className="eyebrow">Before you ask</p>
          <h2 className="mt-4 text-3xl sm:text-4xl">Questions we get asked</h2>
        </div>
        <div className="reveal mt-10 divide-y divide-line border-y border-line">
          {FAQ.map((f) => (
            // <details> rather than a JS accordion: it opens without hydration, it is
            // findable with the browser's own find-in-page in current engines, and it
            // needs no aria wiring to be announced correctly.
            <details key={f.q} className="group py-5">
              <summary className="flex cursor-pointer list-none items-start justify-between gap-6 text-[17px] font-semibold text-bone">
                {f.q}
                <span
                  aria-hidden
                  className="mt-1 shrink-0 text-flare transition-transform group-open:rotate-45"
                >
                  +
                </span>
              </summary>
              <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-muted">{f.a}</p>
            </details>
          ))}
        </div>
        <p className="reveal mt-8 text-sm text-muted">
          Times shown across the site are {AVAILABILITY.timeZoneLabel}. Something not
          covered?{" "}
          <Link href="/connect" className="text-flare hover:underline">
            Ask us directly
          </Link>
          .
        </p>
      </section>
    </>
  );
}
