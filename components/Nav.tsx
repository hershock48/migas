"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { NAV, REVIEWS } from "@/lib/site";
import { Graffiti } from "./brand";

/**
 * THE MOBILE MENU USED TO CLOSE ON THE PATHNAME, AND THAT IS WHY "BOOK A CONSULT" LOOKED
 * DEAD. It was `useEffect(() => setOpen(false), [path])`, and usePathname() does not
 * include the hash. Every "Book a consult" in this component points at
 * /consulting#book, so tapping it from the consulting page navigates from /consulting to
 * /consulting — the pathname never changes, the effect never fires, and the panel stays
 * open across the whole screen. The page scrolls to the form behind it. Measured: after
 * the tap, aria-expanded was still "true", the panel still not hidden, and scrollY had
 * moved 3619px to somewhere the visitor cannot see. Nothing to click, no feedback, no way
 * to tell it worked.
 *
 * The same line caused a second, quieter fault in the other direction. Tapping it from
 * the HOME page does change the pathname, so the panel closed — but it closed AFTER the
 * anchor scroll, and this panel is a normal-flow sibling inside the header, so closing it
 * removed about 337px from the top of the document and everything slid up under a
 * scroll position already committed. The booking section ended up 257px ABOVE the top of
 * the viewport: its heading gone, dropped into the middle of the form with no sign of
 * having arrived anywhere.
 *
 * So two changes, and they fix the two halves independently rather than one covering for
 * the other. Closing on the CLICK works for a hash-only destination, where no pathname
 * change is coming. And taking the panel out of the flow means that even if the close
 * lands after the scroll, there is no height above the anchor to lose. The pathname
 * effect stays as the backstop it should always have been: browser back and forward
 * change the route without anything here being clicked.
 */
/* Reviews leaves the header while every review is still a placeholder. A top-level
   link to a page of "To supply" boxes is the one place a visitor was guaranteed to find
   nothing, and the header is where a doubtful visitor goes looking for proof. The page
   stays, linked from the footer, and the link comes back by itself the moment the first
   real quote lands in REVIEWS. */
const hasReviews = REVIEWS.some((r) => !r.quote.startsWith("PLACEHOLDER"));
const HEADER_NAV = NAV.filter((i) => i.href !== "/reviews" || hasReviews);

export default function Nav() {
  const [open, setOpen] = useState(false);
  const path = usePathname();
  useEffect(() => setOpen(false), [path]);

  return (
    // print:hidden site-wide: a printed page is a document, and site chrome on a
    // document is clutter. Added for the co-management one-pager and correct for
    // every page (a printed booking confirmation reads better without a nav bar).
    <header className="sticky top-0 z-50 border-b border-line bg-ink/90 backdrop-blur print:hidden">
      <div className="wrap flex h-[68px] items-center justify-between">
        {/* The graffiti mark rather than the mirrored lockup, and the reason is size. A
            reflected lockup at nav scale puts each row under 14px and the reflection turns to
            mush -- that is what the primary-mark / horizontal-lockup split exists for. This one
            is a single row at 3.15:1, so it holds -- but only above a floor, and the floor was
            measured on a size ladder rather than picked. Its letters are HOLES in the ink and
            its outlines are about 2px in an 867px-wide source, so they scale to nothing: at
            28px the crown and the bursts are indistinguishable noise and MIGAS is a smudge. It
            resolves at 32px and is clean at 40, which fits a 68px bar with room to spare. */}
        <Link href="/" className="flex items-center" aria-label="MI Gas home">
          <Graffiti className="h-10 w-auto" />
        </Link>

        <nav className="hidden items-center gap-7 md:flex" aria-label="Main">
          {HEADER_NAV.map((i) => {
            const active = path === i.href;
            return (
              <Link
                key={i.href}
                href={i.href}
                aria-current={active ? "page" : undefined}
                className={`text-sm transition-colors ${
                  active ? "text-flare" : "text-muted hover:text-bone"
                }`}
              >
                {i.label}
              </Link>
            );
          })}
          <Link href="/consulting#book" className="btn-primary !px-5 !py-2">
            Book a call
          </Link>
        </nav>

        {/* On a phone the booking button lived inside the menu, two taps away on the one
            action the site exists for. It sits beside the menu button now. Measured, mark
            126px and menu button 44px: at 320 the short label (66px) leaves 34px between
            the mark and the button, and the full one (105px) would overlap the mark by
            5px. From 360, the width most Android phones report, the full label leaves
            35px, so that is where it switches. */}
        <div className="flex items-center gap-2.5 md:hidden">
          <Link href="/consulting#book" onClick={() => setOpen(false)} className="btn-primary !px-4 !py-2.5">
            <span className="min-[360px]:hidden">Book</span>
            <span className="hidden min-[360px]:inline">Book a call</span>
          </Link>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="mobile-nav"
            className="grid h-11 w-11 place-items-center rounded-lg border border-edge"
          >
            <span className="sr-only">{open ? "Close menu" : "Open menu"}</span>
            <span aria-hidden className="relative block h-3.5 w-5">
              <span className={`absolute left-0 h-0.5 w-5 bg-bone transition-all ${open ? "top-1.5 rotate-45" : "top-0"}`} />
              <span className={`absolute left-0 top-1.5 h-0.5 w-5 bg-bone transition-opacity ${open ? "opacity-0" : ""}`} />
              <span className={`absolute left-0 h-0.5 w-5 bg-bone transition-all ${open ? "top-1.5 -rotate-45" : "top-3"}`} />
            </span>
          </button>
        </div>
      </div>

      {/* absolute, not in the flow. See the note above: in the flow, closing this panel
          subtracts its own height from the top of the page, and if that happens after an
          anchor scroll the destination slides out from under the visitor. Overlaying is
          also just what a mobile menu does — the panel is opaque ink-panel, so there is
          nothing to see through it. */}
      <div
        id="mobile-nav"
        hidden={!open}
        className="absolute left-0 right-0 top-full border-t border-line bg-ink-panel shadow-xl md:hidden"
      >
        <nav className="wrap flex flex-col gap-1 py-3" aria-label="Main, mobile">
          {HEADER_NAV.map((i) => (
            <Link
              key={i.href}
              href={i.href}
              onClick={() => setOpen(false)}
              aria-current={path === i.href ? "page" : undefined}
              className={`rounded-lg px-4 py-3 text-base ${
                path === i.href ? "bg-ink text-flare" : "text-bone hover:bg-ink"
              }`}
            >
              {i.label}
            </Link>
          ))}
          <Link href="/consulting#book" onClick={() => setOpen(false)} className="btn-primary mt-2">
            Book a call
          </Link>
        </nav>
      </div>
    </header>
  );
}
