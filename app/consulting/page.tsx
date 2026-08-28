import type { Metadata } from "next";
import Link from "next/link";
import Booking from "@/components/Booking";
import { SessionCard } from "@/components/cards";
import { AVAILABILITY, FAQ, PROCESS, RATE, SESSIONS, money } from "@/lib/site";
import { openSlots } from "@/lib/availability";

export const metadata: Metadata = {
  title: "Consulting",
  description:
    "Book a cultivation consult at $250 an hour: room triage, a full program review, or a facility call. Every call starts with an eight-question room intake and your photos, read before you dial in.",
};

/**
 * PER REQUEST, AND IT HAS TO BE. This said "slots are generated per request, not at
 * build, or the calendar would be frozen on the day of the deploy" — the right intent
 * against the wrong directive. `revalidate = 3600` does not render per request. It
 * prerenders at BUILD time and then regenerates at most hourly, and regeneration is
 * triggered BY a request: the visitor who arrives after a quiet spell is served the old
 * HTML and only kicks off the rebuild for whoever comes next. On a site with steady
 * traffic that is an hour of staleness. On a brand-new consultancy site with none, the
 * cached page ages until something asks for it, and Next's default `expire` is a year.
 *
 * That matters here because the slot values are baked into the HTML as radio inputs and
 * the server action re-validates them against the real clock. Stale HTML therefore
 * offers times the server will refuse. Measured against the real slotGrid, taking a page
 * built on a Monday and re-validating every slot in it:
 *
 *     +1 day    6 of 72 slots rejected
 *     +7 days  36 of 72
 *   +14 days  72 of 72 — every time the page offers is refused, the form is dead
 *
 * and the visitor's only feedback is "That time is no longer open. Pick another." on
 * every single alternative, with a reload serving the same stale page. Nothing logs it.
 *
 * So: dynamic. The page reads a config object and formats dates — there is no database
 * call to protect and nothing to gain from caching the result. Correctness over a cached
 * HTML document for a form that takes money.
 */
export const dynamic = "force-dynamic";

export default async function Consulting() {
  // Stored windows minus blocked dates minus his calendar. See lib/availability.ts;
  // the page stays force-dynamic for the same reason it always was, plus one more:
  // the busy feed can change between any two requests.
  const days = await openSlots();

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
            have asked. This one asks them first: stage, canopy, media, feed, lights,
            runoff. It takes your photos with them too, so the time you pay for is spent
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
          <h2 className="mt-4 text-3xl sm:text-4xl">What happens around the call</h2>
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
          <h2 className="mt-4 text-3xl sm:text-4xl">One rate, three lengths</h2>
          <p className="mt-4 text-lg leading-relaxed text-muted">
            {money(RATE)} an hour, and you pick how much of one you need. A room in
            trouble usually fits in thirty minutes; a facility rarely does.
          </p>
        </div>
        <div className="reveal mt-12 grid gap-6 md:grid-cols-3">
          {SESSIONS.map((s, i) => (
            <SessionCard key={s.slug} session={s} href="#book" featured={i === 1} />
          ))}
        </div>
        {/* The rate is his, from the 2026-08-27 call, which retired the "proposed, not
            yours yet" panel that used to sit here. What remains open is smaller and
            still his: the 30 and 90 minute prices are pro-rata arithmetic on his $250
            an hour, not numbers he spoke. Same dashed convention, addressed to him. */}
        <div className="reveal mt-8 rounded-xl2 border border-dashed border-edge/70 bg-ink-panel/40 p-5">
          <p className="eyebrow">One derivation to confirm</p>
          <p className="mt-2 text-[15px] leading-relaxed text-muted">
            {money(RATE)} an hour is your number. The {money(RATE / 2)} half hour and the{" "}
            {money((RATE * 3) / 2)} ninety minutes are that number divided and multiplied,
            not prices you said. If calls should start at a full hour, say so and the
            half hour comes off. The bullets on the cards, written actions after the
            call and the follow-up threads, are still our draft of what a session
            includes: confirm them or trim them, because each one is a promise made in
            your name.
          </p>
        </div>
      </section>

      {/* ── The booking flow ─────────────────────────────────────────────────── */}
      <section id="book" className="wrap mt-24 scroll-mt-20 sm:mt-32">
        <div className="reveal max-w-2xl">
          <p className="eyebrow">Book</p>
          <h2 className="mt-4 text-3xl sm:text-4xl">Bring the room with you</h2>
          <p className="mt-4 text-lg leading-relaxed text-muted">
            Four steps. The middle two are the ones that matter. They are what we
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
              All of it except the runoff numbers is needed before we can book you in.
              It takes about two minutes, and it is why the call opens on your room.
            </p>
          </div>
          <ul className="grid gap-4 text-[15px]">
            {[
              "Your last two runs' yields, and what you changed between them.",
              "Runoff EC and pH if you take them, in and out, for the last week.",
              "Room temperature, humidity and CO₂ over a 24-hour cycle. Day and night numbers, not averages.",
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
          {FAQ.map((f) => {
            /**
             * FOUR OF THESE ANSWERS ARE DRAFTS AWAITING HIS DECISION, and until now they
             * printed the literal word PLACEHOLDER straight into the page, in the same
             * grey as the finished answers. Two of them are also written in third person
             * about him — "he needs to write this one himself" — because they were only
             * ever addressed to us. That is backstage text on the front stage, and it was
             * on the one page this build exists to show off.
             *
             * The convention for pending content is already set everywhere else in this
             * codebase — components/cards.tsx does it for the reviews: a dashed panel and
             * an eyebrow saying what is owed. The FAQ was the one surface that had the
             * PLACEHOLDER check missing rather than a different opinion about it.
             *
             * The token is stripped and the draft is kept, because lib/site.ts is right
             * that an empty FAQ is worse than a draft one. Delete the marker in
             * lib/site.ts when he answers and the panel becomes an ordinary answer with
             * no code change.
             */
            const pending = f.a.startsWith("PLACEHOLDER");
            // The drafts were written to follow the marker, so they all begin lowercase
            // once it comes off. Capitalised here rather than in lib/site.ts so the data
            // stays exactly as authored and deleting the marker is still the only edit.
            const stripped = f.a.replace(/^PLACEHOLDER:?\s*/, "");
            const answer = pending ? stripped.charAt(0).toUpperCase() + stripped.slice(1) : f.a;
            return (
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
                {pending ? (
                  <div className="mt-3 max-w-2xl rounded-xl2 border border-dashed border-edge/70 bg-ink-panel/40 p-5">
                    <p className="eyebrow">Draft, awaiting his answer</p>
                    <p className="mt-2 text-[15px] leading-relaxed text-muted">{answer}</p>
                  </div>
                ) : (
                  <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-muted">
                    {answer}
                  </p>
                )}
              </details>
            );
          })}
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
