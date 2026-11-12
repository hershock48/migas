import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import Booking from "@/components/Booking";
import Faq from "@/components/Faq";
import MiniForm from "@/components/MiniForm";
import { requestCall } from "@/app/actions";
import { AVAILABILITY, CONSULT_TOPICS, FAQ, HAVE_READY, PROCESS, SESSIONS, money } from "@/lib/site";
import { openSlots } from "@/lib/availability";
import { payConfigured } from "@/lib/pay";
import roomAisle from "@/public/assets/rooms/flower-aisle.webp";

export const metadata: Metadata = {
  title: "Consulting",
  description:
    "Book a cultivation consult: a half hour at $250 or a full hour at $400. You fill in a short profile of your room first, and we read it ahead of time.",
};

/**
 * PER REQUEST, AND IT HAS TO BE. This said "slots are generated per request, not at
 * build, or the calendar would be frozen on the day of the deploy" — the right intent
 * against the wrong directive. `revalidate = 3600` does not render per request. It
 * prerenders at BUILD time and then regenerates at most hourly, and regeneration is
 * triggered BY a request: the visitor who arrives after a quiet spell is served the old
 * HTML and only kicks off the rebuild for whoever comes next. On a site with steady
 * traffic that is an hour of staleness. On a brand-new consultancy site with none, the
 * cached page ages until something asks for it, and Next's default `expire` is a year.
 *
 * That matters here because the slot values are baked into the HTML as radio inputs and
 * the server action re-validates them against the real clock. Stale HTML therefore
 * offers times the server will refuse. Measured against the real slotGrid, taking a page
 * built on a Monday and re-validating every slot in it:
 *
 *     +1 day    6 of 72 slots rejected
 *     +7 days  36 of 72
 *   +14 days  72 of 72 — every time the page offers is refused, the form is dead
 *
 * and the visitor's only feedback is "That time is no longer open. Pick another." on
 * every single alternative, with a reload serving the same stale page. Nothing logs it.
 *
 * So: dynamic. The page reads a config object and formats dates — there is no database
 * call to protect and nothing to gain from caching the result. Correctness over a cached
 * HTML document for a form that takes money.
 */
export const dynamic = "force-dynamic";

