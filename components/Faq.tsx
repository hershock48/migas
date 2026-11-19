/**
 * The FAQ list, extracted from app/consulting/page.tsx the day /co-management grew
 * its own set of questions. Everything here was reasoned out there and moved
 * verbatim; the stories live with the decisions:
 *
 * DRAFTS RENDER AS DRAFTS. An answer beginning PLACEHOLDER is one only he can give.
 * It used to print the literal token into the page in the same grey as finished
 * answers; now it renders inside the dashed panel convention the whole build uses
 * for pending content, addressed to him, with the marker stripped and the first
 * letter capitalized here rather than in lib/site.ts — so the data stays exactly as
 * authored and deleting the marker is still the only edit that finishes an answer.
 *
 * <details> RATHER THAN A JS ACCORDION. It opens without hydration, it is findable
 * with the browser's own find-in-page in current engines, and it needs no aria
 * wiring to be announced correctly.
 */
export default function Faq({ items }: { items: readonly { q: string; a: string }[] }) {
  /* A question whose answer is still a PLACEHOLDER is not shown at all. It used
     to render as a dashed box headed "Draft: needs your answer", with our note
     to him as the text: "licensed operators will ask this before they book. It
     should be in your own words." That is a message to the owner printed where
     his customers read. The questions are still in lib/site.ts, marked, and
     each one appears by itself the day its answer is written. */
  const answered = items.filter((f) => !f.a.startsWith("PLACEHOLDER"));
  if (answered.length === 0) return null;
  return (
    <div className="reveal mt-10 divide-y divide-line border-y border-line">
      {answered.map((f) => {
        const answer = f.a;
        return (
          <details key={f.q} className="group py-5">
            <summary className="flex cursor-pointer list-none items-start justify-between gap-6 text-[17px] font-semibold text-bone">
              {f.q}
              <span
                aria-hidden
                className="mt-1 shrink-0 text-flare transition-transform group-open:rotate-45"
              >
                +
              </span>
            </summary>
            <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-muted">{answer}</p>
          </details>
        );
      })}
    </div>
  );
}
