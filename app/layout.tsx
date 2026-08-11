import type { Metadata } from "next";
import { Archivo, Inter } from "next/font/google";
import "./globals.css";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import Reveal from "@/components/Reveal";
import { SITE } from "@/lib/site";

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
    "Commercial cannabis cultivation consulting, SOPs and grow guides from the director of a licensed Michigan facility. Book a call, or buy the flower, veg and run-off programs.",
  openGraph: {
    type: "website",
    siteName: SITE.name,
    title: `${SITE.name} - ${SITE.tagline}`,
    description:
      "Consulting, SOPs and grow guides for indoor cultivators, from a working commercial facility.",
    url: SITE.url,
  },
  twitter: { card: "summary_large_image" },
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
