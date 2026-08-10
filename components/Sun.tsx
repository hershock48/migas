import { DIAGRAM } from "@/lib/site";

/**
 * His logo is a black wordmark over a burning sun. This is that sun, burning.
 *
 * WHY IT IS DRAWN RATHER THAN PLACED. A photograph is one fixed frame at one fixed
 * resolution, it weighs a few hundred kilobytes on the largest element of the page, it cannot
 * be lit differently on two pages, and it cannot move. Built out of gradients it weighs
 * nothing, it is sharp on any display, it recolours from one line in tailwind.config.ts, and
 * it burns. It also sidesteps the question of who owns the solar photograph on his site.
 *
 * FIRE NEEDS THREE TIMESCALES AT ONCE. This is the whole lesson of the second pass. The first
 * version had only the slow one — three soft cells drifting over 17 to 31 seconds — and it
 * read as a lava lamp: clearly moving, not remotely burning. Combustion is legible because
 * fast, medium and slow motion happen together:
 *
 *   fast    0.9–2.2s   surface churn, flame tongues, luminance flicker
 *   medium  2.5–6s     embers detaching and dying
 *   slow    11–300s    convection cells, corona breath, coronal streaks
 *
 * Take away any one layer and it stops being fire. The fast layer is what was missing, and
 * the detaching embers are what makes it read as *burning* rather than as *glowing* — until
 * something leaves the surface, the eye reads a lit object rather than a combusting one.
 *
 * WHAT ACTUALLY COSTS FRAMES HERE IS BLEND MODES, NOT MOTION. This was measured, and it was
 * not what anyone would guess. Disabling every animated layer in turn changed nothing;
 * disabling `isolation: isolate` on the disc doubled the frame rate. Each mix-blend-mode layer
 * inside an isolated stacking context costs a backdrop read-back, and the budget on this
 * element turned out to be exactly two: three blend layers per disc ran at 30fps, two ran at
 * 60, with a clean step between and no sensitivity to element size, to which blend mode, or to
 * whether the layer was animating at all. So only the two churn tiles blend — contrast
 * modulation is the entire point of them — and the cells, spots and flicker composite normally
 * with their colours re-tuned to match what `screen` and `multiply` had been doing. The static
 * grain layer was deleted outright and its detail mixed into the churn tiles.
 *
 * HOW IT STAYS CHEAP OTHERWISE. Nothing that moves carries a filter, except the flame tongues,
 * which are tiny — a filter costs its area, and fourteen 30x80px tongues is a tenth of one
 * full-disc filter. The surface churn is two opaque
 * noise tiles translating in different directions at different scales and blended — the
 * interference between two moving textures produces continuously-changing structure for the
 * price of two composited translations, which is the same trick a fire shader uses. Each tile
 * translates by exactly one tile width, so the loop is seamless. Every flame, ember and cell
 * animates only `transform` and `opacity`. Animating an feTurbulence instead is what makes
 * plasma effects unusable on a phone.
 *
 * DESYNCHRONISATION, NOT AMPLITUDE. Fourteen flames on the same 1.6s cycle is a pulsing ring.
 * The durations and negative delays below are derived from the index with coprime-ish steps so
 * no two share a phase, and negative delays mean the ring is already mid-burn on the first
 * frame rather than igniting together half a second in.
 *
 * EVERY LOOP RESTS ON A COMPLETE FRAME. Reduced motion freezes animations on their last
 * keyframe: flames and embers end at zero opacity, the churn tiles end exactly where they
 * started, the flicker ends at neutral. What is left is a still sun, correctly lit — not a
 * lopsided one with a flame frozen half-formed. With no JavaScript nothing changes: there is
 * none.
 *
 * THE PALETTE IS MEASURED. Sampled off his own logo: the disc reads #CC5528, the corona
 * #F7C063, the sunspots #802715, the background literally #000000 — and, worth keeping
 * because it looks wrong written down, his sun is brightest just *inside* its own limb rather
 * than at the centre. Get that backwards and it reads as a beach ball.
 */

const FLAMES = 14;
const EMBERS = 16;

