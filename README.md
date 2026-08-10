# MI Gas — proposal build

A Next.js rebuild of [mi-gas.net](https://mi-gas.net) with the thing he actually asked for
built into it: *"Need to streamline my consulting calls and have a calendar like Calendly but
make the whole experience better. Actually more of a revamp."*

**This is a pitch, not his site.** It contains a full copy of a real business's content on a
hostname that is not theirs, so every path is `noindex` until the day it becomes their site.
See [Going live](#going-live) — three separate things have to change together.

---

## Nothing here is rented

There is no SaaS in this build. Not a scheduling service, not a hosted email API, not an
object store, not an analytics script, not a font served from someone else's CDN at runtime.
That is a deliberate constraint, and it is the reason a few things are written out longhand
below instead of installed.

| The thing a site like this usually rents | What it does here |
| --- | --- |
| Calendly / Acuity, ~$16–$50/mo | Slots generated from a weekly pattern in `lib/site.ts`, rendered as real radio inputs (`lib/slots.ts`) |
| Calendar invites | `lib/ics.ts` — RFC 5545 is a text format from 1998 and about eighty lines of it |
| Hosted email API | Plain SMTP through a mailbox he already pays for, via `nodemailer` (MIT) |
| Object storage for uploads | Photos ride along as MIME attachments on the brief. Nothing to host, nothing to expire |
| Web fonts | `next/font` downloads Archivo and Inter **at build time** and serves them from his own domain. No runtime request to Google, no cost, ever |
| A stock hero image | The sun is drawn in CSS (`components/Sun.tsx`). No photograph, no licence question, no kilobytes |
| Analytics / chat widget / cookie banner | None. There is nothing to consent to |

The full runtime dependency list is `next`, `react`, `react-dom`, `nodemailer`. Everything
else is a build tool.

The one thing that is not free is hosting, which is his existing choice, and Vercel's free
tier covers a site this size.

## What this does that the current site does not

| | Now | Here |
| --- | --- | --- |
| Booking a consult | Instagram DM | Session type → room intake → photos → time → a written brief, the photos and a calendar invite in his inbox before the call |
| Calendar | none | An `.ics` to both sides. His own calendar becomes the record of what is booked |
| Contact | Instagram DM only, no email anywhere | A question form with a topic, plus the email constant wired everywhere it appears |
| Reviews | Six PNG screenshots | Text, indexable and readable by a screen reader |
| Page titles | Three of four are unedited platform defaults (`Store 1 — MI Gas`) | Written per page, brand appended once |
| Product pages | One shared platform-generated description | A description written from each guide's own data |
| The bundle | A fifth tile among four cheaper ones | Its own row, first on the page, with the saving derived from the guide prices |
| Store | Seven items, every one sold out, discovered one at a time | Said once at the top, with a restock list |
| Structured data | None | `ProfessionalService` and `Service`, placeholder fields omitted rather than invented |
| Dead product URLs | Roughly twice as many URLs as products | A 404 that routes |

## The booking flow

`components/Booking.tsx`, `app/actions.ts`, `lib/slots.ts`, `lib/ics.ts`.

**What makes it better than a scheduler:**

- **It asks the right eight questions.** Stage, canopy, media, feed, lights, nutrients,
  runoff, and what you want out of the call. Every scheduling tool has a free-text box; none
  of them knows what to put in it. That list is the product and it lives in `lib/site.ts` so
  he can rewrite it without touching a component.
- **Photos work off a phone.** A canopy photo is 3–8 MB and a serverless request body caps
  out around 4.5 MB, so four straight off a camera roll physically cannot be posted. The
  browser decodes and downscales each to 1600px before it leaves the device. Measured:
  7.23 MB of source photos → 1.21 MB posted. They then arrive as attachments on the brief,
  renamed `photo-1.jpg`, so his inbox is not full of `IMG_4821.jpg` from four growers.
- **It sends a real calendar invite**, to him and to the grower, with a 30-minute alarm.
- **Slot lengths are honest.** One 30-minute grid, each slot carrying the longest session
  that still fits its window, so a 90-minute consult is not offered at 11:30 in a window
  that closes at noon.
- **One timezone, labelled.** Times are Eastern and say so, rather than being silently
  converted to the visitor's browser. A call missed by an hour costs more than a label.
- **It works with JavaScript off.** The steps are real fieldsets in one real form posting to
  a server action. With no script a `<noscript>` stylesheet un-hides every step and it
  becomes one long form that still validates and still submits. Verified: an empty submit
  returns 12 server-side messages, a slot too short for the chosen session is rejected with
  a sentence explaining why, and the answers come back filled in rather than wiped.

**What it deliberately is not:**

- **Not a calendar.** It does not know what is already booked, does not sync, and does not
  stop two people taking the same 9am four seconds apart. Slots come from a weekly pattern.
  Hand-writing live availability is how you get double-booked. The seam is `slotGrid()` in
  `lib/slots.ts`. Mitigation in the meantime: every confirmed call lands in his own calendar
  as a real event, so his calendar is the record.
- **It takes no card.** Not laziness — unresolved. Stripe's published restricted-business
  list prohibits *"Courses and information on cultivating marijuana"*, and Calendly, Acuity
  and Setmore all settle through Stripe, Square or PayPal. Which processor will underwrite
  him is a question for him and his bank, and a checkout built against the wrong answer is
  work done twice.

## Environment

Set these in the hosting dashboard. Never in the repo, never in a commit, never pasted into
a chat window.

| Variable | Effect if unset |
| --- | --- |
| `SMTP_HOST` | **Bookings go nowhere but the server log.** The form still succeeds for the visitor — a form that errors because of an unset environment variable teaches people it is broken — and the full brief is written to the log. Set this before anyone real uses the site. |
| `SMTP_PORT` | Defaults to `587` (STARTTLS). Use `465` for implicit TLS; the code switches `secure` on that number, and getting it backwards fails by hanging. |
| `SMTP_USER` / `SMTP_PASS` | Omitted means an unauthenticated relay, which almost no provider allows. |
| `SMTP_FROM` | Falls back to `SMTP_USER`. Must be an address that mailbox is allowed to send as. |
| `MIGAS_NOTIFY_TO` | Falls back to `SITE.email`, which is a placeholder — so notification is skipped until one or the other is real. |

Any mailbox with SMTP works: his own domain mail, Google Workspace, Fastmail, whatever he
already has. No new account and no new bill.

## Everything he has to supply

Search for `PLACEHOLDER`. Every one is deliberate and marked in place. In rough order of what
it costs to leave alone:

1. **An email address.** `SITE.email`. There is no contact address anywhere on the live site.
   An operator who will not DM a stranger currently has no way to reach him at all.
2. **Who processes his payments** — and has anyone ever asked them about the cannabis
   education category? Everything about how money moves depends on this answer.
3. **His logo, as a file.** `components/Mark.tsx` is a stand-in and says so. The real mark
   cannot be traced from a screenshot: the letters overhang the sun onto pure black, so the
   parts that leave the disc are indistinguishable from the background.
4. **Consulting rates.** `SESSIONS`. He has never published any, so $150/$300/$500 is a
   proposal built from published comparables in the niche and from the principle that a live
   hour should cost more than a $200 guide. It should not survive contact with him.
5. **Review text.** `REVIEWS`. Transcribe the six images on the live site. Highest-return
   hour on the project — the cards render as visible empty slots until then, because
   inventing a testimonial is not a placeholder.
6. **His availability.** `AVAILABILITY.windows`. Currently a plausible shape, not his diary.
7. **The runoff numbers on the diagram.** `DIAGRAM`. A specific runoff target on a
   consultant's page reads as his recommendation. Confirm them or the labels go generic.
8. **The facility name.** `SITE.facility`. The site claims "director of Michigan's top
   licensed cannabis facility" and never names it — the strongest credibility asset he has,
   going unused. Plenty of people keep their employer separate from their personal brand
   deliberately, so ask before filling it in.
9. **Store product URLs.** `buyUrl` on each guide. The guides already sell today. A URL there
   turns the request form into a real buy button with no code change.
10. **Confidentiality, rescheduling, and the guide-credit question.** `FAQ`. Licensed
    operators will ask about the first before they book.

## The look

Everything is sampled from his own logo — a black interlocked wordmark over a burning sun on
pure black. The disc measures `#CC5528`, the corona `#F7C063`, the sunspots `#802715`, the
background literally `#000000`. `tailwind.config.ts` holds the whole palette with every
measured contrast ratio in the comment, and nothing else in the app hardcodes a colour,
including the sun and the fertigation diagram.

Two accents, and the split comes from the photograph: `ember` is the disc and fills things
(buttons, plates), `flare` is the corona and writes things (links, eyebrows). One token for
both gives you either unreadable links or washed-out buttons. Button labels are `ink` on
`ember` — black on fire, which is his logo's own device, measured at 5.44.

## Layout

```
lib/site.ts     Every fact about the business. One edit per correction.
lib/slots.ts    Slot generation, timezone handling, and the calendar seam.
lib/ics.ts      Calendar invites, hand-rolled. Timezone conversion and RFC 5545 folding.
lib/forms.ts    Form types and limits — NOT in app/actions.ts, see below.
app/actions.ts  The four server actions, SMTP, and photo attachments.
app/globals.css Component classes and every @keyframes on the site.
tailwind.config.ts  The whole palette, with measured contrast ratios.
components/Sun.tsx      His sun, drawn and alive.
components/FeedRig.tsx  The fertigation diagram on /guides.
components/Booking.tsx  The booking flow.
```

## Traps, all of them hit during this build

**Tailwind purges `@keyframes` declared in `tailwind.config.js`** unless the matching
`animate-*` utility appears in scanned markup. A plain CSS rule naming the animation does not
count. The symptom looks healthy — `animation-play-state` reads `running`,
`animation-duration` reads the full value — and the transform never changes. Every keyframe on
this site is in `app/globals.css`, next to the rule that uses it. Leave them there.

**Never put `position` in a component class that also takes caller classes.** `.sun {
position: relative }` is declared after `@tailwind utilities` at the same specificity, so it
beat an `absolute` utility and the sun laid itself out in the flow, silently ignoring every
offset it had been handed. Positioning belongs on an outer element the caller styles; the
class owns an inner one.

**Duplicate SVG ids are undefined behaviour, and a component can appear twice.** The sun's
prominences were softened with `<filter id="sunPromSoft">`; the home page renders two suns, so
two identical ids shipped, and `url(#sunPromSoft)` resolved to whichever came first — a
different SVG with a different coordinate space. The result was a small dark square painted at
the sun's top-left corner in every screenshot, looking like a browser glitch. If a component
can render more than once, it cannot own a fixed id. The glow is two stacked strokes now, no
filter, nothing to collide.

**A CSS `transform` overrides an SVG `transform` attribute completely.** `<path
transform="translate(118 102)">` animated with `translateY()` loses the translate and draws at
the viewBox origin. All three feed drops animated in the corner of the graphic. Position goes
on a wrapping `<g>`, motion on the child. Never both on one node. And
**`transform-box: fill-box`** is required for a transform on an SVG child, or
`transform-origin: 50% 50%` means the middle of the whole drawing.

**A quadratic Bézier passes through `(P0 + 2C + P2) / 4` at its midpoint, not through `C`.**
Put the intended apex at the control point and the arc reaches half as far as you wanted.
`lib/../components/Sun.tsx` solves the control point backwards from the apex.

**Measure where a graphic actually lands on screen, not where it is in its own coordinates.**
Both prominences were correct in the viewBox and invisible on the page — one of them at
y = -73, above the viewport, because the sun is cropped differently in each place it appears.
Nothing about the code looked wrong.

**A `use server` file may only export async functions.** Exporting an initial-state object
from `app/actions.ts` fails the build with `A "use server" file can only export async
functions, found object`, and the error names the file rather than the export. That is the
entire reason `lib/forms.ts` exists.

**Never put `required` on an input inside a hidden container.** A required control that cannot
be focused makes the browser refuse to submit while logging the reason to a console nobody has
open — the form silently stops working. This build uses `aria-required` plus a check per step
plus the same rules again on the server.

**An `sr-only` radio inside a label has nowhere to draw its focus ring.** 72 time slots,
keyboard-navigable, no visible indication of where you are. Fixed with the peer pattern:
`peer sr-only` on the input, `peer-checked:` and `peer-focus-visible:` on a sibling span. That
also makes the selected state survive with JavaScript off, which React state cannot.

**Clear a field's error when it is fixed, not at the next step.** The first version merged a
client error map over a server one, so a server error the visitor had already corrected had
nothing to clear it and sat under a filled-in field.

**`DTSTART;TZID=...` without a VTIMEZONE block** makes some calendar clients quietly guess
UTC — a call an hour or four out, with no error anywhere. Convert to a real instant and emit
`...Z`. Resolve the zone offset twice, because the offset depends on the instant and the
instant depends on the offset.

**Kill stale dev servers by PID and confirm the port is clear** before believing any
measurement. An old process still holding the port serves the old build, the new stylesheet
404s, the page renders unstyled, and the audit reports overflow and console errors that do not
exist. Never `pkill -f "next start"` — that pattern matches your own shell. And `cd` into the
project before running anything: one build in this session compiled a different repo entirely
and served it on the port the tests were pointed at.

## Verifying

Harnesses live in the `glazedweb` repo under `tools/`. Point them at a **production build**,
never the dev server.

```bash
rm -rf .next && npm run build && npx next start -p 4491 -H 127.0.0.1 &
node tools/audit.mjs     --base http://127.0.0.1:4491 --routes /,/consulting,/guides,/guides/flower,/guides/complete,/shop,/reviews,/connect
node tools/contrast.mjs  --base http://127.0.0.1:4491 --routes /,/consulting,/guides,/shop,/connect,/reviews
node tools/animating.mjs --url  http://127.0.0.1:4491/ --selector ".sun-cell-1"
```

Current state: **0 axe violations, no horizontal overflow, no console errors, no 4xx/5xx**
across eight routes at 390px and 1440px. No contrast failures. Reduced motion leaves nothing
hidden and rests the sun and the diagram on complete frames. With JavaScript disabled, nothing
is hidden and the booking form submits and validates.

## Going live

Three things change together and none works alone. A `robots.txt` that allows crawling while
an `X-Robots-Tag` header says `noindex` is still noindexed, and that is hard to spot from the
outside.

1. `app/robots.ts` — allow `/`, add `sitemap`
2. `next.config.ts` — delete the `headers()` block
3. `app/layout.tsx` — delete `robots` from the `metadata` export

Then: set the SMTP variables, fill in the `PLACEHOLDER` list above, and point the domain.
