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
 *   fast    1.05s      luminance flicker
 *   medium  2.1–7.5s   the fine surface tile, and the fire streaming out past the limb
 *   slow    17–300s    convection cells, the big surface tile, corona breath
 *
 * Take away any one layer and it stops reading as a star. This list used to have a "medium"
 * layer of embers detaching and dying, and an argument that they were what made it read as
 * *burning* rather than *glowing*. They were also the one thing on here that is not solar: the
 * sun does not shed round sparks, and on a phone they read as exactly what they were — dots
 * coming off a drawing. Deleted — and so, eventually, was every other thing drawn on the
 * limb by hand. What carries it now is the texture itself, inside and out.
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
 * position rather than a budget one: `filter: blur()` on the old flare strands was tried at 5px and
 * at 9px and it did not soften them, it erased them — the structure smeared into a formless haze.
 * Every soft edge here is built out of stacked geometry or a mask instead. The surface is two
 * noise tiles at different scales, one creeping and one churning, blended — the
 * interference between two moving textures produces continuously-changing structure for the
 * price of two composited translations, which is the same trick a fire shader uses. Each tile
 * translates by exactly one tile width, so the loop is seamless. Everything that moves animates
 * only `transform` and `opacity`. Animating an feTurbulence instead is what makes plasma effects
 * unusable on a phone — which is why the turbulence here is baked into PNGs by a script and
 * merely transformed at runtime.
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
 * authored geometry at full strength, which is a complete, correctly lit sun. Better than
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

        {/* NOTHING IS DRAWN OVER THE FIRE ANY MORE, and the SVG layer that used to sit here
            is gone along with its last occupant.

            It held, in order: fourteen flame tongues, then 960 spicule hairlines, then coronal
            loop arcades, then flare plumes — four attempts at putting something on the limb by
            hand. He pointed at the plumes last: "those random strands, prob from old build."
            Right on both counts. They were hand-drawn ribbons that made sense while the space
            outside the disc was an empty gradient, and once that space became turbulent fire
            flowing outward they read as painted noodles lying on top of the real thing.

            The exterior IS the flare now. Drawing another one over it was the mistake, four
            times running. */}

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


