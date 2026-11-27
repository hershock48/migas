"use client";

import Link from "next/link";
import { useEffect, useState, type ComponentProps } from "react";
import { PITCH_HOME, PITCH_HOST } from "@/lib/site";

/**
 * A link to this site's home page that still lands on it on the test address.
 *
 * On migas.glazedweb.com the root is the proposal and the site's home page is at
 * /demo (next.config.ts, the host split). A plain href="/" there took a visitor
 * out of the site: found on 2026-11-27, when the logo on the consulting page
 * opened the August proposal, and every page logged a 404 for the logo's
 * prefetch. The owner had been sent the address to look at his site.
 *
 * The host is only known in the browser, so the first paint says "/" and the
 * effect corrects it. Reading the host on the server would make every page
 * dynamic for the sake of a temporary address. With scripts off the link still
 * says "/", which on the test address is the proposal, and the proposal links
 * back to the site.
 *
 * This file goes with the rest of the pitch scaffolding. On the day the
 * rewrites() block comes out, every <HomeLink> becomes <Link href="/">.
 */
export default function HomeLink({ hash = "", ...rest }: Omit<ComponentProps<typeof Link>, "href"> & { hash?: string }) {
  const [home, setHome] = useState("/");
  useEffect(() => {
    if (window.location.hostname === PITCH_HOST) setHome(PITCH_HOME);
  }, []);
  return <Link href={home + hash} {...rest} />;
}
