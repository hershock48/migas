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
 *   fast    1.2–2.6s   surface churn, luminance flicker
 *   medium  2.6–5.4s   the spicule fringe rising and falling
 *   slow    13–300s    flare arcades, convection cells, corona breath, coronal streaks
 *
 * Take away any one layer and it stops reading as a star. This list used to have a "medium"
 * layer of embers detaching and dying, and an argument that they were what made it read as
 * *burning* rather than *glowing*. They were also the one thing on here that is not solar: the
 * sun does not shed round sparks, and on a phone they read as exactly what they were — dots
 * coming off a drawing. Deleted, and the flares carry the drama now instead.
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
 * HOW IT STAYS CHEAP OTHERWISE. NOTHING here carries a filter at all, and that is now a tested
 * position rather than a budget one: `filter: blur()` on the flare loops was tried at 5px and 9px
 * and it does not soften them, it erases them — the structure smears into a formless haze. Every
 * soft edge on this element is built out of stacked geometry instead. The surface churn is two
 * opaque
 * noise tiles translating in different directions at different scales and blended — the
 * interference between two moving textures produces continuously-changing structure for the
 * price of two composited translations, which is the same trick a fire shader uses. Each tile
 * translates by exactly one tile width, so the loop is seamless. Every spicule, flare and cell
 * animates only `transform` and `opacity`. Animating an feTurbulence instead is what makes
 * plasma effects unusable on a phone.
 *
 * DESYNCHRONISATION, NOT AMPLITUDE. Everything on the same cycle is a pulsing ring.
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

/**
 * FLARES, which is what was actually asked for twice before I built the right thing.
 *
 * The spicule fringe was the correct fix for cartoon flames and it answered a different question.
 * A flare is not a limb texture. It is an eruption in an active region, and the research settles
 * how it has to be drawn:
 *
 *   coronal loops are 10,000-200,000 km long and 100-1,000 km wide  ->  aspect 10:1 to 200:1
 *   against a 696,000 km radius that is 1.4% to 29% OF THE RADIUS   ->  apex 1.014R to 1.29R
 *   they are anchored at BOTH ends and follow the magnetic field
 *   they come in ARCADES "fanning out from magnetic concentrations"
 *   footpoints sit in active regions, at sunspots
 *   lifetimes minutes to days; the flare itself is the brightening
 *
 * THE ARCADE IS A VAULT, NOT AN ONION. This was the mistake that took a whole pass to see. Nesting
 * loops on shared footpoints and scaling them up renders as concentric rings — a drawn rainbow. A
 * real arcade has its footpoints marching ALONG the neutral line, so successive loops are
 * displaced sideways rather than scaled, and the system reads as a vault of arches standing in a
 * row. Same loop count, same brightness, completely different object.
 *
 * THE LOOPS RISE RADIALLY, and that is the other thing measured rather than eyeballed. Drawn as a
 * quadratic through an apex, a loop leaves the surface along its CHORD, so the stretch near each
 * foot falls inside the disc — and the fringe is painted behind the disc, so those parts vanish
 * and the loop reads as a hoop floating unattached. A cubic with both control points pushed
 * straight out along each foot's own radius leaves the surface perpendicular instead. Sampled at
 * 40 points along the curve, minimum radius comes out at exactly 1.000R for every height tried, so
 * nothing sinks. Control length h maps to apex almost linearly: h=14 -> 1.10R, h=36 -> 1.26R,
 * which brackets the measured range.
 *
 * WHY THE ACTIVE REGIONS SIT WHERE THEY DO. Not at the two sunspots, which is where they belong
 * physically and would be invisible here: those sit 31% and 44% of the radius from centre, so they
 * face the viewer and a flare there is seen from above, not in profile. A flare only arcs off an
 * edge when its region is ON the edge. Both crops of this sun show the lower-left — the hero cuts
 * the top and right, the closing band shows only the bottom arc — so all three regions live
 * between 97 and 170 degrees, which is the arc that is visible in both.
 */
const FLARE_PEAK = 0.24;
/**
 * Nine alpha samples across the loop's cross-section. Fixed literal rather than a loop bound so
 * the ramp is visible at the call site and cannot drift from the widths it pairs with.
 */
const GLOW_PASSES = [1, 0.875, 0.75, 0.625, 0.5, 0.375, 0.25, 0.125, 0];
/**
 * One entry per active region: centre angle, loop count, how far the arcade spreads along the
 * limb, each loop's own footpoint separation, and the apex heights at the middle and the ends.
 *
 * Angles use the same convention as the disc: x = 100 + r cos a, y = 100 + r sin a, so 0 is right,
 * 90 is bottom, 180 is left. The heights differ per region on purpose — three identical arcades
 * read as one shape stamped three times.
 */
