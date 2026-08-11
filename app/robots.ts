import type { MetadataRoute } from "next";

/**
 * ALLOW CRAWLING, STAY OUT OF THE INDEX. Those are two different switches and this file is
 * the wrong one for the second job.
 *
 * This used to be `disallow: "/"` with a comment insisting it was the point, not a mistake.
 * The goal was right and this was the wrong lever twice over.
 *
 * IT DID NOT PROTECT ANYTHING. robots.txt governs FETCHING, not indexing. A crawler told
 * not to fetch can never see the noindex — so a URL discovered from a link elsewhere can
 * still be listed, with no title and no snippet, precisely because the directive that would
 * have excluded it was unreachable. Google documents this exact trap. What actually keeps
 * this build out of the index is the pair that remains: `robots: { index: false }` in the
 * metadata export, and the X-Robots-Tag header in next.config.ts. Both are still here, and
 * a page can be crawled all day and still never appear.
 *
 * AND IT BROKE EVERY LINK PREVIEW EXCEPT APPLE'S. Facebook's, LinkedIn's, Slack's and X's
 * unfurlers all honour robots.txt, so `Disallow: /` meant pasting this URL into any of them
 * produced a bare row of text. iMessage was the exception — Apple's preview is fetched by
 * the sending device rather than by a search crawl, which is why the card there had the
 * right title while everything else got nothing. He asked for the link to look right when
 * he sends it; a rule that forbids the fetch is the first thing standing in the way.
 *
 * ON LAUNCH DAY the remaining two come off together, and neither works alone:
 *   1. the X-Robots-Tag header in next.config.ts — delete that headers() block
 *   2. `robots` in the metadata export in app/layout.tsx — delete it
 * Add `sitemap` here at the same time. A robots.txt that allows crawling while an
 * X-Robots-Tag says noindex is still noindexed, and that is a genuinely hard thing to
 * notice from the outside — which is the whole reason this note lists all of them.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/" }],
  };
}
