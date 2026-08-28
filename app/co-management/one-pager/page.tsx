import type { Metadata } from "next";
import Link from "next/link";
import PrintButton from "@/components/PrintButton";
import SteerLoop from "@/components/SteerLoop";
import { Graffiti } from "@/components/brand";
import { COMANAGEMENT, CREDS, SITE, money } from "@/lib/site";

export const metadata: Metadata = {
  title: "Co-Management, on one page",
  description:
    "The co-management model as a single printable page: the loop, the services, the conditions, and the per-light structure. Made to be handed to a partner.",
};

/**
 * The one-pager: the co-management model as a document, because a facility owner
 * does not decide alone. The person who reads the website is rarely the only
 * person who signs, and what travels between them is paper — printed, or a PDF in
 * a group chat. This page is that paper, and it reads from the same constants as
 * the site, so it can never say something the page above it does not.
 *
 * PRINT IS THE PRIMARY MEDIUM HERE, and three decisions follow from it:
 *
 * 1. Ink on bone, not bone on ink. Browsers strip backgrounds at print time by
 *    default, so a dark design prints as invisible cream text on white. Everything
 *    on this sheet is dark text and dark strokes on the light ground, and the
 *    SteerLoop renders in its paper tone (outlined boxes, dark labels) for the
 *    same reason.
 *
 * 2. On screen, the sheet floats on the site's own ink like a document preview,
 *    which is honest about what it is. The site chrome hides at print time via
 *    print:hidden on Nav and Footer.
 *
 * 3. No dates anywhere. `new Date()` freezes at build on a static page (see the
 *    failure log), and a stale date on a circulating document reads as a stale
 *    offer. The reference is the URL printed in the footer.
 *
 * Two numbers this document deliberately does not carry: the project minimum and
 * the billing cadence, both his to give. It says a minimum exists and stops, same
 * as the page.
 */
