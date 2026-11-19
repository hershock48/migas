"use client";

import Link from "next/link";

/**
 * What a visitor sees if a page or a form throws. There was no such page, so
 * the framework's own stock error showed instead, with no way on from it
 * (review, 2026-11-19). Nothing typed into a form survives a thrown error, so
 * this says so instead of implying the request went.
 */
export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  return (
    <section className="wrap py-24 sm:py-32">
      <p className="eyebrow">Something went wrong</p>
      <h1 className="mt-4 text-3xl sm:text-4xl">That did not work</h1>
      <p className="mt-4 max-w-xl leading-relaxed text-muted">
        The page hit an error on our side. If you were sending a form, it did not go through, so nothing was booked
        and nothing was sent. Try again, and if it keeps happening, send us a message.
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <button type="button" onClick={reset} className="btn-primary">
          Try again
        </button>
        <Link href="/connect" className="btn-ghost">
          Send a message
        </Link>
      </div>
    </section>
  );
}
