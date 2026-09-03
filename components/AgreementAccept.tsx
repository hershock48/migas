"use client";

import { useActionState } from "react";
import { EMPTY_ACCEPT } from "@/lib/agreement";
import { acceptAgreement } from "@/app/agreement/actions";

/**
 * The acceptance form. Clickwrap: type the name, tick the box, one button. Ported from
 * the Anchor and DeVine orders, rebuilt on useActionState so it posts natively with
 * JavaScript off, like every other form on this site.
 *
 * THE FAILURE PATHS TELL THE TRUTH. "fallback" hands the visitor a prefilled mailto
 * carrying the server's own record text, so the acceptance can still reach a person
 * when mail plumbing cannot send it. Until SMTP is set on this project that is the
 * path every acceptance takes, and the README says so.
 *
 * `aria-required` rather than `required`, for the reason every form here uses it:
 * validation that matters lives in the action, and the browser's own blocking of a
 * submit is a failure nobody can see.
 */

const MAILTO = "kevin@glazedweb.com";

export default function AgreementAccept({ business }: { business: string }) {
  const [state, formAction, pending] = useActionState(acceptAgreement, EMPTY_ACCEPT);

  if (state.status === "sent") {
    return (
      <div className="card border-ember/60 bg-ember/[0.07] p-7" role="status">
        <p className="eyebrow">Accepted</p>
        <h3 className="mt-3 text-2xl text-bone">Welcome aboard.</h3>
        <p className="mt-3 text-[15px] leading-relaxed text-bone/85">
          A copy of the signed record is on its way to your email, and to ours. The deposit
          invoice follows separately, and nothing is due until it does.
        </p>
      </div>
    );
  }

  if (state.status === "fallback") {
    const biz = state.values?.business ?? business;
    const href = `mailto:${MAILTO}?subject=${encodeURIComponent("Agreement acceptance, " + biz)}&body=${encodeURIComponent(state.record ?? "")}`;
    return (
      <div className="card border-ember/60 bg-ember/[0.07] p-7" role="status">
        <p className="eyebrow">One more tap</p>
        <h3 className="mt-3 text-2xl text-bone">Deliver the signed record.</h3>
        <p className="mt-3 text-[15px] leading-relaxed text-bone/85">
          Your acceptance was recorded on our server, but the confirmation email could not be
          sent from here right now. Tap the button below and hit send; it carries the exact
          record, so both of us have the copy that matters.
        </p>
        <a className="btn-primary mt-5" href={href}>
          Email the signed record
        </a>
      </div>
    );
  }

  const v = state.values ?? {};

  return (
    <form action={formAction} noValidate className="card p-7 sm:p-9">
      <div aria-hidden className="absolute h-0 w-0 overflow-hidden">
        <label htmlFor="trap-agreement">Leave blank</label>
        <input id="trap-agreement" type="text" name="_trap" tabIndex={-1} autoComplete="off" />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="agr-name" className="block text-sm font-semibold text-bone">
            Your full name
          </label>
          <input id="agr-name" name="name" type="text" defaultValue={v.name ?? ""} aria-required autoComplete="name" maxLength={120} className="field mt-2" />
        </div>
        <div>
          <label htmlFor="agr-title" className="block text-sm font-semibold text-bone">
            Title <span className="ml-2 font-normal text-muted">optional; Owner, for example</span>
          </label>
          <input id="agr-title" name="title" type="text" defaultValue={v.title ?? ""} autoComplete="organization-title" maxLength={120} className="field mt-2" />
        </div>
        <div>
          <label htmlFor="agr-business" className="block text-sm font-semibold text-bone">
            Business name
          </label>
          <input id="agr-business" name="business" type="text" defaultValue={v.business ?? business} aria-required autoComplete="organization" maxLength={160} className="field mt-2" />
        </div>
        <div>
          <label htmlFor="agr-email" className="block text-sm font-semibold text-bone">
            Email <span className="ml-2 font-normal text-muted">your signed copy goes here</span>
          </label>
          <input id="agr-email" name="email" type="email" defaultValue={v.email ?? ""} aria-required autoComplete="email" maxLength={200} className="field mt-2" />
        </div>
      </div>

      <label className="mt-6 grid grid-cols-[auto_1fr] items-start gap-3 text-[15px] leading-relaxed text-bone">
        <input type="checkbox" name="agreed" aria-required className="mt-1 h-5 w-5 cursor-pointer accent-ember" />
        <span>
          I have read the glazedweb Client Agreement v1.1 and the Exhibit A above, and I accept
          both on behalf of the business named here.
        </span>
      </label>

      {state.status === "error" && state.error && (
        <p role="alert" className="mt-4 text-sm font-semibold text-alert">
          {state.error}
        </p>
      )}

      <button type="submit" disabled={pending} className="btn-primary mt-6 disabled:opacity-60">
        {pending ? "Recording…" : "Accept the agreement"}
      </button>
    </form>
  );
}
