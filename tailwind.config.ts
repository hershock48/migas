import type { Config } from "tailwindcss";

/**
 * Brand tokens, sampled from his own logo rather than invented.
 *
 * His mark is a black interlocked wordmark over a burning sun on pure black. That image is
 * the brand, so the palette was read off it pixel by pixel instead of guessed: the disc
 * measures around #CC5528, the corona #F7C063, the bright granules near-white yellow, the
 * sunspots #802715, and the background is literally #000000. Everything below is one of
 * those, adjusted only as far as contrast required.
 *
 * TWO ACCENTS, AND THE SPLIT COMES FROM THE PHOTOGRAPH. `ember` is the disc — it fills
 * things: buttons, plates, the sun itself. `flare` is the corona — it writes things: links,
 * eyebrows, small emphasis. The disc is too dark to carry small text on black at the size
 * links get used, and the corona is too pale to carry black button labels. Using one token
 * for both is how you end up with either unreadable links or washed-out buttons.
 *
 * Contrast measured against WCAG 2.1 AA rather than assumed:
 *
 *   bone on ink     18.50   body text
 *   bone on panel   17.05
 *   muted on ink     7.62   secondary text
 *   muted on panel   7.03
 *   flare on ink    10.28   links, eyebrows, small accents
 *   ember on ink     5.44   large accents, and passes for text if needed
 *   ink on ember     5.44   button labels — note these are INK, never bone:
 *                           bone on ember is 3.40 and fails for normal text
 *   ink on ember-hot 6.96   button hover
 *   alert on ink    10.25   errors. Deliberately rose rather than orange, because an
 *                           orange error message on an orange brand is invisible as an
 *                           error — it just reads as more brand.
 *   hot on ink      17.70   the brightest highlight, for granules and hairlines
 *
 * TWO BORDER TOKENS, ON PURPOSE. `line` measures 1.40 on ink, which is right for a
 * decorative divider — WCAG's 3:1 non-text rule covers boundaries that identify a control,
 * not hairlines between sections. `edge` measures 3.48 on ink and 3.21 on panel and is what
 * every form field, button outline and focus ring uses, because there the boundary IS the
 * control. Do not swap one for the other.
 *
 * IF HIS REAL ASSETS ARRIVE, THEY LAND HERE. Nothing else in the app hardcodes a colour —
 * including the sun and the fertigation diagram, which is the usual place that rule breaks.
 */
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Near-black rather than #000000: a true black clips on OLED and makes the sun's
        // outer corona terminate in a visible edge instead of falling off into the page.
        ink: { DEFAULT: "#060403", panel: "#151010" },
        line: "#332621",
        edge: "#77604F",
        bone: "#F7F3EC",
        muted: "#A89C90",
        ember: { DEFAULT: "#D95E27", hot: "#F0722C", deep: "#8E2C11", core: "#5E1B0A" },
        flare: "#F5A83C",
        hot: "#FFEFA8",
        alert: "#FF9E8C",
        // The fertigation diagram's own tones. They live here rather than inside the
        // SVG because the rule is that no colour is written anywhere but this file — and
        // a diagram is exactly the place that rule usually gets broken. Warm, because a
        // rockwool slab under a sodium-coloured light is tan, not olive.
        rig: { metal: "#2A2320", edge: "#5A4A3F", media: "#4A3A2C", fibre: "#6B5748" },
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
