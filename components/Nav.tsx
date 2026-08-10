"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { NAV } from "@/lib/site";
import { Graffiti } from "./brand";

export default function Nav() {
  const [open, setOpen] = useState(false);
  const path = usePathname();
  useEffect(() => setOpen(false), [path]);

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-ink/90 backdrop-blur">
      <div className="wrap flex h-[68px] items-center justify-between">
        {/* The graffiti mark rather than the mirrored lockup, and the reason is size. A
            reflected lockup at nav scale puts each row under 14px and the reflection turns to
            mush -- that is what the primary-mark / horizontal-lockup split exists for. This one
            is a single row at 3.15:1, so it holds -- but only above a floor, and the floor was
            measured on a size ladder rather than picked. Its letters are HOLES in the ink and
            its outlines are about 2px in an 867px-wide source, so they scale to nothing: at
            28px the crown and the bursts are indistinguishable noise and MIGAS is a smudge. It
            resolves at 32px and is clean at 40, which fits a 68px bar with room to spare. */}
        <Link href="/" className="flex items-center" aria-label="MI Gas home">
          <Graffiti className="h-10 w-auto" />
        </Link>

        <nav className="hidden items-center gap-7 md:flex" aria-label="Main">
          {NAV.map((i) => {
            const active = path === i.href;
            return (
              <Link
                key={i.href}
                href={i.href}
                aria-current={active ? "page" : undefined}
                className={`text-sm transition-colors ${
                  active ? "text-flare" : "text-muted hover:text-bone"
                }`}
              >
                {i.label}
              </Link>
            );
          })}
          <Link href="/consulting#book" className="btn-primary !px-5 !py-2">
            Book a consult
          </Link>
        </nav>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls="mobile-nav"
          className="grid h-11 w-11 place-items-center rounded-lg border border-edge md:hidden"
        >
          <span className="sr-only">{open ? "Close menu" : "Open menu"}</span>
          <span aria-hidden className="relative block h-3.5 w-5">
            <span className={`absolute left-0 h-0.5 w-5 bg-bone transition-all ${open ? "top-1.5 rotate-45" : "top-0"}`} />
            <span className={`absolute left-0 top-1.5 h-0.5 w-5 bg-bone transition-opacity ${open ? "opacity-0" : ""}`} />
            <span className={`absolute left-0 h-0.5 w-5 bg-bone transition-all ${open ? "top-1.5 -rotate-45" : "top-3"}`} />
          </span>
        </button>
      </div>

      <div
        id="mobile-nav"
        hidden={!open}
        className="border-t border-line bg-ink-panel md:hidden"
      >
        <nav className="wrap flex flex-col gap-1 py-3" aria-label="Main, mobile">
          {NAV.map((i) => (
            <Link
              key={i.href}
              href={i.href}
              aria-current={path === i.href ? "page" : undefined}
              className={`rounded-lg px-4 py-3 text-base ${
                path === i.href ? "bg-ink text-flare" : "text-bone hover:bg-ink"
              }`}
            >
              {i.label}
            </Link>
          ))}
          <Link href="/consulting#book" className="btn-primary mt-2">
            Book a consult
          </Link>
        </nav>
      </div>
    </header>
  );
}