export default function Sun({ className = "" }: { className?: string }) {
  return (
    // Two elements, and the split is load-bearing. The outer one takes the caller's classes,
    // so `absolute`, `w-[44vw]` and the rest behave normally. The inner one owns
    // `position: relative`, which every layer below is positioned against. Merging them was
    // the first version and it silently broke: `.sun { position: relative }` is declared after
    // @tailwind utilities at the same specificity, so it won the cascade against an `absolute`
    // utility and the sun laid itself out in the flow, ignoring every offset it was handed.
    <div className={className} aria-hidden="true">
      <div className="sun">
        <span className="sun-corona" />
        <span className="sun-spokes" />

        {/* Everything that leaves the surface, drawn BEHIND the disc.

            THE ORDERING IS THE FIX FOR HOW THESE LOOKED. Painted in front, each flame showed
            its whole silhouette — a hard-edged wedge lying across the limb, which read as a
            dart stuck onto the edge rather than as anything burning. Behind the disc, only the
            length that projects past the limb is visible and the base is hidden by the disc
            itself, which is also how you actually see a flame at a star's edge. It costs
            nothing and no amount of softening the shape achieves the same thing. Embers gain
            from it too: they can no longer stray across the disc on their way out.

            One SVG, `overflow: visible`, and NO filters and
            NO ids — a page can hold more than one sun, and duplicate SVG ids are undefined
            behaviour. An earlier version softened the prominences with
            <filter id="sunPromSoft">; the home page renders a sun in the hero and another in
            the closing band, both shipped that id, and `url(#sunPromSoft)` resolved into the
            other instance's coordinate space. The result was a small dark square painted at
            the sun's top-left corner, which looked like a browser glitch rather than a bug
            with a cause. Softness here comes from stacked strokes and fills instead. */}
        <svg className="sun-fx" viewBox="0 0 200 200" focusable="false">
          {/* Flame tongues around the limb. Each is placed by a rotate ATTRIBUTE on the outer
              group and animated by CSS on the inner path — never both on one node, because a
              CSS transform replaces an SVG transform attribute wholesale and the shape would
              snap back to the top of the circle. */}
          {Array.from({ length: FLAMES }, (_, i) => {
            const f = flame(i);
            return (
              <g key={`f${i}`} className={i % 2 ? "fx-odd" : undefined} transform={`rotate(${f.angle} 100 100)`}>
                <path
                  className="flame"
                  d={FLAME_SHAPES[i % FLAME_SHAPES.length]}
                  style={{ animationDuration: `${f.dur}s`, animationDelay: `${f.delay}s` }}
                />
              </g>
            );
          })}

          {/* Embers. Radially outward rather than upward: the sun is cropped differently in
              each place it appears — off the top-right corner in the hero, showing only its
              bottom arc in the closing band — so "up" is behind the disc in one of them and
              off-screen in the other. Outward is right in every crop. */}
          {Array.from({ length: EMBERS }, (_, i) => {
            const e = ember(i);
            return (
              <g key={`e${i}`} className={i % 2 ? "fx-odd" : undefined} transform={`rotate(${e.angle} 100 100)`}>
                <circle
                  className="ember"
                  cx="100"
                  cy="-1"
                  r={e.r}
                  style={{
                    animationDuration: `${e.dur}s`,
                    animationDelay: `${e.delay}s`,
                    // How far out this one gets before it dies. Read by the keyframes.
                    ["--reach" as string]: `${e.reach}`,
                  }}
                />
              </g>
            );
          })}

          {/* The two big rare events: full prominences, roughly twice a minute. They are the
              slow layer of the limb, against the flames' fast one. */}
          <g className="prom prom-1">
            <path className="prom-glow" d={PROM_LEFT} fill="none" strokeWidth="7" strokeLinecap="round" />
            <path className="prom-core" d={PROM_LEFT} fill="none" strokeWidth="1.6" strokeLinecap="round" />
          </g>
          <g className="prom prom-2">
            <path className="prom-glow" d={PROM_FOOT} fill="none" strokeWidth="6" strokeLinecap="round" />
            <path className="prom-core" d={PROM_FOOT} fill="none" strokeWidth="1.4" strokeLinecap="round" />
          </g>
        </svg>

        <span className="sun-disc">
          <span className="sun-base" />
          {/* Slow structure. */}
          <span className="sun-cell sun-cell-1" />
          <span className="sun-cell sun-cell-2" />
          <span className="sun-cell sun-cell-3" />
          <span className="sun-spot sun-spot-1" />
          <span className="sun-spot sun-spot-2" />
          {/* Fast structure: two noise tiles at different scales sliding in different
              directions. This is the layer whose absence made the first version a lava lamp. */}
          <span className="sun-churn sun-churn-a" />
          <span className="sun-churn sun-churn-b" />
          {/* Combustion flicker across the whole disc, on an irregular schedule. */}
          <span className="sun-flicker" />
          <span className="sun-limb" />
        </span>

      </div>
    </div>
  );
}

