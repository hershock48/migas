import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Photos of a sick canopy come off a phone at 3–8 MB each, and a serverless
    // function's request body caps out around 4.5 MB on Vercel regardless of what is
    // set here. So the browser downscales before submitting (see components/Booking.tsx)
    // and this ceiling exists to catch the no-JS path with a readable error rather than
    // a silent 413. The real fix is client-direct upload to blob storage; the seam is
    // storeUploads in app/actions.ts.
    serverActions: { bodySizeLimit: "4.5mb" },
  },

  // ── The host split ──────────────────────────────────────────────────────────
  //
  // migas.glazedweb.com serves TWO things: the proposal at its root, and a full copy
  // of the client's site at /demo. mi-gas.net, when it becomes theirs, serves the site
  // at its root with no proposal anywhere.
  //
  // THESE MUST BE IN beforeFiles. A plain rewrites() array is afterFiles, which only
  // runs once Next has failed to find a page, and app/page.tsx already answers "/", so
  // the root rewrite would silently never fire and the proposal would never appear.
  //
  // Host-scoped rather than basePath: "/demo", because basePath is global to a build
  // and would bury the real site under /demo the day the domain goes live.
  //
  // One accepted wart: links inside the demo are root-relative, so the /demo prefix
  // drops off after the first click. Nothing 404s, and the alternative is rewriting
  // every href in the app for the benefit of a temporary host.
  //
  // Delete this block and public/pitch/migas the day they sign or pass.
  async rewrites() {
    const onPitchHost = [{ type: "host" as const, value: "migas.glazedweb.com" }];
    return {
      beforeFiles: [
        { source: "/", destination: "/pitch/migas/index.html", has: onPitchHost },
        { source: "/demo", destination: "/", has: onPitchHost },
        { source: "/demo/:path*", destination: "/:path*", has: onPitchHost },
      ],
    };
  },

  // This build is a pitch, not the client's live site. Until MI Gas signs, every
  // path must stay out of the index: it is a full copy of their content and must
  // never compete with mi-gas.net for their own name. Delete this block on the day
  // it becomes their real site, and not before.
  async headers() {
    return [
      { source: "/:path*", headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }] },
    ];
  },
};

export default nextConfig;
