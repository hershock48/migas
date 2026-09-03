import type { Metadata } from "next";
import AgreementAccept from "@/components/AgreementAccept";
import { agreement, money } from "@/lib/agreement";

/**
 * The custom-order acceptance page, linked from the proposal's "Say yes or say no"
 * step. Ported from the Anchor order, which ported it from DeVine's.
 *
 * SHAPE: the general terms are NOT restated here. They are the published glazedweb
 * Client Agreement v1.1, linked and incorporated by reference, exactly the way the
 * glazedweb menu-order clickwrap works. What this page adds is the part the master
 * leaves blank: Exhibit A with MI Gas's scope and numbers, and the acceptance itself.
 * Where Anchor's page carries online-payment terms, this one carries a paragraph
 * saying no money moves through the site, because none does.
 *
 * Numbers come from lib/agreement.ts, never typed here. The proposal repeats the two
 * headline numbers in prose and is named there as a surface that cannot read the
 * constant.
 *
 * Inside the site's own chrome on purpose: he is reading his own site's deal, on his
 * own site. Not in the nav, not linked from anywhere but the proposal.
 */

export const metadata: Metadata = {
  title: "Agreement",
  description: "The custom-order agreement for MI Gas: scope, pricing, and acceptance.",
  // Its own noindex, deliberately redundant with the site-wide one: the site-wide pair
  // comes off on launch day and this page must stay out of the index after.
  robots: { index: false, follow: false },
};

const TERMS: { label: string; body: React.ReactNode }[] = [
  {
    label: "Build fee",
    body: (
      <>
        {money(agreement.buildFee)}, one time, as proposed. A deposit of {money(agreement.deposit)} is
        due on acceptance and credited against it; the balance of{" "}
        {money(agreement.buildFee - agreement.deposit)} is due on launch. Invoiced separately;
        nothing is owed until the invoice arrives.
      </>
    ),
  },
  {
    label: "Monthly service fee",
    body: (
      <>
        {money(agreement.monthly)} per month from the first of the month after launch. Hosting, SSL,
        security updates, backups, domain renewal, and the availability editor. There is no
        separate platform, per-booking, or per-visitor charge.
      </>
    ),
  },
  {
    label: "Included edits",
    body: (
      <>
        Up to {agreement.editAllowance} of minor content edits: a price, a FAQ answer, a new
        review, copy. Your hours, days off and lead time you change yourself at /admin, which
        does not count against this.
      </>
    ),
  },
  {
    label: "Beyond scope",
    body: (
      <>
        {money(agreement.hourlyRate)} per hour, always quoted and approved by you in writing
        before any work starts. Nothing lands on a bill unannounced.
      </>
    ),
  },
  {
    label: "Payments",
    body: <>None through the site, so no payment terms apply. Part 3 below says why.</>,
  },
  { label: "Timeline", body: <>{agreement.timeline}</> },
];

export default function AgreementPage() {
  return (
    <>
      <section className="wrap pt-14 sm:pt-20">
        <div className="max-w-3xl">
          <p className="eyebrow">glazedweb × {agreement.client}</p>
          <h1 className="mt-5 text-[2.4rem] leading-[1.05] sm:text-5xl">
            The agreement, in <span className="text-flare">plain English</span>.
          </h1>
          <p className="mt-6 text-lg leading-relaxed text-bone/85">
            Two documents make the whole deal, and both are on this page or one tap from it. The
            first is the{" "}
            <a href={agreement.termsUrl} target="_blank" rel="noopener noreferrer" className="text-flare hover:underline">
              glazedweb Client Agreement v1.1
            </a>
            , the same published terms every glazedweb client gets: you own the site outright when
            the build fee is paid, month to month after launch, thirty days&rsquo; notice, no
            penalty, Michigan law. There is also a{" "}
            <a href={agreement.pdfUrl} target="_blank" rel="noopener noreferrer" className="text-flare hover:underline">
              PDF copy
            </a>{" "}
            to keep. The second is the Exhibit A below, which fills in what gets built for you and
            what it costs. Accepting at the bottom accepts both together.
          </p>
          <p className="mt-4 text-[15px] text-muted">
            If anything is unclear, ask before accepting: kevin@glazedweb.com or a text.
          </p>
        </div>
      </section>

      <article className="wrap mt-16 max-w-3xl sm:mt-20">
        <h2 className="border-t border-line pt-6 text-2xl text-bone sm:text-3xl">Exhibit A, part 1: what is built</h2>
        <p className="mt-4 text-[15px] leading-relaxed text-muted">
          Custom Order. Prepared for {agreement.clientLegal}, {agreement.clientRegion}. The site is
          built and reviewable now at {agreement.demo}; it publishes at {agreement.domain}.
        </p>
        <ol className="mt-6 list-decimal space-y-4 pl-6 text-[15px] leading-relaxed text-bone/90 marker:font-semibold marker:text-flare">
          {agreement.scope.map((s) => (
            <li key={s.slice(0, 40)} className="pl-1">
              {s}
            </li>
          ))}
        </ol>
        <p className="mt-6 text-[15px] leading-relaxed text-bone/90">
          <strong className="text-bone">Not included</strong>, and quoted separately if wanted:{" "}
          {agreement.notIncluded}
        </p>

        <h2 className="mt-16 border-t border-line pt-6 text-2xl text-bone sm:text-3xl">Exhibit A, part 2: what it costs</h2>
        <dl className="mt-4">
          {TERMS.map((t) => (
            <div key={t.label} className="grid gap-1 border-b border-line py-4 sm:grid-cols-[11rem_1fr] sm:gap-6">
              <dt className="font-semibold text-bone">{t.label}</dt>
              <dd className="text-[15px] leading-relaxed text-bone/90">{t.body}</dd>
            </div>
          ))}
        </dl>

        <h2 className="mt-16 border-t border-line pt-6 text-2xl text-bone sm:text-3xl">Exhibit A, part 3: money, and the site</h2>
        <p className="mt-4 text-[15px] leading-relaxed text-bone/90">{agreement.noPayments}</p>

        <h2 className="mt-16 border-t border-line pt-6 text-2xl text-bone sm:text-3xl">Accept</h2>
        <p className="mt-4 text-[15px] leading-relaxed text-bone/90">
          Typing your name and checking the box forms the agreement, the same way checking out
          online forms one. You will get a copy of the signed record by email, and so will we. That
          email records the version, the scope, the numbers, your name, and the time.
        </p>
        <div className="mt-6">
          <AgreementAccept business={agreement.client} />
        </div>

        <p className="mt-12 text-[15px] text-muted">
          {agreement.provider} · Kevin Hershock · Marshall, Michigan · kevin@glazedweb.com ·{" "}
          {agreement.version}
        </p>
      </article>
    </>
  );
}
