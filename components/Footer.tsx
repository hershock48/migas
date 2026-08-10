import Link from "next/link";
import { NAV, SITE } from "@/lib/site";
import { Mark } from "./Mark";
import GlazedCredit from "./GlazedCredit";

export default function Footer() {
  return (
    <footer className="mt-24 border-t border-line bg-ink-panel">
      <div className="wrap grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div className="lg:col-span-2">
          <Mark className="text-xl" />
          <p className="mt-3 max-w-sm text-sm leading-relaxed text-muted">{SITE.blurb}</p>
        </div>

        <div>
          <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-bone">Explore</h2>
          <ul className="mt-4 space-y-2.5 text-sm">
            {NAV.map((i) => (
              <li key={i.href}>
                <Link href={i.href} className="text-muted hover:text-flare">
                  {i.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-bone">Elsewhere</h2>
          <ul className="mt-4 space-y-2.5 text-sm">
            <li>
              <a href={SITE.patreon} className="text-muted hover:text-flare">Patreon</a>
            </li>
            <li>
              <a href={SITE.instagram} className="text-muted hover:text-flare">Instagram</a>
            </li>
            <li>
              {/* Reads the constant, so when the real address lands it is one edit — and
                  while it is still a placeholder this renders as plain text rather than a
                  mailto: link that opens a mail client addressed to nobody. */}
              {SITE.email.startsWith("PLACEHOLDER") ? (
                <span className="text-muted">Email &mdash; to be supplied</span>
              ) : (
                <a href={`mailto:${SITE.email}`} className="text-muted hover:text-flare">
                  {SITE.email}
                </a>
              )}
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-line">
        <div className="wrap flex flex-col gap-2 py-6 text-xs text-muted sm:flex-row sm:items-center sm:justify-between">
          <p>&copy; {new Date().getFullYear()} {SITE.name}. All rights reserved.</p>
          {/* Plain register for this client, deliberately: he sells SOPs to licensed
              commercial operators, and a donut joke in his footer would be the studio
              talking about itself while a facility director is mid-decision. Warmer
              clients take a warmer line — the component's `line` prop is the knob. */}
          <GlazedCredit line="Built by" />
        </div>
      </div>
    </footer>
  );
}
