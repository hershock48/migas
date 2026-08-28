import type { Metadata } from "next";
import Link from "next/link";
import FeedRig from "@/components/FeedRig";
import { COMANAGEMENT, money } from "@/lib/site";

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
          {/* The fertigation diagram, moved here from the retired guides page. Irrigation
              steering is the first service on this page, so the drawing finally sits next
              to the thing it illustrates. */}
          <FeedRig className="reveal mx-auto w-full max-w-[290px] lg:max-w-[360px]" />
        </div>
      </section>

      {/* ── What we run ──────────────────────────────────────────────────────── */}
      <section className="wrap mt-24 sm:mt-32">
        <div className="reveal max-w-2xl">
          <p className="eyebrow">What we run</p>
          <h2 className="mt-4 text-3xl sm:text-4xl">Four things, watched daily</h2>
        </div>
        <div className="reveal mt-12 grid gap-6 sm:grid-cols-2">
          {COMANAGEMENT.services.map((s) => (
            <div key={s.name} className="card flex flex-col p-7">
              <h3 className="text-xl leading-snug text-bone">{s.name}</h3>
              <p className="mt-4 flex-1 text-[15px] leading-relaxed text-muted">{s.body}</p>
            </div>
          ))}
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
            <Link href="/consulting#book" className="btn-primary">
              Price your room
            </Link>
          </div>
        </div>
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
