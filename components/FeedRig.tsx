import { DIAGRAM } from "@/lib/site";

/**
 * The one piece of motion on the site, and it is his product rather than decoration.
 *
 * A fertigation cross-section: pressure through the manifold, a drop off the emitter, a
 * wet front moving down the slab, runoff into the tray. Four of his own guide topics in
 * one picture — flower, veg, run-off, hand-water to automation — and the runoff label is
 * the point of it, because reading runoff is the thing he sells and the thing most rooms
 * never do.
 *
 * FOUR RULES IT FOLLOWS, all of them learned the hard way.
 *
 * 1. Keyframes live in globals.css, next to the rules that use them. Declared in
 *    tailwind.config.ts they get purged unless an `animate-*` utility appears in scanned
 *    markup, and a plain CSS rule naming the animation does not count. The symptom is
 *    vicious: animation-play-state reports "running", the duration reports correctly, and
 *    the transform never changes.
 *
 * 2. EVERY ANIMATED SHAPE IS WRAPPED IN A GROUP THAT CARRIES ITS POSITION. This is not
 *    style, it is the bug that shipped in the first version of this file. A `transform`
 *    presentation attribute on an SVG element is overridden wholesale by a CSS
 *    `transform` — so `<path transform="translate(118 102)">` with a keyframe applying
 *    `translateY()` loses the translate entirely and draws at the viewBox origin. All
 *    three drops were animating in the top-left corner of the graphic, nowhere near the
 *    drip line, and it looked like one stray blob rather than a broken animation. Position
 *    goes on the <g> attribute, motion goes on the child's CSS. Never both on one node.
 *
 * 3. transform-box: fill-box on every transformed SVG child. Without it a transform is
 *    measured from the viewBox origin rather than the element, and `transform-origin:
 *    50% 50%` means the middle of the whole drawing.
 *
 * 4. The resting state is a finished picture. Every falling drop ends at opacity 0 and the
 *    slab rests part-wet, so reduced motion — which freezes everything on its last frame —
 *    leaves a clean diagram rather than drops hanging in mid-air.
 *
 * The numbers are PLACEHOLDER and come from lib/site.ts. See DIAGRAM there for why they
 * matter more than they look like they do.
 */
