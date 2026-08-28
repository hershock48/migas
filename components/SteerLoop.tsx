/**
 * The co-management loop, drawn. This is the page's own concept — the room reports
 * through its sensors, we set the day's numbers remotely, the head grower runs them
 * on the floor, the room reports again — and a circuit is the honest shape for it:
 * no step is optional and none is first. The card grid under it lists what we run;
 * this shows why the head-grower condition and the sensor requirement are conditions
 * rather than preferences. Both appear IN the drawing for that reason: the sensor
 * node names the supported platforms, and one whole station belongs to their person,
 * not us.
 *
 * It follows the four FeedRig rules (see components/FeedRig.tsx for the stories):
 * keyframes live in globals.css; position on a group, motion on the child; fill-box
 * on transformed children (none here — the only motion is a dash offset, which
 * transforms nothing); and the resting state is a finished picture — a static dashed
 * ring with arrowheads still reads as a circuit with a direction, so reduced motion
 * loses nothing but the travel.
 *
 * No <defs>, no filter, no ids, on purpose: FeedRig renders on the same page and
 * owns "rigBloom". A second SVG with ids is how the duplicate-id square gets painted
 * (glaze.md failure log). Nothing here needs one.
 */
const NODES = [
  { x: 8, y: 30, name: "The room", sub: "Canopy, media, climate" },
  { x: 164, y: 30, name: "Your sensors", sub: "Aroya, Pinnacle, Growlink" },
  { x: 164, y: 214, name: "We steer", sub: "Shots, timings, targets" },
  { x: 8, y: 214, name: "Your head grower", sub: "Runs the day on the floor" },
] as const;

export default function SteerLoop({
  className = "",
  tone = "dark",
}: {
  className?: string;
  /** "paper" restyles the drawing for the printed one-pager: dark strokes and text
   *  on a light sheet, node boxes outlined rather than filled, so the circuit
   *  survives browsers stripping backgrounds at print time. Text fills switch via
   *  the mg-loop-paper block in globals.css. */
  tone?: "dark" | "paper";
}) {
  const paper = tone === "paper";
  const ring = paper ? "fill-none stroke-ink/25" : "fill-none stroke-line";
  const flow = paper ? "loop-flow fill-none stroke-ember/80" : "loop-flow fill-none stroke-flare/60";
  const arrow = paper ? "fill-ember-deep" : "fill-flare";
  // On paper the boxes are outlines: a filled box would vanish the moment a print
  // dialog strips backgrounds, and the ring behind them is hidden by the sheet
  // itself being the same ground.
  const node = paper ? "fill-bone stroke-ink/40" : "fill-ink-panel stroke-edge/70";
  return (
    <figure className={`mg-loop ${paper ? "mg-loop-paper" : ""} ${className}`}>
      <svg
        viewBox="0 0 300 300"
        role="img"
        aria-label="The co-management loop: the room reports through your sensors, we set shot sizes, timings and targets remotely, your head grower runs them on the floor, and the room reports again. The cycle repeats daily."
      >
        {/* The circuit, drawn through the node centres; the opaque node boxes sit on
            top and hide the ring behind them, which is cheaper and cleaner than four
            hand-trimmed legs. */}
        <rect x="72" y="58" width="156" height="184" rx="30" className={ring} strokeWidth="1.25" />
        <rect x="72" y="58" width="156" height="184" rx="30" className={flow} strokeWidth="2" strokeLinecap="round" />

        {/* Direction, stated statically. Clockwise: report up and across, execute down
            and back. */}
        <polygon points="145,54 157,60 145,66" className={arrow} />
        <polygon points="222,145 228,157 234,145" className={arrow} />
        <polygon points="155,234 143,240 155,246" className={arrow} />
        <polygon points="78,155 72,143 66,155" className={arrow} />

        {/* The four stations. */}
        {NODES.map((n) => (
          <g key={n.name}>
            <rect x={n.x} y={n.y} width="128" height="56" rx="10" className={node} strokeWidth="1.25" />
            <text x={n.x + 64} y={n.y + 25} textAnchor="middle" className="loop-name">
              {n.name}
            </text>
            <text x={n.x + 64} y={n.y + 42} textAnchor="middle" className="loop-sub">
              {n.sub}
            </text>
          </g>
        ))}

        {/* The cadence, in the middle of the circuit, because it is what the circuit
            means: this runs every day, not at install. */}
        <text x="150" y="143" textAnchor="middle" className="loop-eyebrow">
          The loop
        </text>
        <text x="150" y="164" textAnchor="middle" className="loop-value">
          Watched daily
        </text>
      </svg>
      {/* muted is a dark-ground token and measures ~2:1 on the paper sheet, so the
          caption switches with the tone. */}
      <figcaption
        className={`mt-3 max-w-[38ch] text-sm leading-relaxed ${paper ? "text-ink/70" : "text-muted"}`}
      >
        Your sensors report, we set the day&rsquo;s numbers, your head grower runs them.
        Then the room answers, and the loop goes again.
      </figcaption>
    </figure>
  );
}
