import Sun from "@/components/Sun";
import { Graffiti } from "@/components/brand";

/**
 * The source frame for public/og-comanagement.jpg — the link card for the one page
 * that gets forwarded into ownership groups and the division conversations. Same
 * pipeline and the same three decisions as app/og-card/page.tsx (read that header):
 * the graffiti mark because the mirror turns to a blob at phone-card scale, the sun
 * as a horizon so type has dark ground, everything inside the centre 630px square
 * because newer iOS crops toward square.
 *
 * The headline is one word plus a support line, sized for the crop: "Co-management"
 * at 60px is ~470px wide and the support line ~500px, both inside the square. The
 * full-width "We run the room with you" was measured first and lost its ends to the
 * square crop.
 */
export const dynamic = "force-static";

export default function OgCardCoManagement() {
  return (
    <div className="og-stage">
      <div id="og" className="og-frame">
        <Sun className="og-sun" />
        <span aria-hidden className="og-scrim" />
        <div className="og-stack">
          <Graffiti className="og-graffiti" />
          <p className="og-head">
            <span className="og-head-rest">Co-management</span>
          </p>
          <p className="og-sub">Your room, run on our program</p>
        </div>
      </div>
    </div>
  );
}
