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
 * EVERY LOOP RESTS ON A COMPLETE FRAME. This section used to say reduced motion "freezes
 * animations on their last keyframe" and that the layers were built to end at zero opacity for
 * that reason. Checked in a reduce-emulating browser, that is not what happens: the reduce rule
 * sets animation-duration to 0.001ms and no layer here sets animation-fill-mode, so nothing holds
 * a final keyframe — every element reverts to its unanimated base style. The still frame is the
 * authored geometry at full strength, which is a complete sun with a complete fringe. Better than
 * what the comment claimed, and worth stating correctly, because "ends at zero opacity" would
 * otherwise look like a constraint on any future keyframe written here. It is not one. What DOES
 * matter is that each loop's base style is a sane resting state, and it is. With no JavaScript
 * nothing changes: there is none.
 *
 * THE PALETTE IS MEASURED. Sampled off his own logo: the disc reads #CC5528, the corona
 * #F7C063, the sunspots #802715, the background literally #000000 — and, worth keeping
 * because it looks wrong written down, his sun is brightest just *inside* its own limb rather
 * than at the centre. Get that backwards and it reads as a beach ball.
 */

/**
 * SPICULES, not flames — the correction that mattered, and it took three passes to land.
 *
 * The sun has no flames. Fire is buoyancy-driven: wide base, tapering tongue, rises and
 * detaches. None of that physics exists on a star. What the limb carries is spicules, jets of
 * plasma channelled along magnetic field lines. The measurements settle every question the
 * earlier versions answered by eye:
 *
 *   ~300 km wide by 3,000-10,000 km tall   ->  aspect ratio 10:1 to 33:1
 *   ~100,000 active simultaneously         ->  turf, not a ring of tongues
 *   10,000 km against a 696,000 km radius  ->  1.4% OF THE DISC RADIUS
 *   rise ~20 km/s, live 10-15 minutes
 *   parabolic path: up, decelerate, fall back to where they started
 *
 * The third line is the one that kept getting missed. Version one was fourteen wide tongues,
 * which is a campfire, and a comment here argued FOR the width: "narrow and tall reads as a
 * spike no matter how the curve is drawn." True, and beside the point — a spike is what is
 * there. Version two fixed the aspect and then ran the blades 12-40 units against a 100-unit
 * radius: 12-40% where reality is 1.4%, a sea urchin. Exaggeration is unavoidable at this size
 * but it has to be bounded. 3-10 units is a 2-7x exaggeration and reads as a fringe hugging the
 * limb, which is what H-alpha limb photographs show. Early observers called it a "burning
 * prairie" — prairie, not bonfire.
 *
 * CLUSTERED, WHICH IS CHEAPER AND TRUER AT ONCE. Twenty-four clusters, two interleaved sub-tufts
 * each, twenty blades per sub-tuft: 960 blades on 48 animated nodes. Spicules do erupt in groups
 * at the edges of the chromospheric network, so a tuft rising and falling together is closer to
 * the physics than 960 independent blades.
 *
 * DENSITY IS WHAT MAKES IT READ AS PLASMA RATHER THAN AS TEETH, and this was the last thing to
 * land. 432 blades put one every 1.44 units around a 622-unit limb: 46% fill, so the eye resolved
 * individual strokes and counted them, which is a comb. 960 puts one every 0.65 units at 69%
 * fill, which the eye integrates into a single soft fringe instead. Same physics, same shapes,
 * same code — the only change is how many, and it is the difference between a drawing of spicules
 * and something that looks like a star's edge. Thinner and dimmer strokes came with it, because
 * the softness now comes from the population rather than from each stroke pretending to be soft.
 */
const SPICULE_CLUSTERS = 24;
/**
 * Two interleaved sub-tufts per cluster, each its own path, each its own opacity, width, duration
 * and phase.
 *
 * THIS IS WHAT STOPS THE FRINGE READING AS TWENTY-FOUR BLOCKS. One path per cluster means one
 * opacity per 15 degrees of limb, so the ring came out as alternating bright and dim arcs on an
 * even pitch — the same periodic rhythm the offsets exist to defeat, reintroduced through
 * brightness instead of spacing. Splitting each tuft in two and interleaving their blades means
 * every point on the limb carries both a bright fast population and a dim slow one, so there is
 * no arc that is uniformly anything. Sixty animated nodes per sun against nine hundred and sixty
 * blades.
 */
const SUB_TUFTS = 2;
const BLADES_PER_SUB = 20;
/**
 * Each cluster covers MORE arc than its own pitch, and that ratio is the entire fix for the
 * clumping.
 *
 * Measured on the previous pass: tufts occupied 14.16 deg out of a 15 deg pitch, then the offsets
 * moved them by up to +/-3.9 deg, so pitches ran 8.2 to 22.5 deg against 14.16 of coverage. That
 * left 50.6 deg of limb — 14% of the ring — carrying no spicules at all, in gaps up to 7.5 deg
 * wide. Structurally correct turf, rendered as clumps with bald patches between them, which is
 * exactly what a comb looks like.
 *
 * Coverage of 20.5 deg against a 15 deg pitch and offsets clamped to +/-0.15 of pitch puts the
 * worst-case pitch at 16.82 deg, still inside coverage. Bare arc is then 0.00 deg by construction
 * rather than by luck, adjacent tufts interleave across a 5.5 deg seam, and the overlap is a gain
 * in itself: where one tuft's short edge blades sit, its neighbour's mid-length blades fill in.
 */
