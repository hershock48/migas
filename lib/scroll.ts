/** "smooth" unless the visitor asked the OS for less motion. The CSS rule in
 *  globals.css does not reach scrollIntoView calls that pass a behavior. */
export const scrollBehavior = (): ScrollBehavior =>
  typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
    ? "auto"
    : "smooth";
