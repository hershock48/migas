/**
 * A stand-in wordmark.
 *
 * PLACEHOLDER, and flagged loudly because it is the one thing in this build that is
 * pretending. His real logo has never been seen by anyone who worked on this — the
 * browser here cannot reach the public internet, so nobody involved has looked at
 * mi-gas.net rendered. This is a typographic mark built from his name so the layout
 * has something honest-sized to hold, not a guess at his identity.
 *
 * When his real logo arrives it replaces this file and nothing else changes.
 */
export function Mark({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-baseline gap-[3px] font-display font-bold tracking-tight ${className}`}>
      <span className="text-bone">MI</span>
      <span className="text-gas">GAS</span>
    </span>
  );
}
