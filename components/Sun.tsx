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
 *   slow    14–300s    flare plumes, convection cells, corona breath, coronal streaks
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
 * position rather than a budget one: `filter: blur()` on the flare strands was tried at 5px and 9px
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
 * FLARES: A FLASH AND A RISING PLUME. Third attempt, and the first one built from what a flare
 * actually looks like rather than from what its physics diagram looks like.
 *
 * NASA's own alt text for an X1.9 on 30 Nov 2025, in extreme ultraviolet colorised orange and
 * yellow: "a bright flash of yellow appears, a solar flare, and then a plume of yellow and orange
 * material rises away from the Sun from the same location as the flare."
 *
 * That is two things in sequence at one spot on the limb — a flash, then a plume lifting away — and
 * it is what he described from the start as a wick, or a small fire. I built a ring of wide flame
 * tongues, was told it looked childish, and over-corrected twice: first into spicules, which are a
 * limb TEXTURE and not a flare at all, then into coronal loop arcades, which are structurally what
 * an arcade is and read as wire hoops. Both times I corrected his vocabulary instead of building
 * what he was describing. The vocabulary was never the problem. An erupting prominence in 304
 * angstrom footage genuinely does look like fire licking off the edge.
 *
 * WHAT MAKES IT LICK RATHER THAN SPIKE is one term: each strand rises radially out of the surface
 * and then CURLS tangentially. Radial-only is a spike, and a ring of spikes is the sea urchin from
 * two versions ago. The curl is shared in sign across a plume — every strand leaning the same way —
 * which is what makes it read as one coherent eruption rather than a starburst.
 *
 * THE TAPER IS A POPULATION EFFECT, the same trick that fixed the fringe. Strand lengths follow a
 * bell across the plume's footprint, so the silhouette comes to a point; and strands alternate
 * between a short bright inner set and a long faint outer set, so the plume is dense and hot at the
 * base and dissolves toward the tip without needing a gradient — which would need an id, and this
 * page paints two suns.
 */
const FLARE_PEAK = 0.5;
/** Five alpha samples across a strand's cross-section. Fewer than the loops needed: a plume is
 *  many overlapping strands, so the softness is mostly in the crowd rather than in each stroke. */
const GLOW_PASSES = [1, 0.72, 0.46, 0.24, 0];
/**
 * One entry per eruption: where on the limb, how many strands, how wide its footprint, how far it
 * reaches, and how hard it curls. Negative curl leans the other way.
 *
 * Angles use the disc's convention — x = 100 + r cos a, y = 100 + r sin a, so 0 is right, 90 is
 * bottom, 180 is left. Both crops of this sun show the lower-left, so both plumes live there: the
 * hero cuts the top and right, and the closing band shows only the bottom arc.
 */
