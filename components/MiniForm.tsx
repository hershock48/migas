"use client";

import { useActionState, useEffect, useRef } from "react";
import { EMPTY, type FormState } from "@/lib/forms";
import { scrollBehavior } from "@/lib/scroll";

/* Autofill tokens by field id, so a phone offers the visitor's own name, email and
   number instead of a blank keyboard. The booking wizard already set these; the three
   small forms did not. */
const AUTOFILL: Record<string, string> = {
  name: "name",
  email: "email",
  phone: "tel",
  facility: "organization",
};

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
  type?: "text" | "email" | "tel" | "textarea" | "select";
  placeholder?: string;
  /** Guidance shown under the label and tied to the control with aria-describedby.
   *  Use it when the text is information rather than an example, or longer than the
   *  field: a placeholder is cut off at the field's edge and gone at the first key. */
  hint?: string;
  /** For type "select". Rendered with an empty first option so "no answer" posts
   *  as empty and the server's required check still means something. */
  options?: readonly string[];
  required?: boolean;
  /** Overrides the "optional" beside the label of a field that is not required;
   *  null shows nothing. For a pair where either one will do, "optional" on both
   *  read as "neither is needed" and the form then refused to send. */
  tag?: string | null;
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
  fields: readonly MiniField[];
  submit: string;
  note?: string;
  hidden?: Record<string, string>;
  columns?: 1 | 2;
  className?: string;
}) {
  const [state, formAction, pending] = useActionState(action, EMPTY);
  const formRef = useRef<HTMLFormElement>(null);
  const doneRef = useRef<HTMLDivElement>(null);

  /* Both results used to happen off screen on a phone (measured 2026-11-11 at 390px).
     A rejected submit put its messages above the fold while the visitor was still
     looking at the button: the co-management application's first error rendered 722px
     above the viewport, and focus fell back to <body> when the button re-enabled. So
     the first field with a problem now takes focus and comes into view. */
  useEffect(() => {
    if (state.status !== "error" || !state.errors) return;
    const first = fields.find((f) => state.errors?.[f.id]);
    const el = first && formRef.current?.querySelector<HTMLElement>(`[name="${first.id}"]`);
    if (!el) return;
    el.focus({ preventScroll: true });
    el.scrollIntoView({ block: "center", behavior: scrollBehavior() });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  /* A sent form is replaced by this shorter panel, so the page collapses under the
     visitor and the confirmation landed 138 to 864px above the viewport. They saw
     whatever came after the form and no sign that it went. The panel now takes focus,
     which also gets it read out (a live region that mounts with its content already
     inside is not announced). */
  useEffect(() => {
    if (state.status !== "done") return;
    doneRef.current?.focus({ preventScroll: true });
    doneRef.current?.scrollIntoView({ block: "center", behavior: scrollBehavior() });
  }, [state.status]);

  if (state.status === "done") {
    return (
      <div
        ref={doneRef}
        tabIndex={-1}
        className={`rounded-xl2 border border-ember/60 bg-ember/[0.07] p-6 ${className}`}
        aria-live="polite"
      >
        <p className="eyebrow">Done</p>
        {(state.summary?.length ? state.summary : ["Sent. We will be in touch."]).map((line) => (
          <p key={line} className="mt-3 text-[15px] leading-relaxed text-bone">
            {line}
          </p>
        ))}
        {state.reference && (
          <p className="mt-3 text-sm text-muted">
            Reference{" "}
            <span className="font-display font-bold text-bone">{state.reference}</span>. Quote
            it when you follow up.
          </p>
        )}
      </div>
    );
  }

  /* The hint and, after a rejected submit, the message: both are read when the field
     takes focus. role="alert" alone announces the message once, as it appears. */
  const describe = (f: MiniField) =>
    [f.hint && `${f.id}-hint`, state.errors?.[f.id] && `${f.id}-error`].filter(Boolean).join(" ") || undefined;

  return (
    <form ref={formRef} action={formAction} noValidate className={className}>
      <div aria-hidden className="absolute h-0 w-0 overflow-hidden">
        <label htmlFor={`trap-${fields[0].id}`}>Leave blank</label>
        <input id={`trap-${fields[0].id}`} type="text" name="_trap" tabIndex={-1} autoComplete="off" />
      </div>
      {hidden &&
        Object.entries(hidden).map(([k, v]) => <input key={k} type="hidden" name={k} value={v} />)}

      {/* Each field is three rows of the form's own grid (subgrid): label and hint,
          control, message. Side by side, the controls share a row, so a hint or a
          two-line label on one field no longer drops its input below its neighbor's
          (39px on the co-management application at 1440), and an error under one
          field leaves the other where it was. pb-4 does what gap-4 did. */}
      <div className={`grid ${columns === 2 ? "sm:grid-cols-2 sm:gap-x-4" : ""}`}>
        {fields.map((f) => (
          <div
            key={f.id}
            className={`row-span-3 grid grid-rows-subgrid pb-4 last:pb-0 ${f.wide && columns === 2 ? "sm:col-span-2" : ""}`}
          >
            <div className="self-end">
              <label htmlFor={f.id} className="block text-sm font-semibold text-bone">
                {f.label}
                {!f.required && f.tag !== null && (
                  <span className="ml-2 font-normal text-muted">{f.tag ?? "optional"}</span>
                )}
              </label>
              {f.hint && (
                <p id={`${f.id}-hint`} className="mt-1 text-[13px] leading-snug text-muted">
                  {f.hint}
                </p>
              )}
            </div>
            {f.type === "textarea" ? (
              <textarea
                id={f.id}
                name={f.id}
                rows={5}
                placeholder={f.placeholder}
                defaultValue={state.values?.[f.id] ?? ""}
                aria-required={f.required}
                aria-invalid={!!state.errors?.[f.id]}
                aria-describedby={describe(f)}
                className="field mt-2 resize-y"
              />
            ) : f.type === "select" ? (
              <select
                id={f.id}
                name={f.id}
                defaultValue={state.values?.[f.id] ?? ""}
                aria-required={f.required}
                aria-invalid={!!state.errors?.[f.id]}
                aria-describedby={describe(f)}
                className="field mt-2"
              >
                <option value="">Choose…</option>
                {(f.options ?? []).map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </select>
            ) : (
              <input
                id={f.id}
                name={f.id}
                type={f.type ?? "text"}
                autoComplete={AUTOFILL[f.id]}
                placeholder={f.placeholder}
                defaultValue={state.values?.[f.id] ?? ""}
                aria-required={f.required}
                aria-invalid={!!state.errors?.[f.id]}
                aria-describedby={describe(f)}
                className="field mt-2"
              />
            )}
            {state.errors?.[f.id] && (
              <p id={`${f.id}-error`} role="alert" className="mt-2 text-sm text-alert">
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
