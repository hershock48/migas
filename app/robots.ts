import type { MetadataRoute } from "next";

/**
 * Disallow everything, and this is not a mistake to fix later — it is the point.
 *
 * This deploy is a pitch containing a full copy of a real business's content, sitting on a
 * different hostname to theirs. Indexed, it competes with mi-gas.net for their own name and
 * reads as duplicate content on both. It stays out of the index until it becomes their site.
 *
 * ON LAUNCH DAY, three things change together and none of them works alone:
 *   1. this file — allow "/", and add `sitemap`
 *   2. the X-Robots-Tag header in next.config.ts — delete that headers() block
 *   3. `robots` in the metadata export in app/layout.tsx — delete it
 * A robots.txt that allows crawling while an X-Robots-Tag says noindex is still noindexed,
 * and that is a genuinely hard thing to notice from the outside.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", disallow: "/" }],
  };
}
