# MI Gas — proposal build

A Next.js rebuild of [mi-gas.net](https://mi-gas.net) with the thing he actually asked
for built into it: *"Need to streamline my consulting calls and have a calendar like
Calendly but make the whole experience better. Actually more of a revamp."*

**This is a pitch, not his site.** It contains a full copy of a real business's content on
a hostname that is not theirs, so every path is `noindex` until the day it becomes their
site. See [Going live](#going-live) — three separate things have to change together.

---

## What this does that the current site does not

| | Now | Here |
| --- | --- | --- |
| Booking a consult | Instagram DM | Session type → room intake → photos → time → confirmation, with a written brief in his inbox before the call |
| Contact | Instagram DM only, no email anywhere | A question form with a topic, plus the email constant wired everywhere it appears |
| Reviews | Six PNG screenshots | Text, indexable and readable by a screen reader |
| Page titles | Three of four are unedited platform defaults (`Store 1 — MI Gas`) | Written per page, brand appended once |
| Product pages | One shared platform-generated description | A description written from each guide's own data |
| The bundle | A fifth tile among four cheaper ones | Its own row, first on the page, with the saving derived from the guide prices |
| Store | Seven items, every one sold out, discovered one at a time | Said once at the top, with a restock list |
| Structured data | None | `ProfessionalService` and `Service`, with placeholder fields omitted rather than invented |
| Dead product URLs | Roughly twice as many URLs as products | A 404 that routes |

## The booking flow

`components/Booking.tsx`, `app/actions.ts`, `lib/slots.ts`.

**What makes it better than a scheduler**, in one line each:

- **It asks the right eight questions.** Stage, canopy, media, feed, lights, nutrients,
  runoff, and what you want out of the call. Every scheduling tool has a free-text box;
  none of them knows what to put in it. That list is the product and it lives in
  `lib/site.ts` so he can rewrite it without touching a component.
- **Photos work off a phone.** A canopy photo is 3–8 MB and a serverless request body caps
  out around 4.5 MB, so four straight off a camera roll physically cannot be posted. The
  browser decodes and downscales each to 1600px before it leaves the device. Measured:
  7.23 MB of source photos → 1.21 MB posted.
- **Slot lengths are honest.** One 30-minute grid, each slot carrying the longest session
  that still fits its window, so a 90-minute consult is not offered at 11:30 in a window
  that closes at noon.
- **One timezone, labelled.** Times are Eastern and say so, rather than being silently
  converted to the visitor's browser. A call missed by an hour costs more than a label.
- **It works with JavaScript off.** The steps are real fieldsets in one real form posting
  to a server action. With no script a `<noscript>` stylesheet un-hides every step and it
  becomes one long form that still validates and still submits. Verified: an empty submit
  returns 12 server-side messages, a slot too short for the chosen session is rejected with
  a sentence explaining why, and the answers come back filled in rather than wiped.

**What it deliberately is not:**

- **Not a calendar.** It does not know what is already booked, does not sync, and does not
  stop two people taking the same 9am four seconds apart. Slots come from a weekly pattern
  in `lib/site.ts`. Hand-writing live availability is how you get double-booked. The seam is
  `slotGrid()` in `lib/slots.ts` — replace it with a calendar feed and the form, the action
  and the confirmation are unchanged.
- **It takes no card.** Not laziness — unresolved. Stripe's published restricted-business
  list prohibits *"Courses and information on cultivating marijuana"*, and Calendly, Acuity
  and Setmore all settle through Stripe, Square or PayPal. Which processor will underwrite
  him is a question for him and his bank, and a checkout built against the wrong answer is
  work done twice. A request reaches him and he invoices.
- **It stores no photos.** `storeUploads` in `app/actions.ts` validates and counts. Doing it
  properly is client-direct upload to blob storage — which also sidesteps the body ceiling,
  and is the actual reason to prefer it. About six lines, needs a token.

## Everything he has to supply

Search the codebase for `PLACEHOLDER`. Every one of them is deliberate and marked in place.
In rough order of what it costs to leave alone:

1. **An email address.** `SITE.email`. There is no contact address anywhere on the live
   site. An operator who will not DM a stranger currently has no way to reach him at all.
2. **Who processes his payments** — and has anyone ever asked them about the cannabis
   education category? Everything about how money moves depends on this answer.
3. **Consulting rates.** `SESSIONS`. He has never published any, so $150/$300/$500 is a
   proposal built from published comparables in the niche and from the principle that a
   live hour should cost more than a $200 guide. It should not survive contact with him.
4. **Review text.** `REVIEWS`. Transcribe the six images on the live site. Highest-return
   hour on the project — the cards render as visible empty slots until then, because
   inventing a testimonial is not a placeholder.
5. **His availability.** `AVAILABILITY.windows`. Currently a plausible shape, not his diary.
6. **His logo.** `components/Mark.tsx` is a typographic stand-in. Nobody who worked on this
   has seen his rendered site — the browser in the build environment has no outbound HTTPS
   at all — so the whole visual direction is a proposal. Every colour is in
   `tailwind.config.ts` and nothing else hardcodes one.
7. **The runoff numbers on the hero diagram.** `DIAGRAM`. A specific runoff target on a
   consultant's homepage reads as his recommendation. Either confirm them or the labels go
   generic.
8. **The facility name.** `SITE.facility`. The site claims "director of Michigan's top
   licensed cannabis facility" and never names it — the strongest credibility asset he has,
   going unused. Plenty of people keep their employer separate from their personal brand
   deliberately, so ask before filling it in.
9. **Store product URLs.** `buyUrl` on each guide in `lib/site.ts`. The guides already sell
   today. A URL there turns the request form into a real buy button with no code change.
10. **Confidentiality, rescheduling, and the guide-credit question.** `FAQ`. Licensed
    operators will ask about the first before they book.

## Environment

Set in the Vercel dashboard. Never in the repo, never pasted into a chat.

| Variable | Effect if unset |
| --- | --- |
| `RESEND_API_KEY` | **Bookings go nowhere but the Vercel logs.** The form still succeeds for the visitor — a form that errors because of a missing env var trains people not to trust it — and the full brief is written to the server log. Set this before anyone real uses it. |
| `MIGAS_NOTIFY_TO` | Falls back to `SITE.email`, which is a placeholder, which is why notification is skipped. |
| `MIGAS_NOTIFY_FROM` | Falls back to `noreply@mi-gas.net`. Must be a domain verified in Resend. |

## Layout

```
lib/site.ts     Every fact about the business. One edit per correction.
lib/slots.ts    Slot generation, timezone handling, and the calendar seam.
lib/forms.ts    Form types and limits — NOT in app/actions.ts, see below.
app/actions.ts  The three server actions. Validation lives here and means it.
app/globals.css Component classes and every @keyframes on the site.
tailwind.config.ts  The whole palette, with measured contrast ratios in the comment.
components/FeedRig.tsx  The hero diagram and the only motion.
components/Booking.tsx  The booking flow.
```

## Traps, all of them hit during this build

**Tailwind purges `@keyframes` declared in `tailwind.config.js`** unless the matching
`animate-*` utility appears in scanned markup. A plain CSS rule naming the animation does
not count. The symptom looks healthy — `animation-play-state` reads `running`,
`animation-duration` reads the full value — and the transform never changes. Every keyframe
on this site is in `app/globals.css`, next to the rule that uses it. Leave them there.

**A CSS `transform` overrides an SVG `transform` attribute completely.** `<path
transform="translate(118 102)">` animated with `translateY()` loses the translate and draws
at the viewBox origin. All three feed drops animated in the corner of the graphic, and it
read as one stray blob rather than a broken animation — only visible by looking at a
screenshot. Position goes on a wrapping `<g>`, motion goes on the child. Never both on one
node.

**`transform-box: fill-box`** is required for a transform on an SVG child, or
`transform-origin: 50% 50%` means the middle of the whole drawing.

**A `use server` file may only export async functions.** Exporting an initial-state object
from `app/actions.ts` fails the build with `A "use server" file can only export async
functions, found object`, and the error names the file rather than the export. That is the
entire reason `lib/forms.ts` exists.

**Never put `required` on an input inside a hidden container.** A required control that
cannot be focused makes the browser refuse to submit while logging the reason to a console
nobody has open — the form silently stops working. This build uses `aria-required` plus a
check per step plus the same rules again on the server.

**An `sr-only` radio inside a label has nowhere to draw its focus ring.** 72 time slots,
keyboard-navigable, with no visible indication of where you are. Fixed with the peer
pattern: `peer sr-only` on the input, `peer-checked:` and `peer-focus-visible:` on a
sibling span. That also makes the selected state survive with JavaScript off, which React
state cannot.

**Clear a field's error when it is fixed, not at the next step.** The first version merged
a client error map over a server one, so a server error the visitor had already corrected
had nothing to clear it and sat under a filled-in field. One map, and a delegated
`onInput`/`onChange` on the form so it covers inputs the intake generates from data.

**Kill stale dev servers by PID and confirm the port is clear** before believing any
measurement. An old process still holding the port serves the old build, the new stylesheet
404s, the page renders unstyled, and the audit reports overflow and console errors that do
not exist. Never `pkill -f "next start"` — that pattern matches your own shell.

## Verifying

Harnesses live in the `glazedweb` repo under `tools/`. Point them at a **production build**,
never the dev server.

```bash
rm -rf .next && npm run build && npx next start -p 4491 -H 127.0.0.1 &
node tools/audit.mjs     --base http://127.0.0.1:4491 --routes /,/consulting,/guides,/guides/flower,/guides/complete,/shop,/reviews,/connect
node tools/contrast.mjs  --base http://127.0.0.1:4491 --routes /,/consulting,/guides/flower,/shop,/connect
node tools/animating.mjs --url  http://127.0.0.1:4491/ --selector ".rig-drop-0"
```

Current state: **0 axe violations, no horizontal overflow, no console errors, no 4xx/5xx**
across nine routes at 390px and 1440px. No contrast failures. Reduced motion leaves nothing
hidden and rests the diagram on a finished frame. With JavaScript disabled, nothing is
hidden and the booking form submits and validates.

## Going live

Three things change together and none of them works alone. A `robots.txt` that allows
crawling while an `X-Robots-Tag` header says `noindex` is still noindexed, and that is hard
to spot from the outside.

1. `app/robots.ts` — allow `/`, add `sitemap`
2. `next.config.ts` — delete the `headers()` block
3. `app/layout.tsx` — delete `robots` from the `metadata` export

Then: set `RESEND_API_KEY`, fill in the `PLACEHOLDER` list above, and point the domain.
