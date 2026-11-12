"use client";

import { useActionState, useEffect, useMemo, useRef, useState } from "react";
import { requestBooking } from "@/app/actions";
import { EMPTY, PHOTO_LIMITS } from "@/lib/forms";
import { AVAILABILITY, INTAKE, PATREON, SESSIONS, money } from "@/lib/site";
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
 * (Dated. Both paragraphs below were true when written. Since 2026-08-27 lib/busy.ts
 * reads his calendar back and closes taken times, and since 2026-11-04 a card step
 * exists behind STRIPE_SECRET_KEY, off until the processor question in lib/pay.ts is
 * settled. The `cardPayment` prop is how this component knows which world it is in.)
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

type Props = {
  days: SlotDay[];
  /** A session slug already chosen on the way in, from `?session=` on the link. The
   *  page checks it against SESSIONS before passing it, so it is a real slug or absent. */
  initialSession?: string;
  /** Whether the card step is switched on (STRIPE_SECRET_KEY set). Read on the server
   *  and passed down, so the copy can say what will actually happen instead of
   *  describing both outcomes with an "if" a visitor has no way to resolve. */
  cardPayment?: boolean;
};

const STEPS = ["Session", "Your room", "Time", "Details"];

export default function Booking({ days, initialSession, cardPayment = false }: Props) {
  const [state, action, pending] = useActionState(requestBooking, EMPTY);
  const formRef = useRef<HTMLFormElement>(null);
  const headingRef = useRef<HTMLParagraphElement>(null);
  const doneRef = useRef<HTMLDivElement>(null);

  /* A SESSION PICKED ON THE WAY IN IS KEPT. Every "Book Half hour" and "Book Full hour"
     button on the site linked to plain /consulting#book, so the choice the visitor had
     just made was dropped on arrival and step 1 asked them to make it again, with
     nothing selected. Now the link carries the slug, the radio renders checked (on the
     server too, so this holds with no script), and the wizard opens on the room
     questions with a summary line that says what was picked and offers Change. */
  const [step, setStep] = useState(initialSession && !state.values ? 1 : 0);
  const [session, setSession] = useState(state.values?.session ?? initialSession ?? "");
  const [slot, setSlot] = useState(state.values?.slot ?? "");
  const [activeDay, setActiveDay] = useState(0);
  const [photos, setPhotos] = useState<{ name: string; size: number; url: string }[]>([]);
  /* One error map, written by three things: the step check, the server, and the visitor
     fixing a field. It has to be one map — the first version merged a client map over a
     server map, and a server error the visitor had already corrected had nothing to clear
     it, so it sat under a filled-in field indefinitely.

     SEEDED FROM THE SERVER, which is what makes the no-JavaScript path actually work
     rather than merely submit. The server's messages used to arrive only through the
     effect below, and effects do not run without a script — so with JS off a rejected
     submit rendered every input's `defaultValue` back correctly and not one error
     message, nor a single aria-invalid. The visitor got "Something above needs fixing"
     and no indication of what or where. Worst case was the slot message, whose own
     comment in actions.ts says it exists specifically for the no-JS path: unreachable
     by the only visitor it was written for. MiniForm reads state.errors during render
     and was right all along. The effect stays for subsequent submits with JS on, where
     the component never remounts. */
  const [errors, setErrors] = useState<Record<string, string>>(state.errors ?? {});
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
    /* EVERY EXIT FROM HERE HAS TO CLEAR `resizing`, because the submit button is disabled
       while it is true. Without the finally, one throw in this function left "Resizing…"
       on screen and the button dead for the rest of the visit — the form could not be
       submitted at all, and reloading loses everything typed. Two real ways to throw:
       DataTransfer does not exist on older iOS Safari and `input.files` is not settable
       there, and a corrupt or unsupported image can fail mid-downscale. Neither is worth
       a dead form, and neither actually needs to stop the submit: the originals are
       already on the file input, so the post still carries them and the server rejects
       anything oversized with a message the visitor can read. */
    setResizing(true);
    try {
      const out: File[] = [];
      for (const f of picked.slice(0, PHOTO_LIMITS.count)) {
        // Per file, so one image that will not decode does not cost the others theirs.
        try {
          out.push(await downscale(f));
        } catch {
          out.push(f);
        }
      }
      // Writing back to input.files is what keeps this progressive: the form still
      // submits its own file input, it just now holds smaller files.
      try {
        const dt = new DataTransfer();
        for (const f of out) dt.items.add(f);
        input.files = dt.files;
      } catch {
        // No DataTransfer here. The untouched originals stay on the input.
      }
      setPhotos(out.map((f) => ({ name: f.name, size: f.size, url: URL.createObjectURL(f) })));
      setErrors(({ photos: _gone, ...rest }) => rest);
    } finally {
      setResizing(false);
    }
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
      if (get("name").length < 2) bad.name = "Your name, so we know who we are talking to.";
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(get("email")))
        bad.email = "An email address we can send the invite to.";
    }
    return bad;
  }

  /* REPLACING THE MAP THREW AWAY THE ONLY MESSAGE THAT MATTERED. `setErrors(bad)` on every
     Continue wiped the whole map, and `validate` cannot reproduce two of the server's
     errors: the photo size check (it never looks at files) and slotIsBookable. So the
     sequence was: submit, server rejects a 6MB photo, the effect drops the visitor on step
     2 and shows "…too large. Keep photos under 3 MB each.", the visitor reads it and
     presses Continue — and the message disappears at the exact moment they act on it,
     because validate(1) returned {}. They walk to the end and get rejected identically.
     A blanket merge is not the fix either; the comment on the state above records why.
     Instead each step drops exactly the keys it actually re-checks and leaves the rest,
     so a corrected field clears itself and a server error the client cannot re-derive
     survives until the server says otherwise. */
  const checkedBy = (which: number): string[] =>
    which === 0 ? ["session"]
    : which === 1 ? INTAKE.filter((q) => q.required).map((q) => q.id)
    : which === 2 ? ["slot"]
    : ["name", "email"];

  const withStepErrors = (which: number, bad: Record<string, string>) =>
    (prev: Record<string, string>) => {
      const own = new Set(checkedBy(which));
      const kept = Object.fromEntries(Object.entries(prev).filter(([k]) => !own.has(k)));
      return { ...kept, ...bad };
    };

  function next() {
    setTouched(true);
    const bad = validate(step);
    setErrors(withStepErrors(step, bad));
    if (Object.keys(bad).length) return;
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }

  function back() {
    goTo(step - 1);
  }

  /* Back to any finished step, from the stepper or a Change link. Changing the session
     from step 4 used to take three Backs and three Continues. Only backwards: a step
     ahead has not been checked yet, and Continue is what checks it. */
  function goTo(target: number) {
    if (target < 0 || target >= step) return;
    setTouched(true);
    // Only the step being left, so stepping back does not also erase the server's word on
    // photos or a slot that is no longer bookable.
    setErrors(withStepErrors(step, {}));
    setStep(target);
  }

  /* THE HIDDEN SUBMIT BUTTON IS STILL THE FORM'S DEFAULT BUTTON. `.bk-hide` is display:
     none, and per the HTML implicit-submission rules a default button that is merely
     hidden — as opposed to disabled — is still clicked when Enter is pressed in a field.
     Confirmed in a browser: typing into "Lights" on step 2 of 4 and pressing Enter fired
     a real POST and came back with ten validation errors. The recoverable case is that;
     the one that is not recoverable is a form already filled in correctly, where Enter
     pressed while re-editing an earlier step sends the booking — two emails and a
     calendar invite — carrying the half-typed value the visitor was in the middle of.
     Enter on a non-final step means "next", so that is what it does now. TEXTAREA keeps
     its newline, and BUTTON keeps its own activation. */
  function onKeyDown(e: React.KeyboardEvent<HTMLFormElement>) {
    if (e.key !== "Enter" || step === STEPS.length - 1) return;
    const tag = (e.target as HTMLElement).tagName;
    if (tag === "TEXTAREA" || tag === "BUTTON") return;
    e.preventDefault();
    next();
  }

  /* The last step's fields were never checked before the round trip: validate(3) existed
     but nothing called it, because Continue is the only caller and it stops rendering on
     the last step. It also held the corrected first-person wording while the server kept
     the old "he" copy. */
  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    const bad = validate(STEPS.length - 1);
    if (!Object.keys(bad).length) return;
    e.preventDefault();
    setTouched(true);
    setErrors(withStepErrors(STEPS.length - 1, bad));
  }

  /* ── Confirmation ────────────────────────────────────────────────────────── */

  if (state.status === "done") {
    return (
      <div ref={doneRef} className="card p-8 sm:p-10" aria-live="polite">
        <p className="eyebrow">Request sent</p>
        <h3 className="mt-4 text-3xl">We have your room before you dial in</h3>
        <p className="mt-4 max-w-xl leading-relaxed text-muted">
          {state.payUrl
            ? "Your facility profile is with us now. Pay below to hold the time; we read everything before the call."
            : "Your facility profile is with us now. We read it before the call, and confirm the time by email, along with the invoice to settle beforehand."}
          {state.reminder ? " A reminder goes out the day before." : ""}
        </p>
        {state.payUrl && (
          <a href={state.payUrl} className="btn-primary mt-6">
            Pay for the call
          </a>
        )}
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
            Reference <span className="font-display font-bold text-bone">{state.reference}</span>
            . Quote it if you need to move the call.
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
          {/* External on purpose: the guides came off this site (owner call, 2026-08-27)
              and the reading now lives on his Patreon. */}
          <a href={PATREON.url} className="btn-ghost">
            Read on Patreon while you wait
          </a>
        </div>
        {/* Only claimed when it happened. See FormState.delivered in lib/forms.ts: this
            sentence used to render unconditionally, which made it a promise the build
            could not keep with SMTP unset. */}
        {state.delivered?.toVisitor && (
          <p className="mt-4 text-xs text-muted">
            A copy of the invite is on its way to your inbox too.
          </p>
        )}
        {/* Says his inbox, NOT "nothing was emailed". The two flags fail apart: with SMTP
            configured but MIGAS_NOTIFY_TO unset, the visitor's own confirmation goes out
            while the owner's does not, and a blanket "nothing was emailed" then sits
            directly under a line promising an email. Verified in all three states. */}
        {state.delivered && !state.delivered.toOwner && (
          <p className="mt-4 text-xs text-muted">
            Outgoing mail to his inbox is not switched on for this build yet, so the
            request has not reached him. The reference above is your record of it.
          </p>
        )}
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
        onKeyDown={onKeyDown}
        onSubmit={onSubmit}
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
          {/* The four steps by name, so what is left is visible before it arrives, and the
              finished ones are buttons. A bar with no labels said how far along the visitor
              was and not what came next. */}
          <ol className="mt-3 grid grid-cols-4 gap-1.5">
            {STEPS.map((name, i) => {
              const bar = (
                <span
                  aria-hidden
                  className={`block h-1 rounded-full transition-colors duration-300 ${i <= step ? "bg-ember" : "bg-line"}`}
                />
              );
              return (
                <li key={name} aria-current={i === step ? "step" : undefined}>
                  {i < step ? (
                    <button type="button" onClick={() => goTo(i)} className="group block w-full pb-1 text-left">
                      {bar}
                      <span className="mt-2 block truncate text-xs text-muted group-hover:text-flare">
                        <span className="sr-only">Back to </span>
                        {name}
                      </span>
                    </button>
                  ) : (
                    <>
                      {bar}
                      <span className={`mt-2 block truncate text-xs ${i === step ? "font-semibold text-bone" : "text-muted"}`}>
                        {name}
                      </span>
                    </>
                  )}
                </li>
              );
            })}
          </ol>
          {/* What was picked, while the visitor is in the middle steps. Step 4 has the full
              recap, so this stops there. It matters most when the session came in on the
              link and step 1 was never seen. */}
          {chosen && step > 0 && step < STEPS.length - 1 && (
            <p className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg border border-line bg-ink px-4 py-2.5 text-sm">
              <span className="text-muted">Booking</span>
              <span className="font-semibold text-bone">
                {chosen.name}, {money(chosen.price)}
              </span>
              <button type="button" onClick={() => goTo(0)} className="ml-auto py-1 font-semibold text-flare hover:underline">
                Change<span className="sr-only"> session</span>
              </button>
            </p>
          )}
        </div>

        {/* ── 1. Session ─────────────────────────────────────────────────── */}
        <fieldset className={`bk-step mt-8 ${step === 0 ? "" : "bk-hide"}`}>
          <legend className="text-xl text-bone">How much time do you need?</legend>
          <p className="mt-2 text-sm text-muted">
            A half hour or a full hour.{" "}
            {cardPayment ? "You pay when you book." : "We send the invoice with the confirmation."}
          </p>
          <div className="mt-6 grid gap-3">
            {SESSIONS.map((s) => (
              // The selected ring comes from :has(:checked), not from React state. Both
              // agree while the script is running; only CSS is still right when it is not,
              // because a native radio click checks the input either way.
              //
              // The whole card is the label, so a tap anywhere selects it, but the radio's
              // NAME is just the session and price (aria-labelledby) and the rest is its
              // description. Everything inside a label otherwise becomes the name, and a
              // screen reader would read three sentences and a list as a button label.
              <label
                key={s.slug}
                className="flex cursor-pointer gap-4 rounded-xl2 border border-edge p-5 transition-colors hover:border-bone/40 has-[:checked]:border-flare has-[:checked]:bg-ember/[0.07]"
              >
                <input
                  type="radio"
                  name="session"
                  value={s.slug}
                  aria-labelledby={`bk-${s.slug}-name`}
                  aria-describedby={`bk-${s.slug}-desc`}
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
                <span className="min-w-0 flex-1">
                  <span id={`bk-${s.slug}-name`} className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                    <span className="font-display text-lg font-bold text-bone">{s.name}</span>
                    <span className="text-sm text-muted">
                      {s.minutes} min &middot;{" "}
                      <span className="font-semibold text-flare">{money(s.price)}</span>
                    </span>
                  </span>
                  <span id={`bk-${s.slug}-desc`} className="block">
                    <span className="mt-2 block text-sm leading-relaxed text-bone/85">{s.summary}</span>
                    <span className="mt-1.5 block text-sm leading-relaxed text-muted">{s.forWho}</span>
                    {/* What a session includes. These lived on separate price cards above the
                        form on /consulting, which asked the visitor to choose once on the
                        cards and again here. Spans rather than a list: a label may only hold
                        phrasing content. */}
                    <span className="mt-3 block space-y-1 border-t border-line pt-3">
                      {s.includes.map((x) => (
                        <span key={x} className="flex gap-2 text-[13px] leading-relaxed text-muted">
                          <span aria-hidden className="mt-[8px] h-1 w-1 shrink-0 rounded-full bg-ember" />
                          {x}
                        </span>
                      ))}
                    </span>
                  </span>
                </span>
              </label>
            ))}
          </div>
          <Err msg={errors.session} />
        </fieldset>

        {/* ── 2. The room ────────────────────────────────────────────────── */}
        <fieldset className={`bk-step mt-8 ${step === 1 ? "" : "bk-hide"}`}>
          <legend className="text-xl text-bone">Tell us about the room</legend>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted">
            This is the part that makes the call worth what it costs. We read it
            beforehand, so the hour goes on your room.
          </p>

          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            {INTAKE.map((q) => {
              const wide = q.type === "textarea";
              /* A worked example longer than the field is a hint under the label, not a
                 placeholder. Placeholders were cut off mid-word in a half-width field ("e.g.
                 8 × 720W LED, or 12 × 1000W I") and vanish at the first keystroke, which is
                 when somebody checking the format needs them. */
              const hint = "hint" in q ? q.hint : undefined;
              const described = hint ? `${q.id}-hint` : undefined;
              return (
                <div key={q.id} className={wide ? "sm:col-span-2" : ""}>
                  <label htmlFor={q.id} className="block text-sm font-semibold text-bone">
                    {q.label}
                    {!q.required && <span className="ml-2 font-normal text-muted">optional</span>}
                  </label>
                  {hint && (
                    <p id={described} className="mt-1 text-[13px] leading-snug text-muted">
                      {hint}
                    </p>
                  )}
                  {q.type === "select" ? (
                    <select
                      id={q.id}
                      name={q.id}
                      defaultValue={state.values?.[q.id] ?? ""}
                      aria-required={q.required}
                      aria-invalid={!!errors[q.id]}
                      aria-describedby={described}
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
                      aria-describedby={described}
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
                      aria-describedby={described}
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
              They are resized on your device before upload. Nothing here needs your
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
          <legend className="text-xl text-bone">Pick a time</legend>
          {/* One timezone, labeled, rather than converted to the visitor's: a call missed by
              an hour costs more than reading a label does. That reasoning used to be printed
              here for the visitor too. They need the timezone, not the argument for it. */}
          <p className="mt-2 text-sm leading-relaxed text-muted">
            All times are {AVAILABILITY.timeZoneLabel}.
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
                          /* `ok &&` matters on the no-JS re-render. A slot restored from
                             state.values that is too short for the session renders both
                             checked AND disabled — it paints as selected through
                             peer-checked, but a disabled control is left out of FormData,
                             so the next submit says only "Pick a time" about a time that
                             looks picked. Showing nothing selected is the honest state. */
                          checked={ok && slot === s.value}
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
          <legend className="text-xl text-bone">Where do we send the invite?</legend>
          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            <Field id="name" label="Name" autoComplete="name" state={state} error={errors.name} required />
            <Field id="email" label="Email" type="email" autoComplete="email" state={state} error={errors.email} required />
            <Field id="phone" label="Phone" type="tel" autoComplete="tel" state={state} error={errors.phone} />
            <Field id="company" label="Operation or license name" state={state} error={errors.company} />
            <div className="sm:col-span-2">
              <Field id="heard" label="How did you find us?" state={state} error={errors.heard} />
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

        {/* Step controls. Removed entirely when there is no script to run them. The last
            step has its own row below, with Back beside the submit: on its own line here,
            Back sat alone above a full-width button and read as the main action. */}
        {step < STEPS.length - 1 && (
          <div className="bk-nav mt-8 flex flex-wrap items-center gap-3">
            {step > 0 && (
              <button type="button" onClick={back} className="btn-ghost">
                Back
              </button>
            )}
            <button type="button" onClick={next} className="btn-primary">
              Continue
            </button>
          </div>
        )}

        <div className={`bk-send mt-8 ${step === STEPS.length - 1 ? "" : "bk-hide"}`}>
          <div className="flex flex-wrap items-center gap-3">
            {/* bk-nav, so the no-script stylesheet removes it with the other step controls:
                with every step on one page there is nothing to go back to. */}
            <button type="button" onClick={back} className="bk-nav btn-ghost">
              Back
            </button>
            <button type="submit" disabled={pending || resizing} className="btn-primary flex-1 disabled:opacity-60 sm:flex-none">
              {pending ? "Sending…" : "Send booking request"}
            </button>
          </div>
          <p className="mt-4 max-w-xl text-xs leading-relaxed text-muted">
            The invite lands on both calendars straight away, with a reminder the day before.{" "}
            {cardPayment ? "You pay on the next screen to hold the time." : "We send the invoice with the confirmation."}
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
