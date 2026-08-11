"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

/**
 * Reveal-on-scroll, built so that failing does nothing rather than something.
 *
 * The CSS default is the finished page. This adds `.r-armed` to <html> on mount,
 * which is what hides the elements in the first place, then reveals them as they
 * enter view. So a blocked script, a crashed hydration or reduced motion all leave a
 * complete page instead of an empty one — the opposite of the usual opacity:0
 * approach, and a one-line difference in where the hiding lives.
 *
 * IT HAS TO RE-ARM ON EVERY NAVIGATION, and not doing so was the bug behind "see the
 * programs doesn't work", "book room triage doesn't work", and his own conclusion that
 * probably none of the buttons worked. He was right, and it was worse than buttons.
 *
 * This component lives in the root layout, so it mounts ONCE for the life of the tab.
 * With an empty dependency array the effect also ran once: it queried `.reveal`, showed
 * what was above the fold, and observed the rest. A client-side navigation then replaced
 * the page with a completely new set of `.reveal` elements — which nothing had shown and
 * nothing was observing — while `.r-armed` was still sitting on <html> hiding them. So
 * every internal link in the site landed on a page whose entire body was at opacity 0.
 * The header stayed (it is not a .reveal) and the active nav item even moved, so the
 * navigation plainly happened; there was just nothing to see. Measured on /guides: 6
 * reveal blocks, 6 invisible, 0 marked is-in after a click, against 3 of 6 on a hard
 * reload of the same URL. Scrolling could not rescue it either, because the new elements
 * were never handed to an observer.
 *
 * Keying the effect to the pathname fixes it at the root: each new route re-queries,
 * re-shows and re-observes. Note the dependency is deliberately the PATHNAME and not the
 * full URL — a hash-only move like /consulting -> /consulting#book does not replace any
 * DOM, so there is nothing to re-arm and re-running would only re-hide a page the visitor
 * is already looking at.
 *
 * WHY THIS SURVIVED SO MANY PASSES. Every check I ran asked whether the URL changed or
 * whether the element scrolled into position, and both of those were always true. Nothing
 * asked whether the destination could be SEEN. A navigation test that does not assert
 * visibility is not a navigation test.
 */
export default function Reveal() {
  const path = usePathname();

  useEffect(() => {
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    const root = document.documentElement;
    root.classList.add("r-armed");
    const items = Array.from(document.querySelectorAll<HTMLElement>(".reveal"));
    // Anything already in view on load is shown immediately, so the first screen is
    // never animating while the visitor is reading it.
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.classList.add("is-in");
            io.unobserve(e.target);
          }
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.05 }
    );
    for (const el of items) {
      if (el.getBoundingClientRect().top < window.innerHeight) el.classList.add("is-in");
      else io.observe(el);
    }
    return () => {
      io.disconnect();
      root.classList.remove("r-armed");
    };
  }, [path]);

  return null;
}
