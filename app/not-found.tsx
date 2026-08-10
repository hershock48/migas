import Link from "next/link";
import { NAV } from "@/lib/site";

/**
 * A 404 that routes rather than apologises.
 *
 * Worth having on this build specifically: the live site has roughly twice as many product
 * URLs as it has products, so links to retired guide pages are already out there in DMs and
 * Patreon posts. Anyone following one should land somewhere useful.
 */
export default function NotFound() {
  return (
    <section className="wrap py-24 sm:py-32">
      <p className="eyebrow">404</p>
      <h1 className="mt-5 text-[2.4rem] leading-[1.05] sm:text-5xl">
        That page isn&rsquo;t here.
      </h1>
      <p className="mt-5 max-w-xl text-lg leading-relaxed text-muted">
        Some older product links no longer resolve. Everything that exists is one of these.
      </p>
      <ul className="mt-10 grid max-w-2xl gap-3 sm:grid-cols-2">
        {NAV.map((i) => (
          <li key={i.href}>
            <Link
              href={i.href}
              className="card flex items-center justify-between p-5 text-bone transition-colors hover:border-edge hover:text-flare"
            >
              {i.label}
              <span aria-hidden>&rarr;</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
