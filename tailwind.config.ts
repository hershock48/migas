import type { Config } from "tailwindcss";

/**
 * Brand tokens, and every one of them is a measured decision rather than a taste.
 *
 * The palette is a flowering room: near-black with a green cast, a signal green for
 * anything that acts, and an HPS amber for warmth. It is deliberately dark and
 * high-contrast — this is a facility director selling SOPs to commercial operators,
 * not a wellness brand.
 *
 * IMPORTANT, IF HIS REAL BRAND ARRIVES. This is a proposed direction, designed
 * without ever seeing his site: the browser in the build environment cannot reach
 * the public internet, so nobody involved has seen his colours, type or photography.
 * When his logo and palette turn up, they land here and nowhere else. Nothing in the
 * app hardcodes a colour.
 *
 * Contrast, measured against WCAG 2.1 AA rather than assumed:
 *
 *   bone on ink     17.62   body text
 *   bone on panel   16.21
 *   muted on ink     7.71   secondary text
 *   muted on panel   7.09
 *   gas on ink      11.73   links and small text
 *   amber on ink     9.77
 *   ink on gas      11.73   button labels
 *   ink on amber     9.77
 *
 * TWO BORDER TOKENS, ON PURPOSE. `line` measures 1.36 on ink, which is fine for a
 * decorative divider — WCAG's 3:1 non-text rule applies to boundaries that identify
 * a control, not to hairlines between sections. `edge` measures 3.62 on ink and 3.33
 * on panel and is what every form field, button outline and focus ring uses, because
 * there the boundary IS the control. Do not swap one for the other.
 */
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: { DEFAULT: "#0B0D0A", panel: "#141813" },
        line: "#242C22",
        edge: "#5E6F58",
        bone: "#F2F4EF",
        muted: "#9BA697",
        gas: { DEFAULT: "#7CE04B", dim: "#5FB239" },
        amber: "#F2A93B",
        // The hero diagram's own tones. They live here rather than inside the SVG
        // because the rule is that no colour is written anywhere but this file — and a
        // diagram is exactly the place that rule usually gets broken.
        rig: { metal: "#2A3327", edge: "#404B3B", media: "#39412F", fibre: "#505B44" },
      },
      fontFamily: {
        display: ["var(--font-display)", "ui-sans-serif", "system-ui", "sans-serif"],
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      maxWidth: { content: "1180px" },
      borderRadius: { xl2: "18px" },
    },
  },
  plugins: [],
};
export default config;