const PLUMES = [
  // 138 and 112 rather than 150 and 103, and the reach pulled in from 46 to 42, because at 150 the
  // plume ran off the left edge of a phone: the sun is 86% of the viewport with a 7% margin, and a
  // 46-unit reach at that angle puts the tip 24% of the sun's width past the disc — three times the
  // margin, so the section's clip ate the tip. Lower-left is the one direction with room in all
  // three crops: the desktop hero cuts top and right, the phone centres the disc, and the closing
  // band shows only the bottom arc.
  { c: 138, n: 15, span: 9, len: 42, curl: 20, peak: 1, dur: 14, delay: -3 },
  { c: 112, n: 12, span: 8, len: 30, curl: -15, peak: 0.78, dur: 19, delay: -11 },
];
type Plume = (typeof PLUMES)[number];

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

          {/* The flares. One group per eruption, each on its own cycle. */}
          {PLUMES.map((P, pi) => (
            <g
              key={`pl${pi}`}
              className={`flare${pi === 1 ? " fx-odd" : ""}`}
              style={{ animationDuration: `${P.dur}s`, animationDelay: `${P.delay}s` }}
            >
              {flash(P).map((k, i) => (
                <circle key={`fk${i}`} className={k.cls} cx={k.cx} cy={k.cy} r={k.r} />
              ))}
              {plumeStrands(P).map((S) =>
                /* Softness out of stacked geometry, not a filter. `filter: blur()` was tried at 5px
                   and 9px on the previous version and it does not soften plasma, it erases it —
                   the structure smears into a formless haze. Five passes on an exp(-2.6v^2) ramp
                   instead, which also stays correct at any zoom. */
                GLOW_PASSES.map((v, k) => (
                  <path
                    key={`s${S.j}-${k}`}
                    className="flare-strand"
                    d={S.d}
                    stroke={
                      v > 0.6
                        ? "var(--fl-outer)"
                        : v > 0.3
                          ? "var(--fl-mid)"
                          : S.outer
                            ? "var(--fl-warm)"
                            : "var(--fl-core)"
                    }
                    strokeWidth={(0.45 + v * 5.5) * (S.outer ? 0.8 : 1)}
                    strokeOpacity={
                      FLARE_PEAK * P.peak * Math.exp(-2.6 * v * v) * (S.outer ? 0.45 : 1) *
                      (0.8 + (0.4 * ((S.j * 11) % 4)) / 3)
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
   Same angle convention as everything else on the disc.
   ─────────────────────────────────────────────────────────────────────────────────── */

const LIMB = 99;
const rad = (a: number) => (a * Math.PI) / 180;
const onLimb = (a: number, r = LIMB) => [100 + r * Math.cos(rad(a)), 100 + r * Math.sin(rad(a))];

/**
 * One strand: out along the radius, then curling across it.
 *
 * Control 1 is purely radial, so the strand leaves the surface perpendicular — anything else and
 * the base looks pasted on rather than rooted. Control 2 and the end point add the tangential curl,
 * with the end carrying nearly twice the control's offset so the tip keeps turning instead of
 * straightening out. That is the difference between a tongue of fire and a bent stick.
 */
function strandPath(a: number, len: number, curl: number) {
  const [x0, y0] = onLimb(a);
  const [urx, ury] = [Math.cos(rad(a)), Math.sin(rad(a))];
  const [utx, uty] = [-Math.sin(rad(a)), Math.cos(rad(a))];
  const n = (v: number) => v.toFixed(2);
  return (
    `M${n(x0)} ${n(y0)}` +
    `C${n(x0 + urx * len * 0.4)} ${n(y0 + ury * len * 0.4)} ` +
    `${n(x0 + urx * len * 0.8 + utx * curl)} ${n(y0 + ury * len * 0.8 + uty * curl)} ` +
    `${n(x0 + urx * len + utx * curl * 1.9)} ${n(y0 + ury * len + uty * curl * 1.9)}`
  );
}

/** Every strand of one plume, with the stroke it wants. */
function plumeStrands(P: Plume) {
  const out: { d: string; outer: boolean; j: number }[] = [];
  for (let j = 0; j < P.n; j += 1) {
    const u = P.n === 1 ? 0.5 : j / (P.n - 1);
    // ^0.75 rather than a plain sine: a plain bell tapers too politely and the plume comes out
    // leaf-shaped. This holds the middle strands long and drops the edges away faster.
    const bell = Math.pow(Math.sin(Math.PI * u), 0.75);
    const a = P.c - P.span / 2 + u * P.span;
    const outer = j % 2 === 1;
    const len = P.len * (outer ? 1 : 0.62) * bell * (0.82 + 0.36 * (((j * 7) % 5) / 4));
    const curl = P.curl * (0.55 + 0.9 * bell) * (0.8 + 0.4 * (((j * 5) % 3) / 2));
    out.push({ d: strandPath(a, Math.max(3, len), curl), outer, j });
  }
  return out;
}

/** The flash: the flare itself, a bright kernel where the plume leaves the surface. */
function flash(P: Plume) {
  const [x, y] = onLimb(P.c, LIMB - 1);
  return [
    { r: 9, cls: "flare-flash-halo" },
    { r: 4.6, cls: "flare-flash-mid" },
    { r: 2, cls: "flare-flash-core" },
  ].map((k) => ({ cx: x.toFixed(2), cy: y.toFixed(2), ...k }));
}
