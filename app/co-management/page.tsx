import type { Metadata } from "next";
import Link from "next/link";
import FeedRig from "@/components/FeedRig";
import MiniForm, { type MiniField } from "@/components/MiniForm";
import SteerLoop from "@/components/SteerLoop";
import { requestCoManagement } from "@/app/actions";
import { COMANAGE_APPLY, COMANAGEMENT, money } from "@/lib/site";

export const metadata: Metadata = {
  title: "Co-Management",
  description:
    "Facility co-management: irrigation and environment steered remotely off your sensor data, scheduling planned with your labor, priced per light. Your head grower runs the floor.",
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
              Your room, run on <span className="text-flare">our program</span>
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-bone/85">
              We steer the irrigation and the environment remotely, off your own sensor
              data, run by run. Your head grower runs the floor. The room gets the
              program a licensed facility runs without hiring its director.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link href="/consulting#book" className="btn-primary">
                Schedule a call today
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
          <h2 className="mt-4 text-3xl sm:text-4xl">Four things we take over</h2>
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

      {/* ── Price ────────────────────────────────────────────────────────────── */}
      <section className="wrap mt-24 sm:mt-32">
        <div className="reveal flex flex-col gap-6 rounded-xl2 border border-ember/60 bg-ink-panel p-7 sm:p-9 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            <p className="eyebrow">Priced per light</p>
            {/* No billing cadence on this heading, deliberately. His words were "$50-150
                per light depending on size with a project minimum" and he named no
                period; "per month" stood here for a day as an assumption dressed as a
                price. The dashed panel below asks him for it. */}
            <h2 className="mt-3 text-2xl text-bone sm:text-3xl">
              {money(COMANAGEMENT.perLight.from)} to {money(COMANAGEMENT.perLight.to)} per
              light
            </h2>
            <p className="mt-3 text-[15px] leading-relaxed text-muted">
              Where yours lands depends on the size of the project: a bigger room spreads
              the same watching across more lights. A project minimum applies, and both
              numbers get settled on the first call, against your light count and your
              sensor setup.
            </p>
          </div>
          <div className="shrink-0 lg:text-right">
            {/* Straight to the application rather than the consult booking: it collects
                the exact two facts a price needs, light count and sensors. */}
            <Link href="#apply" className="btn-primary">
              Price your room
            </Link>
          </div>
        </div>
        {/* The range, made concrete. Every figure is derived from perLight in
            lib/site.ts, so the ladder can never disagree with the range above it —
            and no billing period appears anywhere in it, same rule as the heading. */}
        <dl className="reveal mt-6 grid gap-px overflow-hidden rounded-xl2 border border-line bg-line sm:grid-cols-3">
          {[10, 40, 100].map((n) => (
            <div key={n} className="bg-ink-panel px-6 py-5">
              <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
                A {n}-light room
              </dt>
              <dd className="mt-2 font-display text-xl font-bold text-bone">
                {money(COMANAGEMENT.perLight.from * n)} to {money(COMANAGEMENT.perLight.to * n)}
              </dd>
            </div>
          ))}
        </dl>
        <p className="reveal mt-3 text-sm text-muted">
          Bigger rooms land nearer the bottom of the per-light range. The smallest rooms
          are where the project minimum does the talking.
        </p>
        {/* Addressed to him, not to a visitor, same convention as every dashed panel on
            the site: he named a minimum on the call and did not put a figure on it. */}
        <div className="reveal mt-6 rounded-xl2 border border-dashed border-edge/70 bg-ink-panel/40 p-5">
          <p className="eyebrow">Two numbers to supply</p>
          <p className="mt-2 text-[15px] leading-relaxed text-muted">
            You said a project minimum exists; the page says so without a figure until you
            set one. And you named no billing period for the per-light rate, so the page
            does not guess one. Monthly, per run, or something else, say the word and it
            goes in.
          </p>
        </div>
      </section>

      {/* ── Conditions ───────────────────────────────────────────────────────── */}
      <section id="conditions" className="wrap mt-24 scroll-mt-24 sm:mt-32">
        <div className="reveal max-w-2xl">
          <p className="eyebrow">The conditions</p>
          <h2 className="mt-4 text-3xl sm:text-4xl">What your room has to bring</h2>
          <p className="mt-4 text-lg leading-relaxed text-muted">
            Two, and both are firm. Remote steering without them is guessing with extra
            steps, and we will not sell you that.
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
              Light count and sensors are what price a room; the rest is what the
              first call is built from. We read it against the program and come back
              with a call and a per-light number, or an honest no.
            </p>
            <p className="mt-4 text-sm leading-relaxed text-muted">
              Rather talk before you type?{" "}
              <Link href="/consulting#call" className="text-flare hover:underline">
                Leave a number and we call you
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
            note="Goes straight to us, nowhere else. Answers that miss a condition still send; we would rather tell you what the room needs than bounce you at a form."
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

      {/* ── Close ────────────────────────────────────────────────────────────── */}
      <section className="wrap mt-24 sm:mt-32">
        <div className="reveal max-w-2xl">
          <p className="eyebrow">Start with a call</p>
          <h2 className="mt-4 text-3xl sm:text-4xl">The first call prices the room</h2>
          <p className="mt-4 text-lg leading-relaxed text-muted">
            Light count, sensors, media and where the room is losing money. Bring those
            and the call ends with a per-light number and a start date, or with an honest
            reason it is not a fit yet.
          </p>
          <div className="mt-9 flex flex-wrap gap-3">
            <Link href="/consulting#book" className="btn-primary">
              Schedule a call today
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
