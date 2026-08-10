"use client";

import { useEffect } from "react";

/**
 * Reveal-on-scroll, built so that failing does nothing rather than something.
 *
 * The CSS default is the finished page. This adds `.r-armed` to <html> on mount,
 * which is what hides the elements in the first place, then reveals them as they
 * enter view. So a blocked script, a crashed hydration or reduced motion all leave a
 * complete page instead of an empty one — the opposite of the usual opacity:0
 * approach, and a one-line difference in where the hiding lives.
 */
export default function Reveal() {
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
  }, []);
  return null;
}
