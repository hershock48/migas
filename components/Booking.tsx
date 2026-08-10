"use client";

import { useActionState, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { requestBooking } from "@/app/actions";
import { EMPTY, PHOTO_LIMITS } from "@/lib/forms";
import { AVAILABILITY, INTAKE, SESSIONS, money } from "@/lib/site";
import type { SlotDay } from "@/lib/slots";

/**
 * The booking flow. This is the thing the client actually asked for — "a calendar like
 * Calendly but make the whole experience better" — so it is worth being precise about
 * what "better" means here, and about what this deliberately is not.
 *
 * WHAT IT DOES THAT AN OFF-THE-SHELF SCHEDULER DOES NOT.
 *
 * It asks the right eight questions. Stage, canopy, media, feed, lights, nutrients,
 * runoff, and what you want out of the call — the questions he would otherwise spend
 * the first twenty minutes of a paid call asking. Every scheduling tool has a text box;
 * none of them knows what to put in it. That list is the product, and it lives in
 * lib/site.ts so he can rewrite it without touching a component.
 *
 * It takes photos, and it makes them work. A picture of the canopy is worth more than
 * any answer above, and a photo off a phone is 3–8 MB — enough to blow the request-body
 * ceiling on a serverless function. So the browser decodes and downscales each one to
 * 1600px before it ever leaves the device (see `downscale`), which turns a 6 MB upload
 * into roughly 400 KB. If the decode fails — HEIC on a browser that cannot read it —
 * the original goes instead and the server rejects it with a sentence a human can act
 * on, rather than a 413.
 *
 * It works with JavaScript off. The steps are real fieldsets in one real form posting
 * to a server action; the wizard is CSS hiding the steps this component is not showing.
 * With no script, a <noscript> stylesheet un-hides all of them and it becomes one long
 * form that submits and validates properly. That ordering matters: the enhancement adds
 * the wizard, it is not what makes the form function.
 *
 * WHAT IT IS NOT, and no amount of care changes this.
 *
 * It is not a calendar. It does not know what is already booked, it does not sync, and
 * it does not stop two people taking the same 9am four seconds apart. Slots come from a
 * weekly pattern in lib/site.ts. Hand-writing real availability is how you get
 * double-booked, and the seam for a calendar feed is lib/slots.ts.
 *
 * It does not take a card, on purpose. Stripe's published restricted-business list
 * prohibits "Courses and information on cultivating marijuana", and Calendly, Acuity and
 * Setmore all settle through Stripe, Square or PayPal. Until it is known which processor
 * will underwrite him, a checkout built here is work done against a guess.
 *
 * ONE MORE TRAP, WORTH THE PARAGRAPH. None of these inputs uses `required`. A `required`
 * field inside a hidden fieldset cannot be focused, so the browser refuses to submit and
 * reports "An invalid form control is not focusable" to a console nobody has open — the
 * form simply stops working, with no visible reason. Validation is `aria-required` plus a
 * check per step here, and the same rules again on the server, where they are load-bearing.
 */

type Props = { days: SlotDay[] };

const STEPS = ["Session", "Your room", "Time", "Details"];

export default function Booking({ days }: Props) {
  const [state, action, pending] = useActionState(requestBooking, EMPTY);
  const formRef = useRef<HTMLFormElement>(null);
  const headingRef = useRef<HTMLParagraphElement>(null);
  const doneRef = useRef<HTMLDivElement>(null);

  const [step, setStep] = useState(0);
  const [session, setSession] = useState(state.values?.session ?? "");
  const [slot, setSlot] = useState(state.values?.slot ?? "");
  const [activeDay, setActiveDay] = useState(0);
  const [photos, setPhotos] = useState<{ name: string; size: number; url: string }[]>([]);
  /* One error map, written by three things: the step check, the server, and the visitor
     fixing a field. It has to be one map — the first version merged a client map over a
     server map, and a server error the visitor had already corrected had nothing to clear
     it, so it sat under a filled-in field indefinitely. */
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [resizing, setResizing] = useState(false);
  const [touched, setTouched] = useState(false);

  const chosen = SESSIONS.find((s) => s.slug === session);

  /* Clear a field's error the moment it is touched, rather than at the next Continue.
     Delegated to the form so it covers every input, select and textarea inside it —
     including the ones the intake generates from data, which no per-field handler would
     stay in step with. React's change events bubble, so one listener is enough. */
  function clearOn(e: React.SyntheticEvent) {
    const t = e.target as HTMLInputElement | null;
    const key = t?.name;
    if (!key) return;
    setErrors((prev) => {
      if (!prev[key]) return prev;
      const { [key]: _gone, ...rest } = prev;
      return rest;
    });
  }

  /* A slot is only offerable if the chosen session fits in the remainder of its window.
     Nothing is disabled until a session is picked, so the grid never looks broken. */
  const fits = (max: number) => !chosen || max >= chosen.minutes;

  const openCount = useMemo(
    () => days.reduce((n, d) => n + d.slots.filter((s) => fits(s.maxMinutes)).length, 0),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [days, chosen?.minutes]
  );

  /* Move focus with the step, or a keyboard visitor stays parked on a button that just
     vanished. Only after the first interaction, so landing on the page does not yank
     the viewport. */
  useEffect(() => {
    if (!touched) return;
    headingRef.current?.focus();
    formRef.current?.scrollIntoView({ block: "start", behavior: "smooth" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  /* A rejected submit lands the visitor on the step that has the problem rather than
     leaving a red message four screens away from the field it belongs to. */
  useEffect(() => {
    if (state.status !== "error" || !state.errors) return;
    setErrors(state.errors);
    const keys = Object.keys(state.errors);
    const owner = (k: string) =>
      k === "session" ? 0 : INTAKE.some((q) => q.id === k) || k === "photos" ? 1 : k === "slot" ? 2 : 3;
    setTouched(true);
    setStep(Math.min(...keys.map(owner)));
  }, [state]);

  useEffect(() => {
    if (state.status === "done") doneRef.current?.scrollIntoView({ block: "center", behavior: "smooth" });
  }, [state.status]);

  useEffect(() => () => photos.forEach((p) => URL.revokeObjectURL(p.url)), [photos]);

  /* ── Photos ──────────────────────────────────────────────────────────────── */

  async function onPickPhotos(e: React.ChangeEvent<HTMLInputElement>) {
    const input = e.currentTarget;
    const picked = Array.from(input.files ?? []);
    photos.forEach((p) => URL.revokeObjectURL(p.url));
    if (!picked.length) {
      setPhotos([]);
      return;
    }
    setResizing(true);
    const out: File[] = [];
    for (const f of picked.slice(0, PHOTO_LIMITS.count)) out.push(await downscale(f));
    // Writing back to input.files is what keeps this progressive: the form still
    // submits its own file input, it just now holds smaller files.
    const dt = new DataTransfer();
    for (const f of out) dt.items.add(f);
    input.files = dt.files;
    setPhotos(out.map((f) => ({ name: f.name, size: f.size, url: URL.createObjectURL(f) })));
    setResizing(false);
    setErrors(({ photos: _gone, ...rest }) => rest);
  }

  /* ── Step gating ─────────────────────────────────────────────────────────── */

  function validate(which: number): Record<string, string> {
    const fd = new FormData(formRef.current!);
    const get = (k: string) => String(fd.get(k) ?? "").trim();
    const bad: Record<string, string> = {};
    if (which === 0 && !get("session")) bad.session = "Pick a session type.";
    if (which === 1) {
      for (const q of INTAKE) if (q.required && !get(q.id)) bad[q.id] = "Needed before the call.";
    }
    if (which === 2 && !get("slot")) bad.slot = "Pick a time.";
    if (which === 3) {
      if (get("name").length < 2) bad.name = "Your name, so he knows who he is talking to.";
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(get("email")))
        bad.email = "An email address he can send the invite to.";
    }
    return bad;
  }

  function next() {
    setTouched(true);
    const bad = validate(step);
    setErrors(bad);
    if (Object.keys(bad).length) return;
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }

  function back() {
    setTouched(true);
    setErrors({});
    setStep((s) => Math.max(s - 1, 0));
  }

  /* ── Confirmation ────────────────────────────────────────────────────────── */

  if (state.status === "done") {
    return (
      <div ref={doneRef} className="card p-8 sm:p-10" aria-live="polite">
        <p className="eyebrow">Request sent</p>
        <h3 className="mt-4 text-3xl">He has your room, not just your name.</h3>
        <p className="mt-4 max-w-xl leading-relaxed text-muted">
          Your intake is with him now. He reads it before the call, and confirms the time by
          email &mdash; along with the invoice to settle beforehand.
        </p>
        {state.summary && state.summary.length > 0 && (
          <dl className="mt-8 divide-y divide-line border-y border-line">
            {state.summary.map((line) => (
              <div key={line} className="flex gap-3 py-3.5 text-[15px]">
                <span aria-hidden className="mt-[9px] h-1.5 w-1.5 shrink-0 rounded-full bg-ember" />
                <dd className="text-bone">{line}</dd>
              </div>
            ))}
          </dl>
        )}
        {state.reference && (
          <p className="mt-6 text-sm text-muted">
            Reference <span className="font-display font-bold text-bone">{state.reference}</span>{" "}
            &mdash; quote it if you need to move the call.
          </p>
        )}
        <div className="mt-8 flex flex-wrap gap-3">
          {state.ics && (
            /* The invite is already in this response as a data: URL, so there is nothing to
               fetch and nothing hosting it. This is the feature people rent a scheduling
               service for, and it is a text format from 1998 — see lib/ics.ts. */
            <a href={state.ics} download="mi-gas-consult.ics" className="btn-primary">
              Add to calendar
            </a>
          )}
          <Link href="/guides" className="btn-ghost">
            Read a program while you wait
          </Link>
        </div>
        <p className="mt-4 text-xs text-muted">
          A copy of the invite is on its way to your inbox too.
        </p>
      </div>
    );
  }

  /* ── The form ────────────────────────────────────────────────────────────── */

  return (
    <>
      {/* With no JavaScript the wizard does not exist, so every step is shown at once and
          the step controls are removed. This is the only place in the build where CSS
          decides behaviour, and it is here because the alternative — hiding steps in JS
          after mount — flashes the whole form on every page load. */}
      <noscript>
        <style>{`
          .bk-step, .bk-send, .bk-day { display: block !important; }
          .bk-nav, .bk-progress, .bk-recap { display: none !important; }
        `}</style>
      </noscript>

      <form
        ref={formRef}
        action={action}
        noValidate
        onInput={clearOn}
        onChange={clearOn}
        className="card scroll-mt-24 p-6 sm:p-9"
      >
        {/* Bots fill everything. Humans never see this. */}
        <div aria-hidden className="absolute h-0 w-0 overflow-hidden">
          <label htmlFor="bk-trap">Leave blank</label>
          <input id="bk-trap" type="text" name="_trap" tabIndex={-1} autoComplete="off" />
        </div>

        <div className="bk-progress">
          <div className="flex items-baseline justify-between gap-4">
            <p
              ref={headingRef}
              tabIndex={-1}
              className="eyebrow outline-none"
              aria-live="polite"
            >
              Step {step + 1} of {STEPS.length} &middot; {STEPS[step]}
            </p>
            <p className="text-xs text-muted">{openCount} times open</p>
          </div>
          <div className="mt-3 h-1 overflow-hidden rounded-full bg-line">
            <div
              className="h-full rounded-full bg-ember transition-[width] duration-300"
              style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
            />
          </div>
        </div>

        {/* ── 1. Session ─────────────────────────────────────────────────── */}
        <fieldset className={`bk-step mt-8 ${step === 0 ? "" : "bk-hide"}`}>
          <legend className="text-xl text-bone">How much time do you need?</legend>
          <p className="mt-2 text-sm text-muted">
            Rates are a proposal, not published prices. He invoices before the call.
          </p>
          <div className="mt-6 grid gap-3">
            {SESSIONS.map((s) => (
              // The selected ring comes from :has(:checked), not from React state. Both
              // agree while the script is running; only CSS is still right when it is not,
              // because a native radio click checks the input either way.
              <label
                key={s.slug}
                className="flex cursor-pointer gap-4 rounded-xl2 border border-edge p-5 transition-colors hover:border-bone/40 has-[:checked]:border-flare has-[:checked]:bg-ember/[0.07]"
              >
                <input
                  type="radio"
                  name="session"
                  value={s.slug}
                  checked={session === s.slug}
                  onChange={() => {
                    setSession(s.slug);
                    setErrors({});
                    // A slot that no longer fits the new length has to go, or the recap
                    // shows a time the server will reject.
                    const held = days.flatMap((d) => d.slots).find((x) => x.value === slot);
                    if (held && held.maxMinutes < s.minutes) setSlot("");
                  }}
                  className="mt-1 h-5 w-5 shrink-0 accent-ember"
                />
                <span className="flex-1">
                  <span className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                    <span className="font-display text-lg font-bold text-bone">{s.name}</span>
                    <span className="text-sm text-muted">
                      {s.minutes} min &middot;{" "}
                      <span className="font-semibold text-flare">{money(s.price)}</span>
                    </span>
                  </span>
                  <span className="mt-2 block text-sm leading-relaxed text-bone/85">{s.summary}</span>
                  <span className="mt-1.5 block text-sm leading-relaxed text-muted">{s.forWho}</span>
                </span>
              </label>
            ))}
          </div>
          <Err msg={errors.session} />
        </fieldset>

        {/* ── 2. The room ────────────────────────────────────────────────── */}
        <fieldset className={`bk-step mt-8 ${step === 1 ? "" : "bk-hide"}`}>
          <legend className="text-xl text-bone">Tell him about the room.</legend>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted">
            This is the part that makes the call worth what it costs. He reads it
            beforehand, so you spend the time on the answer instead of the background.
          </p>

          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            {INTAKE.map((q) => {
              const wide = q.type === "textarea";
              return (
                <div key={q.id} className={wide ? "sm:col-span-2" : ""}>
                  <label htmlFor={q.id} className="block text-sm font-semibold text-bone">
                    {q.label}
                    {!q.required && <span className="ml-2 font-normal text-muted">optional</span>}
                  </label>
                  {q.type === "select" ? (
                    <select
                      id={q.id}
                      name={q.id}
                      defaultValue={state.values?.[q.id] ?? ""}
                      aria-required={q.required}
                      aria-invalid={!!errors[q.id]}
                      className="field mt-2"
                    >
                      <option value="">Choose one</option>
                      {(q.options as readonly string[]).map((o) => (
                        <option key={o} value={o}>
                          {o}
                        </option>
                      ))}
                    </select>
                  ) : q.type === "textarea" ? (
                    <textarea
                      id={q.id}
                      name={q.id}
                      rows={4}
                      placeholder={"placeholder" in q ? q.placeholder : undefined}
                      defaultValue={state.values?.[q.id] ?? ""}
                      aria-required={q.required}
                      aria-invalid={!!errors[q.id]}
                      className="field mt-2 resize-y"
                    />
                  ) : (
                    <input
                      id={q.id}
                      name={q.id}
                      type="text"
                      placeholder={"placeholder" in q ? q.placeholder : undefined}
                      defaultValue={state.values?.[q.id] ?? ""}
                      aria-required={q.required}
                      aria-invalid={!!errors[q.id]}
                      className="field mt-2"
                    />
                  )}
                  <Err msg={errors[q.id]} />
                </div>
              );
            })}
          </div>

          {/* Photos. The single highest-value field on the form. */}
          <div className="mt-8 rounded-xl2 border border-dashed border-edge p-5">
            <label htmlFor="photos" className="block text-sm font-semibold text-bone">
              Photos of the room
              <span className="ml-2 font-normal text-muted">strongly recommended</span>
            </label>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              Up to {PHOTO_LIMITS.count}. Wide shot of the canopy, a close-up of whatever is
              wrong, and your reservoir or controller if the problem is feed-related.
              They are resized on your device before upload &mdash; nothing here needs your
              full-resolution camera roll.
            </p>
            <input
              id="photos"
              name="photos"
              type="file"
              accept="image/*"
              multiple
              onChange={onPickPhotos}
              className="mt-4 block w-full text-sm text-muted file:mr-4 file:cursor-pointer file:rounded-full file:border-0 file:bg-ember file:px-4 file:py-2 file:text-sm file:font-semibold file:text-ink hover:file:bg-ember-hot"
            />
            {resizing && <p className="mt-3 text-sm text-alert">Resizing&hellip;</p>}
            {photos.length > 0 && (
              <ul className="mt-4 flex flex-wrap gap-3">
                {photos.map((p) => (
                  <li key={p.url} className="w-24">
                    {/* Deliberately a plain img: a blob: URL from this device is not
                        something next/image can optimise, and routing it through the
                        optimiser would fail. */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={p.url}
                      alt=""
                      className="h-24 w-24 rounded-lg border border-line object-cover"
                    />
                    <p className="mt-1 truncate text-[11px] text-muted" title={p.name}>
                      {Math.round(p.size / 1024)} KB
                    </p>
                  </li>
                ))}
              </ul>
            )}
            <Err msg={errors.photos} />
          </div>
        </fieldset>

        {/* ── 3. Time ────────────────────────────────────────────────────── */}
        <fieldset className={`bk-step mt-8 ${step === 2 ? "" : "bk-hide"}`}>
          <legend className="text-xl text-bone">Pick a time.</legend>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            All times {AVAILABILITY.timeZoneLabel}. Shown in one timezone and labelled,
            rather than converted to yours &mdash; a call missed by an hour costs more than
            reading a label does.
            {chosen && (
              <>
                {" "}
                Showing what fits a {chosen.minutes}-minute session.
              </>
            )}
          </p>

          <div className="bk-nav mt-6 flex gap-2 overflow-x-auto pb-2">
            {days.map((d, i) => {
              const open = d.slots.filter((s) => fits(s.maxMinutes)).length;
              return (
                <button
                  key={d.date}
                  type="button"
                  onClick={() => setActiveDay(i)}
                  aria-pressed={activeDay === i}
                  disabled={open === 0}
                  className={`shrink-0 rounded-lg border px-3.5 py-2.5 text-center transition-colors disabled:opacity-40 ${
                    activeDay === i ? "border-flare bg-ember/15 text-bone" : "border-line text-muted hover:border-edge"
                  }`}
                >
                  <span className="block text-[11px] uppercase tracking-[0.12em]">{d.weekday}</span>
                  <span className="mt-0.5 block font-display text-sm font-bold">{d.label}</span>
                </button>
              );
            })}
          </div>

          <div className="mt-4 grid gap-6">
            {days.map((d, i) => (
              <fieldset key={d.date} className={`bk-day ${i === activeDay ? "" : "bk-hide"}`}>
                <legend className="text-sm font-semibold text-bone">
                  {d.weekday}, {d.label}
                </legend>
                <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {d.slots.map((s) => {
                    const ok = fits(s.maxMinutes);
                    return (
                      <label key={s.value} className="block">
                        <input
                          type="radio"
                          name="slot"
                          value={s.value}
                          checked={slot === s.value}
                          disabled={!ok}
                          onChange={() => {
                            setSlot(s.value);
                            setErrors(({ slot: _gone, ...rest }) => rest);
                          }}
                          className="peer sr-only"
                        />
                        {/* The input is visually hidden but still focusable, so the focus
                            ring has to be drawn on something visible — otherwise a keyboard
                            visitor arrows through 72 times with no indication of where they
                            are. peer-checked also means the selected state survives with no
                            JavaScript, where React state cannot. */}
                        <span
                          className={`block rounded-lg border px-3 py-2.5 text-center text-sm transition-colors peer-checked:border-flare peer-checked:bg-ember/15 peer-checked:text-bone peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-flare ${
                            ok
                              ? "cursor-pointer border-line text-bone hover:border-edge"
                              : "cursor-not-allowed border-line/60 text-muted/40"
                          }`}
                        >
                          {s.time}
                          {!ok && <span className="sr-only"> (too short for this session)</span>}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </fieldset>
            ))}
          </div>
          <Err msg={errors.slot} />
        </fieldset>

        {/* ── 4. Details ─────────────────────────────────────────────────── */}
        <fieldset className={`bk-step mt-8 ${step === 3 ? "" : "bk-hide"}`}>
          <legend className="text-xl text-bone">Where does he send the invite?</legend>
          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            <Field id="name" label="Name" autoComplete="name" state={state} error={errors.name} required />
            <Field id="email" label="Email" type="email" autoComplete="email" state={state} error={errors.email} required />
            <Field id="phone" label="Phone" type="tel" autoComplete="tel" state={state} error={errors.phone} />
            <Field id="company" label="Operation or licence name" state={state} error={errors.company} />
            <div className="sm:col-span-2">
              <Field id="heard" label="How did you find him?" state={state} error={errors.heard} />
            </div>
          </div>

          <div className="bk-recap mt-8 rounded-xl2 border border-line bg-ink p-5">
            <p className="eyebrow">What you are booking</p>
            <ul className="mt-3 space-y-1.5 text-sm">
              <li className="text-bone">
                {chosen ? `${chosen.name}, ${chosen.minutes} minutes, ${money(chosen.price)}` : "No session picked yet"}
              </li>
              <li className="text-bone">{slot ? readable(slot, days) : "No time picked yet"}</li>
              <li className="text-muted">
                {photos.length > 0
                  ? `${photos.length} photo${photos.length === 1 ? "" : "s"} attached`
                  : "No photos attached"}
              </li>
            </ul>
          </div>
        </fieldset>

        {/* Step controls. Removed entirely when there is no script to run them. */}
        <div className="bk-nav mt-8 flex flex-wrap items-center gap-3">
          {step > 0 && (
            <button type="button" onClick={back} className="btn-ghost">
              Back
            </button>
          )}
          {step < STEPS.length - 1 && (
            <button type="button" onClick={next} className="btn-primary">
              Continue
            </button>
          )}
        </div>

        <div className={`bk-send mt-8 ${step === STEPS.length - 1 ? "" : "bk-hide"}`}>
          <button type="submit" disabled={pending || resizing} className="btn-primary w-full sm:w-auto disabled:opacity-60">
            {pending ? "Sending…" : "Send booking request"}
          </button>
          <p className="mt-4 max-w-xl text-xs leading-relaxed text-muted">
            No card taken here. He confirms the time by email and sends an invoice to
            settle before the call.
          </p>
        </div>

        {state.status === "error" && (
          <p role="alert" className="mt-6 text-sm text-alert">
            Something above needs fixing before this can go.
          </p>
        )}
      </form>
    </>
  );
}

/* ── Bits ──────────────────────────────────────────────────────────────────── */

function Err({ msg }: { msg?: string }) {
  if (!msg) return null;
  return (
    <p role="alert" className="mt-2 text-sm text-alert">
      {msg}
    </p>
  );
}

function Field({
  id,
  label,
  type = "text",
  autoComplete,
  state,
  error,
  required = false,
}: {
  id: string;
  label: string;
  type?: string;
  autoComplete?: string;
  state: { values?: Record<string, string> };
  error?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-semibold text-bone">
        {label}
        {!required && <span className="ml-2 font-normal text-muted">optional</span>}
      </label>
      <input
        id={id}
        name={id}
        type={type}
        autoComplete={autoComplete}
        defaultValue={state.values?.[id] ?? ""}
        aria-required={required}
        aria-invalid={!!error}
        className="field mt-2"
      />
      <Err msg={error} />
    </div>
  );
}

/** The recap line. Reads the day labels already on the page rather than re-deriving a
 *  date in the browser, which is one fewer place a timezone can be got wrong. */
function readable(value: string, days: SlotDay[]) {
  for (const d of days) {
    const hit = d.slots.find((s) => s.value === value);
    if (hit) return `${d.weekday}, ${d.label} at ${hit.time} ${AVAILABILITY.timeZoneLabel}`;
  }
  return value;
}

/**
 * Downscale on the device, before upload.
 *
 * A phone photo of a canopy is 3–8 MB and a serverless request body caps out around
 * 4.5 MB, so four photos straight off a camera roll cannot physically be posted. 1600px
 * on the long edge at JPEG 0.82 is roughly 400 KB and still shows a leaf margin clearly
 * enough to read a deficiency, which is the actual requirement.
 *
 * Every failure path returns the original file rather than throwing: an iPhone HEIC on a
 * browser that cannot decode it, a canvas that will not allocate, an image with no
 * intrinsic size. The server then rejects the oversized original with a sentence the
 * visitor can act on, which is a far better outcome than a form that swallows the click.
 */
async function downscale(file: File, maxEdge = 1600, quality = 0.82): Promise<File> {
  if (!file.type.startsWith("image/")) return file;
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
    // Already small enough, and re-encoding would only lose detail.
    if (scale === 1 && file.size < 900_000) {
      bitmap.close?.();
      return file;
    }
    const w = Math.round(bitmap.width * scale);
    const h = Math.round(bitmap.height * scale);
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, w, h);
    bitmap.close?.();
    const blob = await new Promise<Blob | null>((res) =>
      canvas.toBlob((b) => res(b), "image/jpeg", quality)
    );
    if (!blob || blob.size >= file.size) return file;
    return new File([blob], file.name.replace(/\.[^.]+$/, "") + ".jpg", {
      type: "image/jpeg",
      lastModified: file.lastModified,
    });
  } catch {
    return file;
  }
}