/* ── Placement and timing ─────────────────────────────────────────────────────────────
   Derived from the index rather than random, so the server and the client agree — a
   Math.random() here would hydrate to different values than it rendered with, and React
   would either warn or quietly keep the server's. The moduli are chosen not to share
   factors with the element counts, which is what stops the pattern lining back up into
   something the eye can catch.
   ─────────────────────────────────────────────────────────────────────────────────── */

/** Deliberately uneven spacing. Perfectly even flames read as a gear, not a fire. */
const FLAME_JITTER = [0, 3.1, -2.4, 1.7, -3.8, 2.2, -1.1, 3.6, -2.9, 0.8, -3.3, 2.7, -1.8, 3.9];

function flame(i: number) {
  return {
    angle: (360 / FLAMES) * i + FLAME_JITTER[i % FLAME_JITTER.length],
    dur: 1.15 + ((i * 7) % 11) * 0.1, // 1.15–2.15s
    delay: -(((i * 13) % 19) * 0.13), // negative: already mid-burn on frame one
  };
}

function ember(i: number) {
  return {
    angle: (360 / EMBERS) * i + ((i * 11) % 17) - 8,
    r: 0.9 + ((i * 5) % 4) * 0.35, // 0.9–1.95
    dur: 2.6 + ((i * 17) % 13) * 0.28, // 2.6–6.0s
    delay: -(((i * 23) % 29) * 0.21),
    reach: 22 + ((i * 3) % 9) * 3.4, // 22–49 user units past the limb
  };
}

/**
 * Three tongue silhouettes, cycled, all drawn at the top of the circle — centre (100,100),
 * radius 100, so the limb is y = 0 and outward is negative y. Varying the SHAPE rather than
 * scaling one shape was the deliberate choice: a scaled copy of one flame reads as fourteen
 * copies of one flame, and the third silhouette leans, which is what makes the ring lick
 * rather than pulse.
 */
const FLAME_SHAPES = [
  // WIDE relative to their height, and that ratio is the point. Fourteen tongues sit 25.7°
  // apart, which is 45 user units of arc at this radius; bases around 30 units wide leave
  // them nearly touching, so once blurred they merge into a continuous fringe. Narrow and
  // tall reads as a spike no matter how the curve is drawn — the first three attempts were
  // all silhouette fixes to what was really a proportion problem.
  // short
  "M86 3 C92 -1 94.5 -4 100 -10 C105.5 -4 108 -1 114 3 Z",
  // medium
  "M84 3 C91 -2.4 93.5 -6.5 100 -16.5 C106.5 -6.5 109 -2.4 116 3 Z",
  // tall, leaning
  "M85 3 C91.5 -4.5 92.6 -11.5 103.4 -28 C106.4 -11.5 110 -4.5 117 3 Z",
];

/**
 * The two prominence arcs, written once each so the glow stroke and the core stroke cannot
 * drift apart.
 *
 * WHERE THEY SIT IS ARITHMETIC, NOT TASTE. The first pair sat at the top-right and lower-left
 * of the disc, which looked right in the abstract and was invisible in practice, because this
 * sun is cropped differently everywhere it appears. Measuring where each one actually landed
 * on screen — one at y = -73, above the viewport — is what found it; nothing about the code
 * looked wrong. One is on the left limb, which the hero shows; one is on the foot of the disc,
 * which the closing band shows.
 *
 * Each control point is solved backwards from the apex, because a quadratic passes through
 * (P0 + 2C + P2) / 4 at its midpoint rather than through C. Put the apex at C and the arc
 * reaches half as far out as intended.
 */
// Feet at 164° and 184°, apex at radius 113 — thirteen percent past the limb, not thirty-six.
// The first pair reached to 136 and rendered as a pale hook clamped to the side of the disc,
// like a handle on a teacup. A real prominence hugs the limb.
const PROM_LEFT = "M3.87 127.6 Q -26.9 113.3 0.24 93";
// Feet at 118° and 134°, apex at radius 112 — lower LEFT, not bottom centre. Centred, it hung
// symmetrically under the disc in the closing band and read as a smile drawn under the
// heading rather than as anything solar.
const PROM_FOOT = "M53.05 188.3 Q 26.55 201.1 30.53 171.9";