export default function FeedRig({ className = "" }: { className?: string }) {
  return (
    <figure className={`mg-rig ${className}`}>
      <svg
        viewBox="0 0 274 380"
        role="img"
        aria-label={`Diagram of a fertigation cycle: ${DIAGRAM.inLabel.toLowerCase()} at ${DIAGRAM.inValues.join(", ")}, down through the slab, ${DIAGRAM.outLabel.toLowerCase()} at ${DIAGRAM.outValues.join(", ")}.`}
      >
        <defs>
          {/* A blurred ellipse rather than a flat one. The first version used a plain
              low-opacity ellipse and it read as a visible oval smudge behind the slab
              instead of light in a room — the same mistake as a hard-edged ground rect
              under a drawing. */}
          <filter id="rigBloom" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="18" />
          </filter>
        </defs>

        <ellipse cx="118" cy="232" rx="94" ry="64" filter="url(#rigBloom)" className="fill-flare/[0.07]" />

        {/* ── Manifold ─────────────────────────────────────────────────────── */}
        <rect x="26" y="20" width="184" height="11" rx="5.5" className="fill-rig-metal" />
        <rect x="26" y="20" width="184" height="11" rx="5.5" className="fill-none stroke-rig-edge" strokeWidth="1" />
        {/* Flow, as travelling dashes rather than a moving highlight. Rest state is a
            static dashed line, which still reads as a line carrying something. */}
        <line x1="33" y1="25.5" x2="203" y2="25.5" className="rig-flow stroke-flare/60" strokeWidth="2" strokeLinecap="round" />

        {/* ── Drop tube and emitter ────────────────────────────────────────── */}
        <rect x="115" y="29" width="6" height="54" className="fill-rig-metal" />
        <line x1="118" y1="35" x2="118" y2="79" className="rig-flow stroke-flare/60" strokeWidth="2" strokeLinecap="round" />
        <rect x="108" y="80" width="20" height="11" rx="3.5" className="fill-rig-metal stroke-rig-edge" strokeWidth="1" />
        <rect x="115.5" y="91" width="5" height="5" className="fill-rig-metal" />

        {/* The fall path, drawn faintly. Between drops the emitter and the slab would
            otherwise read as two unrelated objects with a gap between them. */}
        <line
          x1="118" y1="99" x2="118" y2="176"
          className="stroke-flare/15"
          strokeWidth="1"
          strokeDasharray="1 6"
          strokeLinecap="round"
        />

        {/* Feed drops. Position on the group, motion on the path — see rule 2 above. */}
        {[0, 1, 2].map((i) => (
          <g key={i} transform="translate(118 102)" className="rig-feed">
            <path d={DROP} className={`rig-drop rig-drop-${i} fill-flare`} />
          </g>
        ))}

        {/* ── The slab ─────────────────────────────────────────────────────── */}
        <rect x="60" y="178" width="116" height="88" rx="2" className="fill-rig-media" />
        {/* Wet front, descending from the top surface. Physically the right direction:
            rockwool saturates downward, it does not fill like a glass. */}
        <rect x="60" y="178" width="116" height="88" className="rig-wet fill-flare/20" />
        {/* Grain. A slab reads as a slab because of the horizontal fibre. */}
        {[194, 208, 222, 236, 250].map((y) => (
          <line key={y} x1="66" y1={y} x2="170" y2={y} className="stroke-rig-fibre" strokeWidth="1" />
        ))}
        <rect x="60" y="178" width="116" height="88" rx="2" className="fill-none stroke-rig-edge" strokeWidth="1.25" />
        {/* Lit top surface, shaded right face. Two lines, and the slab stops being flat. */}
        <line x1="60" y1="178" x2="176" y2="178" className="stroke-bone/25" strokeWidth="1.5" />
        <rect x="168" y="179" width="8" height="86" className="fill-ink/25" />

        {/* Runoff. Two drops, offset, because runoff does not leave on a grid. */}
        <g transform="translate(100 270)">
          <path d={DROP} className="rig-drop rig-run-0 fill-flare" />
        </g>
        <g transform="translate(136 270)">
          <path d={DROP} className="rig-drop rig-run-1 fill-flare" />
        </g>

        {/* ── Tray ─────────────────────────────────────────────────────────── */}
        <rect x="46" y="304" width="144" height="16" rx="4" className="fill-ink-panel stroke-rig-edge" strokeWidth="1.25" />
        <rect x="50" y="310" width="136" height="6" rx="2" className="fill-flare/25" />
        <line x1="50" y1="310.5" x2="186" y2="310.5" className="stroke-flare/50" strokeWidth="1" />

        {/* ── Labels ───────────────────────────────────────────────────────────
            Top-right and bottom-left rather than stacked down one side: the objects they
            annotate are at opposite ends of the drawing, and a leader line off each keeps
            the label attached to its object instead of floating in the margin.
            ─────────────────────────────────────────────────────────────────── */}
        <line x1="216" y1="25.5" x2="266" y2="25.5" className="stroke-line" strokeWidth="1" />
        <text x="266" y="46" textAnchor="end" className="rig-eyebrow">{DIAGRAM.inLabel}</text>
        {DIAGRAM.inValues.map((v, i) => (
          <text key={v} x="266" y={66 + i * 19} textAnchor="end" className="rig-value">
            {v}
          </text>
        ))}

        <line x1="26" y1="312" x2="42" y2="312" className="stroke-line" strokeWidth="1" />
        <text x="26" y="334" className="rig-eyebrow">{DIAGRAM.outLabel}</text>
        {DIAGRAM.outValues.map((v, i) => (
          <text key={v} x="26" y={354 + i * 19} className="rig-value">
            {v}
          </text>
        ))}
      </svg>

      <figcaption className="mt-3 max-w-[36ch] text-sm leading-relaxed text-muted">
        {DIAGRAM.caption}
      </figcaption>
    </figure>
  );
}

/** A teardrop, drawn once, with its own tip at the origin so a <g> can place it exactly. */
const DROP =
  "M0 -6 C 3.2 -1.6 5 1 5 3.2 C 5 6.1 2.8 8 0 8 C -2.8 8 -5 6.1 -5 3.2 C -5 1 -3.2 -1.6 0 -6 Z";
