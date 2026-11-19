import type { Metadata } from "next";
import { COMANAGEMENT_LIVE } from "@/lib/site";

/**
 * While co-management is hidden (COMANAGEMENT_LIVE in lib/site.ts) nothing on
 * the site links here, and these pages tell search engines to stay away. They
 * still open by their address so Jake can read them while they are finished.
 * To make them a 404 instead, call notFound() here when the switch is off.
 */
export const metadata: Metadata = COMANAGEMENT_LIVE ? {} : { robots: { index: false, follow: false } };

export default function CoManagementLayout({ children }: { children: React.ReactNode }) {
  return children;
}
