import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import MiniForm from "@/components/MiniForm";
import { GuideCard, ReviewCard } from "@/components/cards";
import { requestGuide } from "@/app/actions";
import { BUNDLE, GUIDES, REVIEWS, bundleSeparately, money, type Guide } from "@/lib/site";

/** The four guides plus the bundle, all rendered by this one page. */
const ALL: Guide[] = [BUNDLE, ...GUIDES];

export function generateStaticParams() {
  return ALL.map((g) => ({ slug: g.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const guide = ALL.find((g) => g.slug === slug);
  if (!guide) return {};
  return {
    title: guide.name,
    // Written from the guide's own data, so every one of the five is different. The live
    // site's product pages share a platform-generated description, which is why they
    // compete with each other in search results.
    description: `${guide.blurb} ${money(guide.price)}. ${guide.includes.join(" and ")}.`,
    openGraph: { title: `${guide.name} - MI Gas`, description: guide.blurb },
  };
}

export default async function GuidePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const guide = ALL.find((g) => g.slug === slug);
  if (!guide) notFound();

  const isBundle = guide.slug === BUNDLE.slug;
  const others = ALL.filter((g) => g.slug !== guide.slug && g.slug !== BUNDLE.slug).slice(0, 3);

  return (
    <>
      <section className="wrap pt-10 sm:pt-14">
        <nav aria-label="Breadcrumb" className="text-sm text-muted">
          <Link href="/guides" className="hover:text-flare">
            Programs
          </Link>
          <span aria-hidden className="mx-2">
            /
          </span>
          <span className="text-bone">{guide.name}</span>
        </nav>

        <div className="mt-8 grid gap-12 lg:grid-cols-[1.2fr_minmax(0,0.8fr)] lg:gap-16">
          <div className="reveal">
            <p className="eyebrow">{guide.covers}</p>
            <h1 className="mt-4 text-[2.2rem] leading-[1.08] sm:text-5xl">{guide.name}</h1>
            <p className="mt-6 text-lg leading-relaxed text-bone/85">{guide.blurb}</p>

            {guide.detail && (
              <ul className="mt-9 grid gap-5">
                {guide.detail.map((d) => (
                  <li key={d} className="flex gap-4 border-b border-line pb-5 last:border-0 last:pb-0">
                    <span aria-hidden className="mt-[10px] h-1.5 w-1.5 shrink-0 rounded-full bg-ember" />
                    <p className="text-[15px] leading-relaxed text-muted">{d}</p>
                  </li>
                ))}
              </ul>
            )}

            {isBundle && (
              <div className="mt-10">
                <h2 className="text-xl text-bone">The three programs</h2>
                <div className="mt-5 grid gap-6 sm:grid-cols-3">
                  {BUNDLE.contains.map((s) => {
                    const g = GUIDES.find((x) => x.slug === s);
                    return g ? <GuideCard key={s} guide={g} /> : null;
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Buy panel. Sticky on desktop, because the price should be reachable from
              anywhere on a long page rather than only from the top of it. */}
          <aside className="reveal lg:sticky lg:top-24 lg:self-start">
            <div className="card p-7">
              <p className="font-display text-4xl font-extrabold text-bone">{money(guide.price)}</p>
              {isBundle && (
                <p className="mt-1 text-sm text-muted">
                  <s>{money(bundleSeparately())}</s> bought separately
                </p>
              )}
              <ul className="mt-6 space-y-2.5 border-t border-line pt-6 text-sm text-muted">
                {guide.includes.map((i) => (
                  <li key={i} className="flex gap-2.5">
                    <span aria-hidden className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-ember" />
                    <span>{i}</span>
                  </li>
                ))}
                <li className="flex gap-2.5">
                  <span aria-hidden className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-ember" />
                  <span>Bought once. Yours to keep.</span>
                </li>
              </ul>

              {guide.buyUrl ? (
                <a href={guide.buyUrl} className="btn-primary mt-7 w-full">
                  Buy {guide.name}
                </a>
              ) : (
                <div className="mt-7 border-t border-line pt-7">
                  {/* No checkout, and the page says why rather than showing a button that
                      does nothing. Put a product URL in `buyUrl` and this whole block is
                      replaced by a real buy button. */}
                  <p className="text-sm font-semibold text-bone">Request it</p>
                  <p className="mt-2 text-xs leading-relaxed text-muted">
                    Checkout is not wired up on this build. Leave your details and we send
                    the invoice and the download.
                  </p>
                  <MiniForm
                    className="mt-4"
                    action={requestGuide}
                    hidden={{ guide: guide.name }}
                    fields={[
                      { id: "name", label: "Name", required: true },
                      { id: "email", label: "Email", type: "email", required: true },
                    ]}
                    submit={`Request ${money(guide.price)}`}
                  />
                </div>
              )}
            </div>

            <div className="card mt-6 p-6">
              <p className="eyebrow">Not sure yet?</p>
              <p className="mt-3 text-sm leading-relaxed text-muted">
                If something is wrong in the room right now, a 30-minute triage call is the
                faster route than reading a program.
              </p>
              <Link href="/consulting#book" className="btn-ghost mt-5 w-full">
                Book a triage call
              </Link>
            </div>
          </aside>
        </div>
      </section>

      <section className="wrap mt-24 sm:mt-32">
        <h2 className="reveal text-2xl text-bone">What growers said</h2>
        <div className="reveal mt-6 grid gap-6 md:grid-cols-3">
          {REVIEWS.slice(0, 3).map((r, i) => (
            <ReviewCard key={i} quote={r.quote} who={r.who} context={r.context} />
          ))}
        </div>
      </section>

      {others.length > 0 && (
        <section className="wrap mt-24 sm:mt-32">
          <h2 className="reveal text-2xl text-bone">Also available</h2>
          <div className="reveal mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {others.map((g) => (
              <GuideCard key={g.slug} guide={g} />
            ))}
          </div>
        </section>
      )}
    </>
  );
}
