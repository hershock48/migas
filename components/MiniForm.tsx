"use client";

import { useActionState } from "react";
import { EMPTY, type FormState } from "@/lib/forms";

/**
 * One small form. It served three surfaces until the 2026-08-27 owner call retired
 * the restock list and the guide request; the question form on /connect remains.
 *
 * It is a component rather than a page-local form because the interesting
 * behaviour is shared and easy to get wrong in one copy and not the others: native
 * submission when JavaScript is absent (the server action handles the POST either way),
 * errors announced rather than merely coloured, and a success state that replaces the
 * form instead of sitting above a form the visitor might submit twice.
 *
 * `required` here means `aria-required`, deliberately. The native attribute is avoided
 * across this build because a required control inside a hidden container cannot be
 * focused, and the browser then refuses to submit while logging the reason to a console
 * nobody has open. Validation that matters lives in the action.
 */

export type MiniField = {
  id: string;
  label: string;
  type?: "text" | "email" | "tel" | "textarea";
  placeholder?: string;
  required?: boolean;
  /** Full-width in a two-column grid. */
  wide?: boolean;
};

export default function MiniForm({
  action,
  fields,
  submit,
  note,
  hidden,
  columns = 1,
  className = "",
}: {
  action: (prev: FormState, fd: FormData) => Promise<FormState>;
  fields: MiniField[];
  submit: string;
  note?: string;
  hidden?: Record<string, string>;
  columns?: 1 | 2;
  className?: string;
}) {
  const [state, formAction, pending] = useActionState(action, EMPTY);

  if (state.status === "done") {
    return (
      <div className={`rounded-xl2 border border-ember/60 bg-ember/[0.07] p-6 ${className}`} aria-live="polite">
        <p className="eyebrow">Done</p>
        <p className="mt-3 text-[15px] leading-relaxed text-bone">
          {state.summary?.[0] ?? "Sent. We will be in touch."}
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} noValidate className={className}>
      <div aria-hidden className="absolute h-0 w-0 overflow-hidden">
        <label htmlFor={`trap-${fields[0].id}`}>Leave blank</label>
        <input id={`trap-${fields[0].id}`} type="text" name="_trap" tabIndex={-1} autoComplete="off" />
      </div>
      {hidden &&
        Object.entries(hidden).map(([k, v]) => <input key={k} type="hidden" name={k} value={v} />)}

      <div className={`grid gap-4 ${columns === 2 ? "sm:grid-cols-2" : ""}`}>
        {fields.map((f) => (
          <div key={f.id} className={f.wide && columns === 2 ? "sm:col-span-2" : ""}>
            <label htmlFor={f.id} className="block text-sm font-semibold text-bone">
              {f.label}
              {!f.required && <span className="ml-2 font-normal text-muted">optional</span>}
            </label>
            {f.type === "textarea" ? (
              <textarea
                id={f.id}
                name={f.id}
                rows={5}
                placeholder={f.placeholder}
                defaultValue={state.values?.[f.id] ?? ""}
                aria-required={f.required}
                aria-invalid={!!state.errors?.[f.id]}
                className="field mt-2 resize-y"
              />
            ) : (
              <input
                id={f.id}
                name={f.id}
                type={f.type ?? "text"}
                placeholder={f.placeholder}
                defaultValue={state.values?.[f.id] ?? ""}
                aria-required={f.required}
                aria-invalid={!!state.errors?.[f.id]}
                className="field mt-2"
              />
            )}
            {state.errors?.[f.id] && (
              <p role="alert" className="mt-2 text-sm text-alert">
                {state.errors[f.id]}
              </p>
            )}
          </div>
        ))}
      </div>

      <button type="submit" disabled={pending} className="btn-primary mt-5 disabled:opacity-60">
        {pending ? "Sending…" : submit}
      </button>
      {note && <p className="mt-4 max-w-xl text-xs leading-relaxed text-muted">{note}</p>}
    </form>
  );
}
