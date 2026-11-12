import type { Metadata } from "next";
import Link from "next/link";
import MiniForm from "@/components/MiniForm";
import { sendMessage } from "@/app/actions";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Connect",
  description:
    "Send MI Gas a question, or find us on Patreon and Instagram.",
};

/**
 * The fix for the biggest single fault on the live site.
 *
 * Right now the only route to him is an Instagram DM. Every enquiry — a licensed operator
 * wanting facility work, somebody asking whether a guide covers coco, and a bot — arrives
 * in the same inbox with no qualification, no record, and no way to tell them apart. This
 * page separates them: bookings go through /consulting where the intake does the
 * qualifying, and everything else comes here with a topic attached.
 */
const CHANNELS = [
  {
    name: "Patreon",
    href: SITE.patreon,
    label: "The guides and the back catalog of posts.",
  },
  {
    name: "Instagram",
    href: SITE.instagram,
    // Worth knowing and easy to lose: his own site links the lowercase handle, which
    // 403s. The capital M is the working one, and it lives in lib/site.ts.
    label: "Photos from our rooms, run after run.",
  },
];

export default function Connect() {
  const emailReady = !SITE.email.startsWith("PLACEHOLDER");

  return (
    <>
      <section className="wrap pt-14 sm:pt-20">
        <div className="reveal max-w-3xl">
          <p className="eyebrow">Connect</p>
          <h1 className="mt-5 text-[2.4rem] leading-[1.05] sm:text-6xl">
            Send us a <span className="text-flare">question</span>
          </h1>
          <p className="mt-6 text-lg leading-relaxed text-bone/85">
            To book a call, use the{" "}
            <Link href="/consulting#book" className="text-flare hover:underline">
              consulting page
            </Link>
            , since the booking form has the room questions. For anything else, this form
            comes straight to us.
          </p>
        </div>
      </section>

      <section className="wrap mt-14 grid gap-12 lg:grid-cols-[1.15fr_minmax(0,0.85fr)] lg:gap-16">
        <div className="reveal">
          <div className="card p-7 sm:p-9">
            <h2 className="text-2xl text-bone">Ask a question</h2>
            <p className="mt-3 text-[15px] leading-relaxed text-muted">
              Adding a topic helps us answer faster, for example &ldquo;Does the veg guide
              cover coco?&rdquo;
            </p>
            <MiniForm
              className="mt-7"
              action={sendMessage}
              columns={2}
              fields={[
                { id: "name", label: "Name", required: true },
                { id: "email", label: "Email", type: "email", required: true },
                { id: "topic", label: "Topic", placeholder: "Consulting, co-management, the Patreon…", wide: true },
                {
                  id: "message",
                  label: "What do you need?",
                  type: "textarea",
                  placeholder: "Numbers and photos of the room help.",
                  required: true,
                  wide: true,
                },
              ]}
              submit="Send"
              note="It goes to the same inbox as bookings. We won't add you to a mailing list."
            />
          </div>
        </div>

        <div className="reveal">
          <h2 className="text-2xl text-bone">Elsewhere</h2>
          <ul className="mt-6 grid gap-4">
            {CHANNELS.map((c) => (
              <li key={c.name}>
                <a
                  href={c.href}
                  className="card group flex items-start justify-between gap-5 p-6 transition-colors hover:border-edge"
                >
                  <span>
                    <span className="block font-display text-lg font-bold text-bone">{c.name}</span>
                    <span className="mt-1.5 block text-sm leading-relaxed text-muted">{c.label}</span>
                  </span>
                  <span aria-hidden className="mt-1 shrink-0 text-muted group-hover:text-flare">
                    &rarr;
                  </span>
                </a>
              </li>
            ))}
          </ul>

          <div className="card mt-4 p-6">
            <p className="eyebrow">Email</p>
            {emailReady ? (
              <a href={`mailto:${SITE.email}`} className="mt-3 block text-lg text-bone hover:text-flare">
                {SITE.email}
              </a>
            ) : (
              /* Rendered rather than hidden, because an absent email address is the single
                 biggest fault on the live site and this page should say so out loud rather
                 than quietly omit the field. */
              <p className="mt-3 text-sm leading-relaxed text-muted">
                There&rsquo;s no email address on the site yet. Growers who won&rsquo;t DM a
                stranger have no other way to reach you, so this is the first thing to fix. Send us
                the address and this turns into a link.
              </p>
            )}
          </div>

          {SITE.phone && (
            <div className="card mt-4 p-6">
              <p className="eyebrow">Phone</p>
              <a href={`tel:${SITE.phone}`} className="mt-3 block text-lg text-bone hover:text-flare">
                {SITE.phone}
              </a>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
