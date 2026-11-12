import type { CSSProperties } from "react";
import "./SteerLoop.css";

/**
 * The co-management loop: the room reports through its sensors, we set the day's
 * numbers remotely, the head grower runs them on the floor, and the room reports
 * again. A circuit is the honest shape for it: no step is optional and none is
 * first. Both conditions (the sensors, the head grower) are stations in the drawing,
 * because they are conditions rather than preferences.
 *
 * REDRAWN 2026-11-11 (Kevin: "this part, it's a graphic, needs to be better"). It was
 * four boxes on a dashed rectangle with the labels set as SVG text at 8.5 units, which
 * read as a wireframe. Now:
 *
 * - The stations sit on a circular track with 24 ticks inside it, one per hour, so
 *   the ring reads as a day ("Watched daily" in the middle).
 * - A point of light runs the circuit once every 8 seconds, from station 1, and each
 *   station lights as it arrives (2s apart, the CSS keyframes key off --i). The
 *   motion is the meaning: data goes round, every day, through all four.
 * - The labels are HTML in an ordered list, not SVG text: they wrap, they stay crisp
 *   at any size, and a screen reader hears four steps in order instead of a picture.
 * - Reduced motion and print get the still drawing (the light is hidden), and
 *   tone="paper" is the one-pager's version: dark on the light sheet, no glow,
 *   nothing that depends on a background printing.
 *
 * The SVG carries no ids or <defs>: FeedRig renders on the same page and owns its
 * own ids, and a second SVG with ids is how the duplicate-id square gets painted
 * (glaze.md failure log). The glow is CSS on HTML elements.
 */
const NODES = [
  { name: "The room", sub: "Canopy, media, climate" },
  { name: "Your sensors", sub: "Aroya, Pinnacle, Growlink" },
  { name: "We steer", sub: "Shots, timings, targets" },
  { name: "Your head grower", sub: "Runs the day on the floor" },
] as const;

/** 24 hour ticks inside the ring; every sixth is longer (midnight, 6, noon, 18). */
const TICKS = Array.from({ length: 24 }, (_, i) => {
  const a = (i / 24) * 2 * Math.PI;
  const long = i % 6 === 0;
  const r1 = long ? 25.2 : 26.4;
  const r2 = 27.8;
  const f = (n: number) => Math.round(n * 1000) / 1000;
  return { x1: f(50 + r1 * Math.sin(a)), y1: f(50 - r1 * Math.cos(a)), x2: f(50 + r2 * Math.sin(a)), y2: f(50 - r2 * Math.cos(a)), long };
});

export default function SteerLoop({
  className = "",
  tone = "dark",
}: {
  className?: string;
  /** "paper": the printed one-pager. Dark on the light sheet, no light running. */
  tone?: "dark" | "paper";
}) {
  const paper = tone === "paper";
  return (
    <figure className={`loop ${paper ? "loop-paper" : ""} ${className}`}>
      <div className="loop-stage">
        <svg viewBox="0 0 100 100" aria-hidden="true" className="loop-svg">
          <circle cx="50" cy="50" r="30" className="loop-track" />
          {TICKS.map((t, i) => (
            <line key={i} x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2} className={t.long ? "loop-tick loop-tick-long" : "loop-tick"} />
          ))}
        </svg>

        {/* The light: a trail and a head on one rotating ring. Decorative. */}
        {!paper && (
          <span aria-hidden="true" className="loop-orbit">
            <span className="loop-trail" />
            <span className="loop-head" />
          </span>
        )}

        <ol className="loop-steps">
          {NODES.map((n, i) => (
            <li key={n.name} className={`loop-step loop-step-${i + 1}`} style={{ "--i": i } as CSSProperties}>
              <span aria-hidden="true" className="loop-node">
                {i + 1}
              </span>
              <span className="loop-label">
                <span className="loop-name">{n.name}</span>
                <span className="loop-sub">{n.sub}</span>
              </span>
            </li>
          ))}
        </ol>

        <p className="loop-center">
          <span className="loop-eyebrow">The loop</span>
          <span className="loop-value">Watched daily</span>
        </p>
      </div>
      <figcaption className={`mt-4 max-w-[38ch] text-sm leading-relaxed ${paper ? "text-ink/70" : "text-muted"}`}>
        Your sensors report, we set the day&rsquo;s numbers, and your head grower runs
        them. Then we see how the room responded and adjust.
      </figcaption>
    </figure>
  );
}
