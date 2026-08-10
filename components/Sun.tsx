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
        {/* THE FIRE OUTSIDE THE LIMB. Two more tiles of the same turbulent texture, masked to
            a ring so they exist only beyond the disc, drifting in opposite directions.

            This replaces `.sun-spokes`, which was two repeating conic gradients — straight
            rays fanning out from the centre. Zoomed in on a phone they read as ruled pencil
            lines, and because they were low-alpha warm grey over near-black they averaged to
            a dull olive that made the whole outside of the sun look grey-green. His reference
            has nothing like it: outside the limb is the SAME churning filamentary fire as the
            surface, brightest where it meets the edge and thinning outward. Straight lines do
            not appear anywhere in it. */}
        {/* THE FIRE STREAMS OUTWARD, which is the whole point and what I had missed twice.
            He drew it on the reference: X's through the inside of the sphere meaning "not
            this", and arrows pointing radially OUT from the limb meaning "this". My exterior
            was isotropic turbulence translating diagonally — textured, but with no direction
            at all, so it read as a static halo.

            THE MASK HAS TO STAY STILL WHILE THE TEXTURE MOVES THROUGH IT. Scaling the masked
            element scales its mask too, so the ring's inner edge lifts off the limb and leaves
            a gap. So the wrapper is static and owns the mask — a fixed window sitting on the
            edge — and the layers inside it scale outward through that window. Material flows
            out; the window does not move.

            Three of them, phase-offset by a third of the cycle each, because one layer
            expanding and fading leaves the ring empty between repeats. Staggered, there is
            always material at every radius and the flow never restarts visibly. */}
        <span className="sun-flame">
          <span className="sun-flame-fx ff-1" />
          <span className="sun-flame-fx ff-2" />
          <span className="sun-flame-fx ff-3" />
        </span>

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
          {/* NO SPICULE FRINGE. There were 960 hairlines around the limb here, and zoomed in
              they read as exactly what they were: bristles, a felt edge, fuzz. Physically they
              are real — the chromosphere genuinely is a forest of spicules — but at this scale
              and against his reference they were the single worst thing on the sun. His limb is
              a blazing rim with turbulent fire beyond it and no hairs anywhere. The 1,920 paths
              they cost are now spent on the flame field outside instead, which is what the eye
              actually reads as burning. */}
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
          {/* TEXTURE FIRST, THEN THE LARGE-SCALE LIGHT AND SHADE OVER IT. The order was the
              other way round and it was wrong: the cells and spots painted underneath a
              texture layer at 0.82 opacity, so they were buried and the disc came out as
              uniform carpet. The reference has both scales at once — fine threads AND big
              dark voids with bright regions between them — and the threads come from the
              tiles while everything larger has to come from these gradients, because putting
              features that big back into a tile is what makes the repeat visible as a grid.
              So they sit on top now and modulate the fire instead of hiding behind it. */}
          <span className="sun-churn sun-churn-a" />
          <span className="sun-churn sun-churn-b" />
          {/* Slow structure, over the fire: bright plage and dark voids. */}
          <span className="sun-cell sun-cell-1" />
          <span className="sun-cell sun-cell-2" />
          <span className="sun-cell sun-cell-3" />
          <span className="sun-spot sun-spot-1" />
          <span className="sun-spot sun-spot-2" />
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
