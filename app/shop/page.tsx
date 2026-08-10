import type { Metadata } from "next";
import Link from "next/link";
import MiniForm from "@/components/MiniForm";
import { notifyRestock } from "@/app/actions";
import { MERCH, money } from "@/lib/site";

export const metadata: Metadata = {
  title: "Merch",
  description:
    "MI Gas hoodies, tees and the camo trucker. Everything is currently between runs — join the list to hear about the restock first.",
};

/**
 * The store, told the truth.
 *
 * Every one of the seven items on the live store is sold out, and a storefront whose only
 * message is "sold out" costs trust on every visit — the visitor discovers it item by
 * item, seven times. Saying it once at the top and taking an email instead turns a dead
 * page into a mailing list. The grid stays, because the designs are the reason somebody
 * would want the email.
 */
export default function Shop() {
  const soldOut = MERCH.filter((m) => m.soldOut);
  const allOut = soldOut.length === MERCH.length;

  return (
    <>
      <section className="wrap pt-14 sm:pt-20">
        <div className="reveal max-w-3xl">
          <p className="eyebrow">Merch</p>
          <h1 className="mt-5 text-[2.4rem] leading-[1.05] sm:text-6xl">
            Between <span className="text-gas">runs</span>.
          </h1>
          <p className="mt-6 text-lg leading-relaxed text-bone/85">
            {allOut
              ? `All ${MERCH.length} designs are out of stock right now. Rather than let you find that out one product at a time, here it is up front — and here is how to hear about the restock before it sells through again.`
              : `${MERCH.length - soldOut.length} of ${MERCH.length} designs are in stock.`}
          </p>
        </div>

        <div className="reveal mt-10 max-w-xl rounded-xl2 border border-gas/40 bg-ink-panel p-7">
          <p className="eyebrow">Restock list</p>
          <h2 className="mt-3 text-xl text-bone">Hear about the drop first.</h2>
          <MiniForm
            className="mt-5"
            action={notifyRestock}
            fields={[{ id: "email", label: "Email", type: "email", required: true }]}
            submit="Notify me"
            note="One email when there is stock. Nothing else."
          />
        </div>
      </section>

      <section className="wrap mt-20">
        <h2 className="reveal text-2xl text-bone">The designs</h2>
        <ul className="reveal mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {MERCH.map((m) => (
            <li key={m.name} className="card flex flex-col overflow-hidden">
              {/* No product photography exists in this build, so the tile is typographic
                  rather than a grey box with a broken-image icon in it. When his product
                  shots arrive they drop straight in here. */}
              <div className="relative flex aspect-[4/3] items-center justify-center border-b border-line bg-ink px-6">
                <span
                  aria-hidden
                  className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_50%_at_50%_0%,rgba(124,224,75,0.10),transparent_70%)]"
                />
                <span className="relative text-center font-display text-2xl font-extrabold uppercase leading-tight tracking-tight text-bone/70">
                  {m.kind}
                </span>
                {m.soldOut && (
                  <span className="absolute right-4 top-4 rounded-full border border-edge bg-ink px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-muted">
                    Sold out
                  </span>
                )}
              </div>
              <div className="flex flex-1 items-start justify-between gap-4 p-5">
                <h3 className="text-[15px] leading-snug text-bone">{m.name}</h3>
                <span className="shrink-0 font-display font-bold text-muted">{money(m.price)}</span>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="wrap mt-24 sm:mt-32">
        <div className="reveal flex flex-col gap-6 rounded-xl2 border border-line bg-ink-panel p-7 sm:flex-row sm:items-center sm:justify-between sm:p-9">
          <div className="max-w-xl">
            <h2 className="text-2xl text-bone">Here for the growing, not the hoodie?</h2>
            <p className="mt-3 text-[15px] leading-relaxed text-muted">
              The programs never sell out.
            </p>
          </div>
          <Link href="/guides" className="btn-primary shrink-0">
            See the programs
          </Link>
        </div>
      </section>
    </>
  );
}
