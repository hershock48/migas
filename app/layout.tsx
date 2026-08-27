import type { Metadata } from "next";
import { Archivo, Inter } from "next/font/google";
import "./globals.css";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import Reveal from "@/components/Reveal";
import { OG_IMAGE, SITE } from "@/lib/site";

/**
 * Two faces, and only two.
 *
 * Archivo for anything that has to sound like a facility — a wide industrial
 * grotesque, set tight and heavy. Inter for everything you actually read. Both are
 * loaded as variables so tailwind.config.ts is the only place the mapping lives, and
 * both are subset to latin, which is the difference between one font file and eight.
 */
const display = Archivo({
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  variable: "--font-display",
  display: "swap",
});

const sans = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: `${SITE.name} - ${SITE.tagline}`,
    // Every page sets its own title and gets the brand appended once. The live site
    // titles every page "MI Gas", so five pages compete for one query and none of
    // them says what it is.
    template: `%s - ${SITE.name}`,
  },
  description:
    "Commercial cannabis cultivation consulting and facility co-management from the director of a licensed Michigan facility. Book a call, or put your room on the program.",
  /**
   * THE LINK PREVIEW CARD. There was no og:image at all, which is why pasting the URL into
   * a text produced a bare row of words: with nothing to show, iMessage falls back to a
   * text-only preview or scrapes the favicon.
   *
   * 1200x630 is what Slack, WhatsApp, Facebook, LinkedIn and X all want, and it is what
   * Apple lists as the landscape option. The catch is that newer iOS crops these toward
   * square, so the outer 285px of each side can go — everything in the card is inside the
   * centre 630px band for that reason, and the square crop was rendered and checked rather
   * than assumed.
   *
   * JPEG rather than PNG, and that is measured. The PNG came out at 778KB against Apple's
   * 1MB guidance, which matters more here than usual because the SENDER's phone downloads
   * it over their own connection with no proxy in between. Quality 95 with no chroma
   * subsampling is 238KB — 69% smaller — for a mean error of 1.0/255 and 0.64/255 across
   * the smooth dark sky, which is where JPEG would band if it were going to. Invisible.
   *
   * The picture is generated from the live components by app/og-card, not drawn separately,
   * so it cannot drift away from the site.
   */
  openGraph: {
    type: "website",
    siteName: SITE.name,
    title: `${SITE.name} - ${SITE.tagline}`,
    description:
      "Consulting calls and facility co-management for indoor cultivators, from a working commercial facility.",
    /**
     * NOT SITE.url, and the /demo is load-bearing until they sign.
     *
     * The host split in next.config.ts makes migas.glazedweb.com/ the PROPOSAL and serves
     * this site at /demo. So the site's own canonical share URL is no longer the root of
     * the host it is currently served from.
     *
     * Slack and iMessage link a card to whatever URL was pasted, so they were fine either
     * way. Facebook and LinkedIn canonicalize the share object to og:url — meaning a demo
     * link posted there would have unfurled correctly and then landed the click on the
     * proposal. He is being sent the demo to look at the site, not to re-read the pitch.
     *
     * metadataBase stays SITE.url, so the leading-slash og:image still resolves against the
     * origin rather than picking up this path.
     *
     * ON THE DAY THEY SIGN this goes back to SITE.url, in the same commit that deletes the
     * rewrites() block and public/pitch/migas. All three are one change.
     */
    url: `${SITE.url}/demo`,
    // Relative is fine and resolves absolute against metadataBase above, which the spec
    // requires — a relative og:image is simply dropped by most scrapers.
    images: [OG_IMAGE],
  },
  twitter: { card: "summary_large_image", images: [OG_IMAGE.url] },
  // This is a pitch build, so the meta robots tag agrees with the HTTP header set in
  // next.config.ts. Both go on the day it becomes his real site.
  robots: { index: false, follow: false },
};

/**
 * Structured data. Three types, because they answer three different questions a
 * search engine asks: what is this business, who is the person behind it, and what
 * can I buy. The current site publishes none of it, which is why it never appears as
 * anything but a blue link.
 *
 * Everything here reads from lib/site.ts, and the two fields that are still
 * placeholders are omitted rather than filled with something invented — a wrong
 * telephone in structured data is worse than no telephone.
 */
function StructuredData() {
  const graph: Record<string, unknown>[] = [
    {
      "@type": "ProfessionalService",
      "@id": `${SITE.url}/#business`,
      name: SITE.name,
      description: SITE.tagline,
      areaServed: { "@type": "State", name: SITE.region },
      url: SITE.url,
      sameAs: [SITE.patreon, SITE.instagram],
      ...(SITE.email && !SITE.email.startsWith("PLACEHOLDER") ? { email: SITE.email } : {}),
      ...(SITE.phone ? { telephone: SITE.phone } : {}),
    },
    {
      "@type": "Service",
      "@id": `${SITE.url}/consulting#service`,
      name: "Cannabis cultivation consulting",
      serviceType: "Cultivation consulting",
      provider: { "@id": `${SITE.url}/#business` },
      areaServed: { "@type": "Country", name: "US" },
    },
    {
      "@type": "Service",
      "@id": `${SITE.url}/co-management#service`,
      name: "Cannabis facility co-management",
      serviceType: "Facility co-management",
      provider: { "@id": `${SITE.url}/#business` },
      areaServed: { "@type": "Country", name: "US" },
    },
  ];
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify({ "@context": "https://schema.org", "@graph": graph }),
      }}
    />
  );
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${sans.variable}`}>
      <body>
        {/* First focusable thing on the page. The live site has no skip link, so a
            keyboard visitor tabs the whole navigation on every page. */}
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-ember focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-ink"
        >
          Skip to content
        </a>
        <Nav />
        <main id="main">{children}</main>
        <Footer />
        <Reveal />
        <StructuredData />
      </body>
    </html>
  );
}