const CLUSTER_COVER = 20.5;
const CLUSTER_OFFSET_LIMIT = 0.15;
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
          {/* The spicule turf. Each cluster is drawn at the top of the circle and carried to
              its place by a rotate ATTRIBUTE on the wrapping group, then animated by CSS on the
              path — never both on one node, because a CSS transform replaces an SVG transform
              attribute wholesale and the tuft would snap back to the top of the circle. */}
          {Array.from({ length: SPICULE_CLUSTERS }, (_, c) => {
            const cl = cluster(c);
            // No `fx-odd` on this group, deliberately — see the mobile rule in globals.css.
            // Hiding every other CLUSTER is what the flame version did, and on this fringe it
            // would reopen 9.5 deg bald gaps in the ring, which is the exact failure the coverage
            // ratio exists to prevent. Mobile drops the long sparse population instead.
            return (
              <g key={`sc${c}`} transform={`rotate(${cl.angle} 100 100)`}>
                {cl.tufts.map((t, s) => (
                  <path
                    key={s}
                    className={t.far ? "spicules sp-far" : "spicules"}
                    d={t.d}
                    strokeWidth={t.w}
                    /* STROKE-OPACITY, NOT OPACITY, and this is not a stylistic preference.
                       @keyframes sunSpicule animates `opacity` for the rise-and-fall envelope,
                       and an animation beats a presentation attribute outright rather than
                       multiplying with it — so an `opacity` attribute here is simply discarded
                       and every tuft peaks at full brightness. The dim and bright populations
                       silently collapsed into one. `stroke-opacity` is a separate property, so
                       the two multiply and the envelope scales each tuft's own alpha. */
                    strokeOpacity={t.op}
                    style={{ animationDuration: `${t.dur}s`, animationDelay: `${t.delay}s` }}
                  />
                ))}
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

/**
 * Angular offsets for the tufts, as a fraction of one tuft's pitch. Irregular by construction —
 * see the note in cluster() for why this is a literal rather than a formula.
 */
const CLUSTER_OFFSET = [
  -0.176, -0.349, 0.151, -0.428, 0.036, -0.134, -0.442, 0.007, -0.463, -0.066, -0.43, -0.409,
  -0.075, 0.327, -0.376, -0.277, 0.127, 0.448, 0.077, -0.103, 0.476, -0.453, 0.358, -0.21,
];

/**
 * One tuft of blades as a single path, plus its animation parameters.
 *
 * The blades are laid out along a 15-degree arc at the TOP of the circle, so the group's local
 * Y axis is outward for every one of them. The `rotate()` attribute on the wrapping <g> then
 * carries the whole tuft to its place on the limb. Computing the geometry here rather than
 * writing path literals is what makes the density and the exaggeration adjustable by one
 * number each instead of by redrawing.
 */
function cluster(c: number) {
  const span = 360 / SPICULE_CLUSTERS; // 15 deg of pitch
  const halfCover = (CLUSTER_COVER / 2) * (Math.PI / 180);
  // FLAT BASELINE, and this is the fix for how the first cluster pass looked.
  //
  // Laying the bases on the true arc and then scaling the path's Y put transform-origin at the
  // bottom-centre of the whole tuft's bounding box rather than at each blade's own base, so
  // scaleY sheared the outer blades sideways and the fringe rendered as barbed wire. Flattening
  // the baseline costs a little curve and in exchange every blade shares one y, which makes
  // `transform-origin: 50% 100%` exactly each blade's base. They then grow straight out of the
  // limb together instead of skewing.
  //
  // The line is a SECANT, not a tangent, and that matters now that a tuft spans 20.5 deg instead
  // of 15. y = 1 is tangent at the top of the disc, so on a wide tuft the outer bases float clear
  // of the limb by the full sagitta — visible as hairs detached from the surface. Sinking the line
  // by half the sagitta splits the error: outer blades float 0.79 units, inner ones root 0.79
  // units deep behind the disc, where they are hidden anyway. That worst case is smaller than the
  // 0.85 the narrower tangent version already shipped invisibly.
  const chord = 2 * 99 * Math.sin(halfCover); // 35.23 units
  const sagitta = 99 * (1 - Math.cos(halfCover)); // 1.58
  const yBase = 1 + sagitta / 2; // 1.79
  const tufts: { d: string; w: number; op: number; dur: number; delay: number; far: boolean }[] = [];

  for (let s = 0; s < SUB_TUFTS; s += 1) {
    // The dim, long, cool population and the bright, short, hot one. Declared here rather than
    // beside the rest of the tuft's properties because the blade lengths below now read it.
    const dim = s === 0;
    const segs: string[] = [];
    for (let b = 0; b < BLADES_PER_SUB; b += 1) {
      // Interleaved: sub-tuft 0 takes the even slots, 1 the odd, so the two populations are
      // mixed along the limb rather than sitting side by side.
      const slot = b * SUB_TUFTS + s;
      const k = c * SUB_TUFTS * BLADES_PER_SUB + slot;
      const frac = slot / (SUB_TUFTS * BLADES_PER_SUB - 1);
      // Jitter inside the blade's own slot, so the tuft is not a picket fence.
      const jitter = ((((k * 17) % 11) - 5) / 11) * (chord / (SUB_TUFTS * BLADES_PER_SUB));
      const x = 100 - chord / 2 + frac * chord + jitter;
      // Weighted short: mostly stubble with a few standing out. A flat spread read as a comb;
      // real turf is dominated by the short ones.
      //
      // THE TWO POPULATIONS HAVE DIFFERENT LENGTHS, which is how the fringe gets a falloff along
      // its length without a gradient. A jet is brightest at its base and dims toward the tip;
      // a plain stroke is one flat alpha end to end, which is what made these read as gold pins
      // stuck into the limb. A gradient would fix it and cannot be used — it needs an id, and
      // this page paints two suns, which is the duplicate-id bug documented above.
      //
      // So the falloff is built out of the populations instead: the bright hot one is SHORT and
      // dense, the dim cool one is LONG and sparse. Near the limb both contribute and it reads
      // hot; further out only the dim long ones reach, and it fades. Same trick as the density
      // argument — a property of the crowd rather than of any one stroke, and it costs nothing.
      const len = dim
        ? 4 + Math.pow(((k * 13) % 19) / 18, 2.2) * 7 // 4-11, the sparse outer reach
        : 2 + Math.pow(((k * 13) % 19) / 18, 2.6) * 3.6; // 2-5.6, the dense hot base
      // A few degrees off vertical so neighbours cross rather than run parallel. Kept small —
      // at +/-7 the tuft read as thorns once the shear was added on top.
      const lean = ((((k * 29) % 21) - 10) / 10) * 4 * (Math.PI / 180);
      const x2 = x + Math.sin(lean) * len;
      const y2 = yBase - Math.cos(lean) * len;
      // Relative lineto and one decimal: same picture, and the path data is the bulk of this
      // component's HTML now that there are 960 blades on the page twice over.
      segs.push(`M${x.toFixed(1)} ${yBase.toFixed(1)}l${(x2 - x).toFixed(1)} ${(y2 - yBase).toFixed(1)}`);
    }
    // Each property reads the offset table at its own coprime index step. Stepping the INDEX
    // linearly is safe in a way stepping the VALUE is not: (c*k)%m is linear in c, so it ramps,
    // but table[(c*5+3)%24] returns unrelated neighbours because the table itself is irregular.
    // Verified 24 of 24 distinct consecutive deltas for all three, and every index visited once.
    const wop = pick(c, 7, 13);
    const ph = pick(c, 5, 3);
    const du = pick(c, 11, 7);
    // Rounded, because these land in the HTML 96 times per page and 0.5638799999999999 is
    // sixteen characters of float noise for a difference no display can show.
    const r = (n: number) => Math.round(n * 1000) / 1000;
    tufts.push({
      far: dim,
      d: segs.join(""),
      w: r((dim ? 0.34 : 0.46) + Math.abs(wop) * 0.34), // 0.34-0.58
      op: r((dim ? 0.26 : 0.42) + Math.abs(wop) * 0.44), // 0.26-0.66
      dur: r((dim ? 3.4 : 2.6) + Math.abs(du) * 3.4), // 2.6-5.4s
      // Negative: the turf is mid-cycle on frame one rather than igniting together.
      delay: r(-((ph + 0.5) * (dim ? 5.4 : 4.2))),
    });
  }

  return {
    tufts,
    // Tufts are NOT evenly spaced. Real spicule groups sit on the chromospheric network and it is
    // irregular. But the offset is now clamped to +/-0.15 of pitch rather than +/-0.55, because
    // the offsets are what opened the bald patches: coverage has to stay wider than the worst-case
    // pitch or the ring comes apart into clumps. Irregularity that the eye reads now comes from
    // within the tufts — per-blade jitter, two mixed populations, and unrelated phases — rather
    // than from moving whole tufts far enough apart to leave holes.
    angle: span * c + CLUSTER_OFFSET[c % CLUSTER_OFFSET.length] * span * CLUSTER_OFFSET_LIMIT,
  };
}

/**
 * The offset table, read at a coprime index step. See the note in cluster(): the table's
 * irregularity is what makes a linear index step yield a non-linear sequence, which is precisely
 * what `(c * k) % m` failed to do twice.
 */
function pick(c: number, step: number, seed: number) {
  return CLUSTER_OFFSET[(c * step + seed) % CLUSTER_OFFSET.length];
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