export default function OnePager() {
  return (
    <section className="wrap py-10 sm:py-14 print:p-0">
      {/* Screen-only controls, above the sheet. */}
      <div className="mb-6 flex flex-wrap items-center gap-4 print:hidden">
        <PrintButton />
        <p className="text-sm text-muted">
          Prints on one or two pages. Ctrl+P works too.{" "}
          <Link href="/co-management" className="text-flare hover:underline">
            Back to the full page
          </Link>
          .
        </p>
      </div>

      <div className="op-sheet mx-auto max-w-[820px] rounded-xl2 bg-bone p-8 text-ink sm:p-12 print:max-w-none print:rounded-none print:p-0">
        {/* ── Head ─────────────────────────────────────────────────────────── */}
        <header className="flex flex-wrap items-end justify-between gap-4 border-b-2 border-ink pb-6">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-ember-deep">
              Co-management
            </p>
            <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
              Your room, run on our program
            </h1>
          </div>
          <Graffiti className="h-10 w-auto text-ink" />
        </header>

        <p className="mt-6 max-w-[60ch] text-[15px] leading-relaxed text-ink/85">
          We steer the irrigation and the environment remotely, off your own sensor
          data, run by run. Your head grower runs the floor. The room gets the program
          a licensed facility runs without hiring its director.
        </p>

        {/* ── The loop + what we run ───────────────────────────────────────── */}
        <div className="mt-8 grid gap-8 sm:grid-cols-[minmax(0,1fr)_240px] sm:items-start">
          <div>
            <h2 className="text-xs font-bold uppercase tracking-[0.18em] text-ember-deep">
              What we run
            </h2>
            <ul className="mt-3 space-y-4">
              {COMANAGEMENT.services.map((s) => (
                <li key={s.name}>
                  <p className="text-[15px] font-bold text-ink">{s.name}</p>
                  <p className="mt-1 text-sm leading-relaxed text-ink/75">{s.body}</p>
                </li>
              ))}
            </ul>
          </div>
          <SteerLoop tone="paper" className="mx-auto w-full max-w-[240px]" />
        </div>

        {/* ── Conditions ───────────────────────────────────────────────────── */}
        <div className="mt-8 border-y border-ink/20 py-6">
          <h2 className="text-xs font-bold uppercase tracking-[0.18em] text-ember-deep">
            What your room has to bring
          </h2>
          <div className="mt-3 grid gap-5 sm:grid-cols-2">
            {COMANAGEMENT.requirements.map((r) => (
              <div key={r.name}>
                <p className="text-[15px] font-bold text-ink">{r.name}</p>
                <p className="mt-1 text-sm leading-relaxed text-ink/75">{r.body}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Price ────────────────────────────────────────────────────────── */}
        <div className="mt-8">
          <h2 className="text-xs font-bold uppercase tracking-[0.18em] text-ember-deep">
            Priced per light
          </h2>
          <p className="mt-2 text-2xl font-extrabold tracking-tight text-ink">
            {money(COMANAGEMENT.perLight.from)} to {money(COMANAGEMENT.perLight.to)} per light
          </p>
          <div className="mt-3 grid grid-cols-3 gap-px overflow-hidden rounded-lg border border-ink/20 bg-ink/20">
            {[10, 40, 100].map((n) => (
              <div key={n} className="bg-bone px-4 py-3">
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink/60">
                  A {n}-light room
                </p>
                <p className="mt-1 text-[15px] font-bold text-ink">
                  {money(COMANAGEMENT.perLight.from * n)} to {money(COMANAGEMENT.perLight.to * n)}
                </p>
              </div>
            ))}
          </div>
          <p className="mt-2 text-sm leading-relaxed text-ink/75">
            Bigger rooms land nearer the bottom of the range. A project minimum applies;
            it and the billing cadence get settled on the first call, against your light
            count and your sensor setup.
          </p>
        </div>

        {/* ── Around the program ───────────────────────────────────────────── */}
        <div className="mt-8">
          <h2 className="text-xs font-bold uppercase tracking-[0.18em] text-ember-deep">
            What comes with it
          </h2>
          <ul className="mt-3 grid gap-x-8 gap-y-3 sm:grid-cols-2">
            {COMANAGEMENT.extras.map((e) => (
              <li key={e.name} className="text-sm leading-relaxed text-ink/75">
                <span className="font-bold text-ink">{e.name}.</span> {e.body}
              </li>
            ))}
          </ul>
        </div>

        {/* ── The record ───────────────────────────────────────────────────── */}
        <div className="mt-8 rounded-lg border border-ink/20 p-5">
          <h2 className="text-xs font-bold uppercase tracking-[0.18em] text-ember-deep">
            The record
          </h2>
          <div className="mt-3 grid gap-5 sm:grid-cols-3">
            {CREDS.map((c) => (
              <div key={c.label}>
                <p className="text-xl font-extrabold tracking-tight text-ink">{c.stat}</p>
                <p className="mt-1 text-[13px] leading-relaxed text-ink/70">{c.label}</p>
              </div>
            ))}
          </div>
          <p className="mt-3 text-[11px] text-ink/60">
            All three from our own published posts.
          </p>
        </div>

        {/* ── Foot ─────────────────────────────────────────────────────────── */}
        <footer className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t-2 border-ink pt-5 text-sm">
          {/* SITE.url plus the /demo prefix, NOT SITE.liveSite: a printed URL outlives
              the print, and mi-gas.net has no such page until cutover day. This loses
              its /demo in the same commit that retires the host split — search for
              "ON THE DAY THEY SIGN" in app/layout.tsx, which carries the same seam. */}
          <p className="font-bold text-ink">
            Apply, or book a call:{" "}
            <span className="font-normal text-ink/75">
              {SITE.url.replace("https://", "")}/demo/co-management
            </span>
          </p>
          <p className="text-ink/60">Patreon: patreon.com/Mi_gas_</p>
        </footer>
      </div>
    </section>
  );
}
