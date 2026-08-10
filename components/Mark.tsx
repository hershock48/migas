/**
 * A stand-in wordmark.
 *
 * PLACEHOLDER, and flagged loudly, because it is the one thing on this site still pretending.
 * His real mark is a black interlocked wordmark sitting over a burning sun — heavy, angular,
 * closer to blackletter than to a grotesque, and genuinely distinctive. It cannot be
 * reproduced honestly from a screenshot: the letters overhang the sun onto pure black, so the
 * parts that leave the disc are indistinguishable from the background and any trace of it
 * would be a guess wearing his name.
 *
 * So this is deliberately NOT an imitation. It is his name set in the site's own display face
 * at maximum weight and negative tracking, which gives the layout something honestly sized to
 * hold and reads as a placeholder to anyone who knows the real one. The sun beside it does
 * the brand work in the meantime.
 *
 * When the real logo arrives as an SVG it replaces this file and nothing else changes.
 */
export function Mark({ className = "" }: { className?: string }) {
  return (
    <span
      className={`inline-flex items-baseline gap-[0.14em] font-display font-extrabold uppercase leading-none tracking-[-0.04em] ${className}`}
    >
      <span className="text-bone">MI</span>
      <span className="text-flare">GAS</span>
    </span>
  );
}
