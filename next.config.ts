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
