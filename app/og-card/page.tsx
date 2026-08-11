import Sun from "@/components/Sun";
import { Graffiti } from "@/components/brand";

/**
 * THE SOURCE FRAME FOR public/og.png — the picture that shows up when the link is pasted
 * into a text, a Slack channel or anywhere else that reads Open Graph tags. Not a page
 * anybody visits. It exists so the card is generated from the real <Sun> and the real
 * traced mark rather than drawn a second time in an image editor, which is how a brand
 * asset drifts away from the site it is meant to represent.
 *
 * WHY NOT app/opengraph-image.tsx AND ImageResponse, which is the framework's own answer:
 * that renders through Satori, which supports a subset of CSS with no mask-image, no
 * mix-blend-mode and no background-blend-mode. The sun is built out of all three. It would
 * not fail, it would quietly produce a picture of something else.
 *
 * THREE DECISIONS, ALL FORCED BY THE FACT THAT THIS IS VIEWED SMALL.
 *
 * The mark is the Graffiti one, not the mirrored lockup. The first attempt used the
 * mirror, which is his own logo device and looks superb at 1200px — and turns to a dense
 * black blob by the time a phone has drawn the card at about 260pt across, because each of
 * its two rows lands near 13px. components/brand/README.md has the measured floor: the
 * graffiti mark resolves at 32px, the mirror does not.
 *
 * The sun is a horizon rather than a centred disc. Centred, it fills the frame with fire
 * and there is nowhere dark to put type — the first pass had "Grow" in its fire fill
 * sitting ON the fire, and it vanished. Dropped to the bottom third, the top of the frame
 * is ink and both the mark and the headline have a ground to sit on. It also happens to be
 * a sunrise under the words "Grow with us", which is the right accident to keep.
 *
 * Everything lives inside the centre 630px square. Apple crops these toward square on
 * newer iOS, so a wide composition loses its outer 285px on each side. Centred and
 * measured to fit, the card survives being cropped to a square without losing the mark,
 * the headline or the limb.
 */
export const dynamic = "force-static";

export default function OgCard() {
  return (
    <div className="og-stage">
      <div id="og" className="og-frame">
        <Sun className="og-sun" />
        {/* Ink over the top two thirds. The exterior fire reaches most of the frame and
            type needs a dark field, so this pulls the upper half back to near-black
            without touching the limb. */}
        <span aria-hidden className="og-scrim" />
        <div className="og-stack">
          <Graffiti className="og-graffiti" />
          <p className="og-head" aria-label="Grow with us">
            <span className="grow-word">
              {"Grow".split("").map((c, i) => (
                <span key={i} className="grow-letter og-still">
                  {c}
                </span>
              ))}
            </span>{" "}
            <span className="og-head-rest">with us</span>
          </p>
        </div>
      </div>
    </div>
  );
}
