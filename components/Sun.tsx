/**
 * His logo is a black wordmark over a burning sun. This is that sun, alive.
 *
 * WHY IT IS DRAWN RATHER THAN PLACED. A photograph of the sun is one fixed frame at one
 * fixed resolution, it weighs a few hundred kilobytes on the largest element of the page,
 * and it cannot be lit from a different angle on the guides page than on the home page.
 * Built out of gradients it weighs nothing, it is sharp at any size on any display, it
 * recolours from one line in tailwind.config.ts, and it moves. It also sidesteps the
 * question of who owns the solar photograph currently on his site.
 *
 * WHY THERE IS NO BLUR FILTER ON ANYTHING THAT MOVES. A radial gradient with a soft stop is
 * already a blur — it is computed once by the compositor and costs nothing to translate. The
 * churning convection cells below are large soft gradients drifting on long loops, blended
 * screen and multiply against the disc, which is a pure composite operation. Doing the same
 * thing with `filter: blur()` on moving divs forces a re-rasterise every frame and drops
 * frames on a phone. Only the prominences carry a filter, they are two paths, and they are
 * invisible most of the time.
 *
 * THE PALETTE IS MEASURED, NOT INVENTED. Every colour was sampled off his own logo: the disc
 * reads #CC5528, the corona #F7C063, the sunspots #802715, the bright granules a near-white
 * yellow, and — a detail worth keeping — his sun is *brightest just inside its own limb*
 * rather than at the centre, which is why the base gradient darkens through the middle and
 * comes back up at 88%. Get that backwards and it reads as a beach ball.
 *
 * EVERY LOOP RESTS ON A COMPLETE FRAME. Reduced motion freezes animations on their last
 * keyframe, so each cell ends where it started and each prominence ends at zero opacity. The
 * result is a still sun, correctly lit — not a lopsided one with a flare frozen mid-arc.
 * With no JavaScript at all, nothing here changes: there is none.
 *
 * The durations are deliberately coprime-ish — 23s, 31s, 17s, 41s, 29s — so the cells never
 * line back up into a pattern you can see repeating.
 */
export default function Sun({ className = "" }: { className?: string }) {
  return (
    // Two elements, and the split is load-bearing. The outer one takes the caller's
    // classes, so `absolute`, `w-[44vw]` and the rest behave normally. The inner one owns
    // `position: relative`, which every layer below is positioned against. Merging them
    // was the first version and it silently broke: `.sun { position: relative }` is
    // declared after @tailwind utilities at the same specificity, so it won the cascade
    // against an `absolute` utility and the sun laid itself out in the flow, ignoring
    // every offset it had been handed.
    <div className={className} aria-hidden="true">
      <div className="sun">
        <span className="sun-corona" />
        <span className="sun-spokes" />

        <span className="sun-disc">
          <span className="sun-base" />
          <span className="sun-cell sun-cell-1" />
          <span className="sun-cell sun-cell-2" />
          <span className="sun-cell sun-cell-3" />
          <span className="sun-spot sun-spot-1" />
          <span className="sun-spot sun-spot-2" />
          {/* Static grain. Turbulence rendered once as a data URI and tiled, blended
              overlay — the high-frequency mottle a stack of soft gradients cannot produce
              on its own. It never animates, so it rasterises once and then costs nothing;
              animating a turbulence filter is what makes plasma effects unusable on a
              phone. */}
          <span className="sun-grain" />
          <span className="sun-limb" />
        </span>

        {/* Prominences: stroked arcs with their feet on the limb and their apex past it.
            The shape is why these are SVG and not another gradient.

            THERE IS NO BLUR FILTER HERE, AND THAT IS THE FIX FOR A REAL BUG. The first
            version softened them with feGaussianBlur inside a <filter id="sunPromSoft">.
            A page can hold more than one sun — the home page has one in the hero and one
            in the closing band — and every instance shipped its own copy of that id.
            Duplicate SVG ids are undefined behaviour: `filter="url(#sunPromSoft)"`
            resolves to whichever definition came first in the document, which belonged to
            a different SVG with a different coordinate space, and the result was a small
            dark square painted at the sun's top-left corner. It was visible in every
            screenshot and looked like a rendering glitch rather than a bug with a cause.

            The glow now comes from two stacked strokes instead: a wide soft one under a
            narrow bright one. No filter, no id, nothing to collide, and cheaper. */}
        <svg className="sun-prom" viewBox="0 0 200 200" focusable="false">
          <g className="prom prom-1">
            <path className="prom-glow" d={PROM_LEFT} fill="none" strokeWidth="7" strokeLinecap="round" />
            <path className="prom-core" d={PROM_LEFT} fill="none" strokeWidth="1.6" strokeLinecap="round" />
          </g>
          <g className="prom prom-2">
            <path className="prom-glow" d={PROM_FOOT} fill="none" strokeWidth="6" strokeLinecap="round" />
            <path className="prom-core" d={PROM_FOOT} fill="none" strokeWidth="1.4" strokeLinecap="round" />
          </g>
        </svg>
      </div>
    </div>
  );
}

/**
 * The two prominence arcs, written once each so the glow stroke and the core stroke can
 * never drift apart.
 *
 * WHERE THEY SIT IS NOT AESTHETIC, IT IS ARITHMETIC. The first pair were placed at the
 * top-right and lower-left of the disc, which looked right in the abstract and was invisible
 * in practice: this sun is always cropped, and it is cropped differently in each place it
 * appears. In the hero it hangs off the top-right corner, so a prominence at the top is
 * above the viewport. In the closing band only the bottom arc of the disc shows at all.
 * Measuring where each one actually landed on screen — one at y = -73, off the top — is what
 * found it; nothing about the code looked wrong.
 *
 * So there is one on the left limb, which the hero shows, and one on the foot of the disc,
 * which the closing band shows. Circle centre (100,100), radius 100. Each control point is
 * solved backwards from the apex, because a quadratic passes through (P0 + 2C + P2) / 4 at
 * its midpoint rather than through C — put the apex at C and the arc only reaches half as
 * far out as intended.
 */
// Feet at 164° and 184°, apex at radius 113 — thirteen percent past the limb, not
// thirty-six. The first pair reached to 136 and rendered as a pale hook clamped to the
// side of the disc, like a handle on a teacup. A real prominence hugs the limb.
const PROM_LEFT = "M3.87 127.6 Q -26.9 113.3 0.24 93";
// Feet at 118° and 134°, apex at radius 112 — lower LEFT of the disc, not bottom centre.
// Centred, it hung symmetrically under the sun in the closing band and read as a smile
// drawn under the heading rather than as anything solar. Off-axis, it reads as a feature.
const PROM_FOOT = "M53.05 188.3 Q 26.55 201.1 30.53 171.9";
