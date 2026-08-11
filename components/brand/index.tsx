import { VIEWBOX as MIRROR_VB, D as MIRROR_D } from "./MirrorLockup.path";
import { VIEWBOX as TOTEM_VB, D as TOTEM_D } from "./Totem.path";
import { VIEWBOX as GRAFFITI_VB, D as GRAFFITI_D } from "./Graffiti.path";

/**
 * HIS REAL MARKS. Three of them, traced from artwork he sent on 10 Aug 2026.
 *
 * This replaces components/Mark.tsx, which was a stand-in set in the site's own display face.
 * That file argued its letterforms could not be recovered from a screenshot, and it was right at
 * the time: the only reference was the lockup sitting on his sun, where every stroke that
 * overhangs the disc runs onto pure black and becomes indistinguishable from the background. The
 * artwork he sent is flat black on white, so there is nothing to separate and nothing to guess.
 *
 * WHAT THE STAND-IN GOT RIGHT, now measurable rather than inferred. It claimed the lockup was a
 * vertical MIRROR at roughly 2.4:1, derived by masking the letters off the sun and comparing
 * halves, which gave a noisy intersection-over-union of 0.42 for a flip against 0.37 for a
 * rotation — barely a signal. On the clean artwork the same test gives 0.970 for a vertical flip
 * against 0.289 for a 180-degree rotation, and the aspect measures 2.36:1. So it is a reflection
 * like water, not an upside-down copy, and the proportion was right. Recording that because it is
 * the one part of the stand-in worth keeping: the geometry was sound, only the letters were not.
 *
 * VECTOR, NOT THE BITMAP HE SENT. The source is a phone screenshot, so placing it directly would
 * put a fixed-resolution PNG on the largest element of the page, soft on any display denser than
 * the screenshot and impossible to recolour. Traced instead with potrace at alphamax 0 — every
 * corner preserved, which matters because his terminals are pointed and any corner smoothing
 * rounds them off. The sweep is in the commit: alphamax 0 beat 0.4 and 1.0 on all three marks.
 *
 * Fidelity was measured, not eyeballed. Each trace was rasterised back at the source resolution
 * and compared pixel for pixel:
 *
 *   mirrored lockup   IoU 0.9936   0.32% of pixels disagree
 *   totem             IoU 0.9965   0.19%
 *   graffiti          IoU 0.9906   0.27%
 *
 * The residual is the anti-aliased boundary of a screenshot, which is the limit of the source
 * rather than of the trace. If he ever sends the original vector these get replaced, and nothing
 * else about the site changes.
 *
 * ONE COLOUR, `currentColor`, for all three. His marks are monochrome and take their colour from
 * whatever they sit on — black over the sun on his own artwork, bone in this site's navigation.
 *
 * The graffiti mark is worth a note because it inverts. It is drawn as white letters inside a
 * black banner, so the ink is the banner and the OUTLINES and the letters are holes in it. Filled
 * bone on a dark page the banner goes bone and the letters read dark through it, which is the
 * same design inverted and is how a single-colour logo is supposed to behave. It is not a bug.
 */

type Props = { className?: string; title?: string };

/**
 * EVERY MARK CARRIES EXPLICIT width AND height, and that is a bug fix rather than tidiness.
 *
 * An <svg> with a viewBox and no width/height attributes has an intrinsic ASPECT RATIO but no
 * intrinsic SIZE. Modern engines resolve `width: 62%; height: auto` from the ratio and get it
 * right — WebKit here measures the mirrored lockup at 186.6 x 79.0, exactly 2.36:1. Safari on
 * iOS has historically fallen back to the CSS replaced-element default of 150px for the
 * unspecified dimension instead, and that is almost certainly what he photographed: a faint
 * square patch on the disc, centred, measured off his screenshot at 59% of the diameter wide by
 * 55% tall. A 186.6 x 150 box on a 301px disc is 62% by 50%. Nothing else on the page is that
 * shape in that place.
 *
 * It is visible at all because the lockup is absolutely positioned with a translate, so it is
 * promoted to its own compositing layer, and it sits over `.sun-churn-b`, which is
 * mix-blend-mode: screen. Where a composited layer overlaps a blend layer's backdrop, iOS can
 * snapshot that backdrop per layer — so the layer's RECTANGLE prints as a tonal step even though
 * the element itself paints nothing outside its glyphs. This is the same family as the grey
 * square he reported from an iPhone weeks ago, which was composited descendants escaping the
 * disc's border-radius; that one was cured with a mask on .sun-disc.
 *
 * Setting both attributes from the viewBox removes the ambiguity in every engine: the intrinsic
 * size is stated, so `height: auto` has a real ratio to resolve against and cannot fall back.
 * Written once here rather than three times, and derived from the viewBox rather than typed, so
 * a retrace cannot leave the two disagreeing.
 */
function dims(viewBox: string) {
  const [, , w, h] = viewBox.split(/\s+/).map(Number);
  return { width: w, height: h };
}

/** Wide, one row, chunky enough to survive small sizes. The navigation mark. */
export function Graffiti({ className = "", title = "MI Gas" }: Props) {
  return (
    <svg
      className={className}
      viewBox={GRAFFITI_VB}
      {...dims(GRAFFITI_VB)}
      role="img"
      aria-label={title}
      focusable="false"
      /* The traced coordinates come out of potrace at ten times scale with y measured upward, so
         the wrapper carries the flip. Folding it into the numbers was tried and made the path
         data 23% LARGER, because potrace's own output leans on relative commands with implicit
         repetition that an absolute rewrite cannot use. Verified output, smaller file: keep it. */
    >
      <g transform="translate(0,2750) scale(1,-1)" fill="currentColor">
        <path d={GRAFFITI_D} />
      </g>
    </svg>
  );
}

/** MIGAS over its own reflection, 2.36:1. The poster mark — see the note about small sizes. */
export function MirrorLockup({ className = "", title = "MI Gas" }: Props) {
  return (
    <svg
      className={className}
      viewBox={MIRROR_VB}
      {...dims(MIRROR_VB)}
      role="img"
      aria-label={title}
      focusable="false"
    >
      <g transform="translate(0,4930) scale(1,-1)" fill="currentColor">
        <path d={MIRROR_D} />
      </g>
    </svg>
  );
}

/** The same letters read downward, one per row, each mirrored. 0.43:1 — very tall. */
export function Totem({ className = "", title = "MI Gas" }: Props) {
  return (
    <svg
      className={className}
      viewBox={TOTEM_VB}
      {...dims(TOTEM_VB)}
      role="img"
      aria-label={title}
      focusable="false"
    >
      <g transform="translate(0,16260) scale(1,-1)" fill="currentColor">
        <path d={TOTEM_D} />
      </g>
    </svg>
  );
}