export default async function Consulting({
  searchParams,
}: {
  searchParams: Promise<{ paid?: string; unpaid?: string; session?: string }>;
}) {
  // Stored windows minus blocked dates minus his calendar. See lib/availability.ts;
  // the page stays force-dynamic for the same reason it always was, plus one more:
  // the busy feed can change between any two requests.
  const days = await openSlots();
  // Back from the payment page. Only the reference is echoed, and only its shape.
  const sp = await searchParams;
  const refOf = (v?: string) => (v && /^MG-[A-Z0-9]{6}$/.test(v) ? v : null);
  const paid = refOf(sp.paid);
  const unpaid = refOf(sp.unpaid);
  // A session chosen on the link that brought them here (the home page's price cards).
  // Only a real slug gets through; anything else opens the wizard at step 1 as before.
  const initialSession = SESSIONS.some((s) => s.slug === sp.session) ? sp.session : undefined;
  const cardPayment = payConfigured();

  return (
    <>
      <section className="wrap pt-14 sm:pt-20">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:items-center lg:gap-16">
          <div className="reveal">
            <p className="eyebrow">Consulting</p>
            <h1 className="mt-5 text-[2.4rem] leading-[1.05] sm:text-6xl">
              Talk through your room <span className="text-flare">with us</span>
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-bone/85">
              When you book, you fill in a short profile of your room, with the stage,
              canopy, media, feed, lights and runoff, and add a few photos. We read it ahead
              of time, so you don&rsquo;t spend the call answering setup questions.
            </p>
            {/* What a call is for, in his words from the 2026-11-04 email. It had its own
                section further down, under a pair of price cards that repeated step 1 of
                the form. Here it answers "is this for me" before the visitor scrolls. */}
            <ul className="mt-6 grid max-w-2xl gap-x-6 gap-y-2 sm:grid-cols-2">
              {CONSULT_TOPICS.map((t) => (
                <li key={t} className="flex gap-3 text-[15px] leading-snug text-bone/90">
                  <span className="dot mt-[7px] shrink-0 bg-flare" aria-hidden="true" />
                  {t}
                </li>
              ))}
            </ul>
            {/* Both prices beside the button, so nobody has to open the form to find out
                what it costs. Each one is a link that opens the form with that session
                already chosen. */}
            <div className="mt-9 flex flex-wrap items-center gap-x-6 gap-y-4">
              <Link href="#book" className="btn-primary">
                Book a call
              </Link>
              <p className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted">
                {SESSIONS.map((s) => (
                  <Link key={s.slug} href={`/consulting?session=${s.slug}#book`} className="py-1 hover:text-flare">
                    {s.name} <span className="font-semibold text-bone">{money(s.price)}</span>
                  </Link>
                ))}
              </p>
            </div>
          </div>
          {/* His room, beside the promise. Desktop only: on a phone it would put a screen of
              photograph between the visitor and the form, and the home page carries the
              pictures there. Lazy, so a phone that never shows it never downloads it. */}
          <div className="reveal hidden lg:block">
            <div className="overflow-hidden rounded-xl2 border border-line">
              <Image
                src={roomAisle}
                alt="A flower room late in flower, seen down the aisle, the canopy level under rows of LED light bars."
                sizes="(min-width: 1280px) 440px, 34vw"
                className="drift aspect-[4/5] h-auto w-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ── How it runs ──────────────────────────────────────────────────────── */}
      <section id="how" className="wrap mt-24 scroll-mt-24 sm:mt-32">
        <div className="reveal max-w-2xl">
          <p className="eyebrow">Before, during, after</p>
          <h2 className="mt-4 text-3xl sm:text-4xl">What happens around the call</h2>
        </div>
        <ol className="reveal mt-12 grid gap-px overflow-hidden rounded-xl2 border border-line bg-line md:grid-cols-3">
          {PROCESS.map((p, i) => (
            <li key={p.step} className="flex flex-col bg-ink-panel p-7">
              <p className="font-display text-sm font-bold uppercase tracking-[0.16em] text-flare">
                {String(i + 1).padStart(2, "0")} &middot; {p.step}
              </p>
              <h3 className="mt-4 text-xl leading-snug text-bone">{p.title}</h3>
              <p className="mt-3 text-[15px] leading-relaxed text-muted">{p.body}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* ── The booking flow ─────────────────────────────────────────────────
          The "Two lengths" section that sat here is gone: two price cards, each with a
          Book button, directly above a form whose first step is the same two choices with
          the same words. The cards' bullets moved into step 1, and the prices into the
          hero. One place to choose. */}
      <section id="book" className="wrap mt-24 scroll-mt-20 sm:mt-32">
        <div className="reveal max-w-2xl">
          <p className="eyebrow">Book</p>
          <h2 className="mt-4 text-3xl sm:text-4xl">Book a call</h2>
          <p className="mt-4 text-lg leading-relaxed text-muted">
            Pick a session, describe the room, pick a time, and tell us where to send the
            invite.
          </p>
        </div>
        <div className="mt-10 grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-start lg:gap-10">
          {/* WHAT TO HAVE READY, BESIDE THE FORM. It was the last section before the FAQ,
              after the form and after the callback box, so it reached people who had
              already booked. First in the source so a phone shows it above the form, as a
              closed disclosure that costs one line until somebody wants it; on a desktop
              it is an open card beside the form, moved to the right with order-last. The
              desktop card holds nothing focusable, so the visual order and the tab order
              never disagree. */}
          <aside className="reveal lg:sticky lg:top-24 lg:order-last">
            <details className="card group p-5 lg:hidden">
              <summary className="flex cursor-pointer list-none items-center gap-3 text-[15px] font-semibold text-bone [&::-webkit-details-marker]:hidden">
                Have these ready
                <span className="font-normal text-muted">{HAVE_READY.length} things</span>
                <svg aria-hidden viewBox="0 0 12 8" className="ml-auto h-2 w-3 text-muted transition-transform group-open:rotate-180">
                  <path d="M1 1.9 6 6.1 11 1.9" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </summary>
              <ReadyList />
            </details>
            <div className="card hidden p-6 lg:block">
              <p className="eyebrow">Checklist</p>
              <h3 className="mt-3 text-xl leading-snug text-bone">What to have ready</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted">
                The form asks for some of this. Have the rest handy for the call.
              </p>
              <ReadyList />
            </div>
          </aside>

          <div className="reveal min-w-0">
            {paid && (
              <p className="mb-8 rounded-xl2 border border-ember/60 bg-ink-panel px-6 py-5 text-[15px] text-bone" role="status">
                Paid, thank you. Booking <span className="font-display font-bold">{paid}</span> is held, the invite is on your
                calendar, and a reminder goes out the day before.
              </p>
            )}
            {unpaid && (
              <p className="mb-8 rounded-xl2 border border-line bg-ink-panel px-6 py-5 text-[15px] text-muted" role="status">
                Payment for booking <span className="font-display font-bold text-bone">{unpaid}</span> was not completed. The
                request is still with us; the link to pay is in your confirmation email.
              </p>
            )}
            {/* Keyed on the session so a link that changes it while the visitor is already
                on this page (the hero prices) remounts the wizard with the new choice.
                Same route, new search params: without the key React keeps the old state. */}
            <Booking key={initialSession ?? "open"} days={days} initialSession={initialSession} cardPayment={cardPayment} />
            {/* The two prices are his, from the 2026-11-04 email. What is still ours: the
                lines under each session in step 1, which used to be bullets on price cards. */}
            <div className="mt-6 rounded-xl2 border border-dashed border-edge/70 bg-ink-panel/40 p-5">
              <p className="eyebrow">One thing to confirm</p>
              <p className="mt-2 text-[15px] leading-relaxed text-muted">
                The prices are yours. The lines under each session (written actions after the call, the follow-up
                thread) are still our draft of what a session includes. Please confirm them or cut them, since each one
                is something you&rsquo;d be promising.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── The light path ───────────────────────────────────────────────────
          From Kevin's call notes: "in addition to the calendly link - just capturing
          random calls." The intake above is the fast lane for somebody who knows
          their room; this is for somebody who does not know what they need yet, and
          the wording has to hold both without talking down to either. Three fields,
          one skippable, no intake. */}
      <section id="call" className="wrap mt-24 scroll-mt-24 sm:mt-32">
        <div className="reveal grid gap-10 rounded-xl2 border border-line bg-ink-panel p-7 sm:p-10 lg:grid-cols-[1fr_1fr] lg:gap-16">
          <div>
            <p className="eyebrow">Call back</p>
            <h2 className="mt-4 text-2xl sm:text-3xl">Talk to us before you book</h2>
            <p className="mt-4 text-[15px] leading-relaxed text-muted">
              If you&rsquo;re not sure what you need yet, or you&rsquo;d rather talk to
              someone first, leave a number or an email and we&rsquo;ll call you.
              There&rsquo;s nothing to fill in, and if a paid call makes sense we&rsquo;ll
              tell you on the phone.
            </p>
          </div>
          <MiniForm
            action={requestCall}
            fields={[
              { id: "name", label: "Name", required: true },
              /* Either one is required, so neither says "optional". It did, and the
                 form then refused to send with both blank; the rule was only in the
                 small print under the button. */
              { id: "phone", label: "Phone", type: "tel", required: false, tag: null, hint: "Phone or email, either one works." },
              { id: "email", label: "Email", type: "email", required: false, tag: null },
              {
                id: "about",
                label: "What is it about?",
                type: "textarea",
                placeholder: "A sentence is plenty. Blank is fine too.",
                required: false,
              },
            ]}
            submit="Have us call you"
            note="It goes to the same inbox as bookings."
          />
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────────────────────── */}
      <section className="wrap mt-24 sm:mt-32">
        <div className="reveal max-w-2xl">
          <p className="eyebrow">Before you ask</p>
          <h2 className="mt-4 text-3xl sm:text-4xl">Questions we get asked</h2>
        </div>
        {/* The draft-vs-answered rendering moved to components/Faq.tsx, reasoning
            included, the day /co-management grew its own question list. */}
        {/* "How do I pay?" has two true answers, and which one depends on whether the
            card step is on. The visitor gets the one that is true today. */}
        <Faq items={FAQ.map((f) => ({ q: f.q, a: (!cardPayment && "aInvoice" in f && f.aInvoice) || f.a }))} />
        <p className="reveal mt-8 text-sm text-muted">
          All times on the site are {AVAILABILITY.timeZoneLabel}. If your question
          isn&rsquo;t here,{" "}
          <Link href="/connect" className="text-flare hover:underline">
            send it to us
          </Link>
          .
        </p>
      </section>
    </>
  );
}

/** The checklist, once, for both the phone disclosure and the desktop card. */
function ReadyList() {
  return (
    <ul className="mt-4 grid gap-3 text-sm">
      {HAVE_READY.map((line) => (
        <li key={line} className="flex gap-3 border-t border-line pt-3">
          <span aria-hidden className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-ember" />
          <span className="leading-relaxed text-bone/90">{line}</span>
        </li>
      ))}
    </ul>
  );
}