const ARCADES = [
  { c: 132, n: 6, step: 5, spanMid: 34, spanEnd: 22, scale: 1.25, seed: 0, dur: 13.5, delay: -2.5 },
  { c: 172, n: 5, step: 5, spanMid: 26, spanEnd: 17, scale: 1.1, seed: 3, dur: 17, delay: -9.5 },
  { c: 99, n: 4, step: 6, spanMid: 22, spanEnd: 15, scale: 1.0, seed: 6, dur: 21, delay: -15 },
];
type Arcade = (typeof ARCADES)[number];

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

          {/* The flares. One group per active region, each on its own cycle. */}
          {ARCADES.map((A, ai) => (
            <g
              key={`ar${ai}`}
              className={`flare${ai === 1 ? " fx-odd" : ""}`}
              style={{ animationDuration: `${A.dur}s`, animationDelay: `${A.delay}s` }}
            >
              {/* The envelope goes down first, so everything else sits inside its light. */}
              {envelope(A).map((e, i) => (
                <circle key={`en${i}`} className="flare-env" cx={e.cx} cy={e.cy} r={e.r} opacity={e.o} />
              ))}
              {/* Footpoint ribbons next, so the loops paint over them. A real flare brightens at
                  its footpoints before the loops fill, and they stay the brightest part of it. */}
              {footpoints(A).map((p, i) => (
                <g key={`fp${i}`}>
                  <circle cx={p.x} cy={p.y} r="4.6" className="flare-foot-halo" />
                  <circle cx={p.x} cy={p.y} r="1.9" className="flare-foot-mid" />
                  <circle cx={p.x} cy={p.y} r="0.8" className="flare-foot-core" />
                </g>
              ))}
              {vault(A).map((L, i) =>
                /* GAUSSIAN CROSS-SECTION OUT OF STACKED STROKES, and the alternatives are both
                   worse. Three hard strokes — the old prominence recipe — gives a stepped edge
                   that reads as wire, which is what "hard lines" meant. `filter: blur()` was
                   tried at 5px and 9px and it does not soften the loops, it erases them: the
                   structure smears into a formless haze with nothing legible left. Nine passes on
                   an exp(-3.4u^2) alpha ramp is a real smooth falloff, costs no filter, and stays
                   sharp at any zoom because it is geometry rather than a raster effect. */
                GLOW_PASSES.map((u, k) => (
                  <path
                    key={`l${i}-${k}`}
                    className="flare-loop"
                    d={L.d}
                    stroke={u > 0.55 ? "var(--fl-outer)" : u > 0.22 ? "var(--fl-mid)" : "var(--fl-core)"}
                    strokeWidth={(0.55 + u * 8) * (1 - 0.25 * L.t)}
                    strokeOpacity={
                      FLARE_PEAK * Math.exp(-3.4 * u * u) * (1 - 0.5 * L.t) * (0.85 + (0.3 * ((i * 5) % 3)) / 2)
                    }
                  />
                ))
              )}
            </g>
          ))}
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
      const len =
        (dim
          ? 4 + Math.pow(((k * 13) % 19) / 18, 2.2) * 7 // 4-11, the sparse outer reach
          : 2 + Math.pow(((k * 13) % 19) / 18, 2.6) * 3.6) * 0.85; // 2-5.6, the dense hot base
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
    // SOFTENED, because at full strength this fringe read as hard drawn lines. The structure was
    // right and the amplitude was not: 960 strokes at up to 0.66 alpha and 0.58 units wide resolve
    // as individual bristles, and a bristle has a crisp tip no matter how many of them there are.
    // Roughly halved in both, which turns the same geometry from hair into haze. The flares are
    // meant to be what the eye goes to at the limb now; the fringe is the surface it sits on.
    tufts.push({
      far: dim,
      d: segs.join(""),
      w: r((dim ? 0.26 : 0.38) + Math.abs(wop) * 0.18), // 0.26-0.44
      op: r((dim ? 0.10 : 0.26) + Math.abs(wop) * 0.18), // 0.10-0.28
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

/* ── Flare geometry ───────────────────────────────────────────────────────────────────
   Same angle convention as everything else on the disc: x = 100 + r cos a, y = 100 + r sin a.
   ─────────────────────────────────────────────────────────────────────────────────── */

const LIMB = 99;
const rad = (a: number) => (a * Math.PI) / 180;
const onLimb = (a: number, r = LIMB) => [100 + r * Math.cos(rad(a)), 100 + r * Math.sin(rad(a))];

/**
 * One loop, anchored at two footpoints, leaving the surface PERPENDICULAR to it.
 *
 * A cubic with both control points pushed straight out along each foot's own radius. That is the
 * whole difference between a loop that reads as anchored and a hoop that reads as floating: with a
 * quadratic through an apex the curve leaves along the chord, dips inside the disc near each foot,
 * and since this layer paints behind the disc those stretches simply disappear. Sampled at 40
 * points, this form never goes below 1.000R.
 */
function loopPath(f1: number, f2: number, h1: number, h2: number) {
  const [x0, y0] = onLimb(f1);
  const [x3, y3] = onLimb(f2);
  const [u1x, u1y] = [Math.cos(rad(f1)), Math.sin(rad(f1))];
  const [u2x, u2y] = [Math.cos(rad(f2)), Math.sin(rad(f2))];
  const n = (v: number) => v.toFixed(2);
  return `M${n(x0)} ${n(y0)}C${n(x0 + u1x * h1)} ${n(y0 + u1y * h1)} ${n(x3 + u2x * h2)} ${n(y3 + u2y * h2)} ${n(x3)} ${n(y3)}`;
}

/**
 * The arcade: footpoint pairs marching along the limb, tallest in the middle.
 *
 * `bell` is a half sine across the arcade, which gives it the profile of a real one — loops rise
 * toward the centre of the neutral line and shorten at both ends. It also drives the dimming, so
 * the ends fade rather than stopping abruptly.
 *
 * THE ARCHES ARE ROUGHLY SEMICIRCULAR, and getting that wrong is what made the first version read
 * as coils. It gave each loop a 5.5 degree footpoint span and a 33-unit height: a separation of
 * 9.5 units against a height of 33, so an aspect of 3.5:1 TALL. That is a finger, not an arch, and
 * nine of them side by side is a bundle of fingers. The 10:1-to-200:1 figure from the research is
 * the plasma tube's own thickness, not the shape of the arch — the arch itself is close to
 * semicircular, so its height is about half the distance between its feet. `heightFor` enforces
 * exactly that, and spans went from 5 degrees to 22-34, which is a chord of 38-58 units carrying a
 * 19-29 unit arch. Wide arches overlapping in a fan; that is what a prominence arcade looks like.
 */
function heightFor(spanDeg: number, scale: number) {
  const chord = 2 * LIMB * Math.sin(rad(spanDeg) / 2);
  // /0.71 converts the arch height wanted into the control length that produces it, measured off
  // the cubic by sampling: h=20 gives 1.14R and h=36 gives 1.26R, so apex height ~= 0.71h.
  return ((chord / 2) / 0.71) * scale;
}

function vault(A: Arcade) {
  return Array.from({ length: A.n }, (_, i) => {
    const u = A.n === 1 ? 0.5 : i / (A.n - 1);
    const bell = Math.sin(Math.PI * u);
    const mid = A.c - (A.step * (A.n - 1)) / 2 + i * A.step;
    const span = A.spanEnd + (A.spanMid - A.spanEnd) * bell;
    const h = heightFor(span, A.scale);
    return { d: loopPath(mid - span / 2, mid + span / 2, h * 0.95, h * 1.05), t: 1 - bell * 0.85 };
  });
}

/**
 * The diffuse envelope: three big soft discs over the arcade, under the loops.
 *
 * Without it the loops overlap into something that reads as a spirograph — correct shapes with
 * nothing between them. Real prominence plasma is a translucent VOLUME with threads inside it, so
 * the threads need something to sit in. Circles rather than a blurred shape for the usual reason:
 * a gradient needs an id, this page paints two suns, and duplicate ids are the documented bug at
 * the top of this file.
 */
function envelope(A: Arcade) {
  const chord = 2 * LIMB * Math.sin(rad(A.spanMid) / 2);
  const reach = ((chord / 2) * A.scale) / 2;
  const [x, y] = onLimb(A.c, LIMB + reach * 0.55);
  return [
    { r: (chord * 0.62).toFixed(1), o: 0.020 },
    { r: (chord * 0.42).toFixed(1), o: 0.028 },
    { r: (chord * 0.26).toFixed(1), o: 0.034 },
  ].map((e) => ({ cx: x.toFixed(1), cy: y.toFixed(1), ...e }));
}

/**
 * Where the loops meet the surface. Two rows of them, one per side of the neutral line — a real
 * flare's footpoints are ribbons along that line, not two isolated dots, and drawing every loop's
 * feet is what makes them read that way.
 *
 * Pulled 0.5 units inside the limb so the halo tucks under the disc's own edge instead of sitting
 * on top of it as a visible bead.
 */
function footpoints(A: Arcade) {
  const out: { x: string; y: string }[] = [];
  for (let i = 0; i < A.n; i += 1) {
    const u = A.n === 1 ? 0.5 : i / (A.n - 1);
    const bell = Math.sin(Math.PI * u);
    const mid = A.c - (A.step * (A.n - 1)) / 2 + i * A.step;
    const span = A.spanEnd + (A.spanMid - A.spanEnd) * bell;
    for (const side of [-1, 1]) {
      const [x, y] = onLimb(mid + (side * span) / 2, LIMB - 0.5);
      out.push({ x: x.toFixed(2), y: y.toFixed(2) });
    }
  }
  return out;
}
