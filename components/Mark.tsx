/**
 * A stand-in wordmark, built on his lockup's actual construction.
 *
 * WHAT IS HIS AND WHAT IS NOT, because the distinction is the whole point of this file.
 *
 * The CONSTRUCTION is his, and he described it: MIGAS set once, then set again directly
 * beneath as a vertical mirror, the two rows tight enough to share an axis. That was checked
 * against his logo rather than taken on trust — masking the near-black letters off the sun and
 * comparing the top half against the bottom gives an intersection-over-union of 0.42 for a
 * vertical flip, 0.37 for a 180° rotation and 0.13 for any unmirrored arrangement. So it is a
 * reflection, like water, not an upside-down copy. The same measurement puts the lockup at
 * 2.4:1 overall, which makes each row a wide, short band — and that proportion is reproduced
 * here, because getting it wrong is what makes a stand-in look nothing like the real thing even
 * when every other decision is right.
 *
 * The LETTERFORMS are not his and are not pretending to be. His are heavy and angular with
 * pointed terminals and rectangular counters — closer to blackletter than to anything in this
 * build's type. They cannot be traced from a screenshot either: the letters overhang the sun
 * onto pure black, so the strokes that leave the disc are indistinguishable from the
 * background, and anything produced from a guess would be invention wearing his name. Reaching
 * for a blackletter webfont to get "close" would be worse — an approximation sits next to the
 * real article where the comparison is immediate, and every difference reads as a mistake.
 *
 * So this holds his geometry in the site's own display face. It reads as the right shape with
 * the wrong letters, which is exactly what a placeholder should read as. When his file arrives
 * it replaces this component and nothing else changes.
 *
 * TWO SIZES, AS ANY REAL BRAND HAS. The stacked lockup is a poster mark: at navigation size the
 * mirrored row is 14px tall and turns to mush, so small placements get a single row. That is
 * not a compromise, it is what the primary-mark / horizontal-lockup split exists for.
 */
export function Mark({
  className = "",
  stacked = false,
}: {
  className?: string;
  /** The two-row reflected lockup. For poster sizes only — see the note above. */
  stacked?: boolean;
}) {
  // role="img" with a label rather than letting a screen reader loose on the glyphs: stacked,
  // the word is in the DOM twice, and "MIGAS MIGAS" is not the name of the business.
  if (!stacked) {
    return (
      <span role="img" aria-label="MI Gas" className={`mg-mark ${className}`}>
        <span className="mg-mark-row">MIGAS</span>
      </span>
    );
  }
  return (
    <span role="img" aria-label="MI Gas" className={`mg-mark mg-mark-stacked ${className}`}>
      <span className="mg-mark-row">MIGAS</span>
      <span className="mg-mark-row mg-mark-flip">MIGAS</span>
    </span>
  );
}
