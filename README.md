# MI Gas

A Next.js rebuild of [mi-gas.net](https://mi-gas.net) around the thing he actually asked
for: *"Need to streamline my consulting calls and have a calendar like Calendly but make
the whole experience better. Actually more of a revamp."*

**Status: he is in.** The owner call of 2026-08-27 turned the pitch into a build and set
the direction the site now follows: no merch, no guide selling (the Patreon is advertised
instead), consulting at his stated $250 an hour, a new co-management offer in his own
terms, and a booking flow whose availability he can edit himself at `/admin` and which
reads his own calendar back to close the double-booking gap.

**It is still noindexed**, because it still serves from migas.glazedweb.com while his
domain points at Squarespace. See [Going live](#going-live) — three separate things have
to change together on cutover day, and the pitch page at the host root comes down with
them.

---

## Nothing here is rented

There is no SaaS in this build. Not a scheduling service, not a hosted email API, not an
object store, not an analytics script, not a font served from someone else's CDN at runtime.
That is a deliberate constraint, and it is the reason a few things are written out longhand
below instead of installed.

| The thing a site like this usually rents | What it does here |
| --- | --- |
| Calendly / Acuity, ~$16–$50/mo | Slots from windows he edits at `/admin`, stored as one JSON document, rendered as real radio inputs (`lib/slots.ts`, `lib/availability.ts`) |
| Live availability sync | His own calendar's private iCal address, read back by `lib/busy.ts`: an event on his calendar removes the slots it covers |
| Calendar invites | `lib/ics.ts` — RFC 5545 is a text format from 1998 and about eighty lines of it |
| Hosted email API | Plain SMTP through a mailbox he already pays for, via `nodemailer` (MIT) |
| Object storage for uploads | Photos ride along as MIME attachments on the brief. Nothing to host, nothing to expire |
| Web fonts | `next/font` downloads Archivo and Inter **at build time** and serves them from his own domain. No runtime request to Google, no cost, ever |
| A stock hero image | The sun is drawn in CSS (`components/Sun.tsx`). No photograph, no licence question, no kilobytes |
| Analytics / chat widget / cookie banner | None. There is nothing to consent to |

The full runtime dependency list is `next`, `react`, `react-dom`, `nodemailer`, and
`@vercel/blob`. Everything else is a build tool. The Blob store deserves its sentence:
it is Vercel's own storage riding on the hosting he already has, holding one small JSON
document of availability, inside the free allowance by orders of magnitude. It is the
one place this build stores anything, and if the token is unset the site serves the
defaults in `lib/site.ts` and says so on `/admin` rather than erroring.

The one thing that is not free is hosting, which is his existing choice, and Vercel's free
tier covers a site this size.

## What this does that the current site does not

| | Now | Here |
| --- | --- | --- |
| Booking a consult | Instagram DM | Session length → room intake → photos → time → a written brief, the photos and a calendar invite in his inbox before the call |
| Calendar | none | An `.ics` to both sides, his calendar read back so booked times drop off the grid, and his hours editable at `/admin` |
| Consulting price | Never published | $250 an hour, his number from the 2026-08-27 call, one constant |
| Co-management | Nowhere | Its own page, in his own terms: per-light pricing, the sensor requirement, the head-grower condition, and an application at `#apply` that collects the room (capture, not wall: disqualifying answers still send, flagged in his ticket) |
| The visitor who will not do an intake | Lost | Three fields at `/consulting#call`: name, one of phone or email, and we call them |
| The Patreon | A bare link | One section with the checkable numbers off his public page and a seam for his dashboard data |
| Contact | Instagram DM only, no email anywhere | A question form with a topic, plus the email constant wired everywhere it appears |
| Reviews | Six PNG screenshots | Text, indexable and readable by a screen reader |
| Page titles | Three of four are unedited platform defaults (`Store 1 — MI Gas`) | Written per page, brand appended once |
| Structured data | None | `ProfessionalService` and two `Service` nodes, placeholder fields omitted rather than invented |
| Dead product URLs | Roughly twice as many URLs as products | A 404 that routes — which now also catches this build's own retired `/guides` and `/shop` |

## The booking flow

`components/Booking.tsx`, `app/actions.ts`, `lib/slots.ts`, `lib/availability.ts`,
`lib/busy.ts`, `lib/ics.ts`, and the admin at `app/admin/`.

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

**The availability loop, closed on 2026-08-27.** The seam this section used to describe
is filled:

- **He edits his own hours at `/admin`** — weekly windows, days off, lead time and
  horizon — behind a PIN (`MIGAS_ADMIN_PIN`), saved as one JSON document in the
  project's Blob store, no commit needed. The page is plain forms posting server
  actions, so it works from a phone in a grow room with no JavaScript downloaded.
- **His calendar removes taken times.** `MIGAS_BUSY_ICS_URL` points at the private
  iCal address of his own calendar. Every event on it removes or shortens the slots it
  covers, and the loop closes through the invite: a confirmed booking lands on his
  calendar, the feed carries it, the slot is gone for the next visitor. Recurring
  events are deliberately not expanded (counted and logged instead) — recurring
  commitments belong in the windows, the feed exists for one-off collisions. Every
  feed failure is open: unset, unreachable or unparseable, the grid renders from the
  windows alone and the form stays up.
- **The last four seconds are still honest.** Two visitors submitting the same moment
  before the first booking reaches his calendar both pass. He confirms by reply, so
  that collision costs an apology rather than a no-show.

**What it deliberately is not:**

- **It takes no card.** Not laziness — unresolved. Stripe's published restricted-business
  list prohibits *"Courses and information on cultivating marijuana"*, and Calendly, Acuity
  and Setmore all settle through Stripe, Square or PayPal. Which processor will underwrite
  him is a question for him and his bank, and a checkout built against the wrong answer is
  work done twice. First question on that path: what settles his existing Squarespace
  store sales today, and does it know what it is settling?

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
| `MIGAS_ADMIN_PIN` | `/admin` says it is not switched on and nothing can sign in. |
| `BLOB_READ_WRITE_TOKEN` | Availability edits cannot be saved; the grid serves the `lib/site.ts` defaults and `/admin` says so. Written by Vercel when a Blob store is attached to the project. |
| `MIGAS_BUSY_ICS_URL` | Slots come from the windows alone, exactly as before the feed existed. Set it to his calendar's private iCal address; treat that URL as a secret. |

Any mailbox with SMTP works: his own domain mail, Google Workspace, Fastmail, whatever he
already has. No new account and no new bill.

## Their assets — permission, and where they live

**Permission granted by Kevin, 10 Aug 2026: we may take the logo and photographs from
mi-gas.net for this build.** Recorded here because "we have permission" is the kind of thing
that lives in one person's memory and needs to survive them being on holiday.

The site is Squarespace, so everything is on `images.squarespace-cdn.com` under the account
prefix `64c303be135c1c0effa95844`. The CDN accepts a `?format=` parameter, so append
`?format=2500w` to any of these to get the largest rendition rather than the resized one the
page happens to request.

| what | file |
| --- | --- |
| **Logo, primary** | `1c64c4cd-f109-4d1f-9f54-acbad40f7296/FullLogo.png` |
| **Logo, white** | `2ade2437-7442-470b-8be5-813d7b14838c/Social+Signature+Logo-white.png` |
| **The wordmark artwork, letterforms only** | `01ec6738-16ae-4a59-ac49-993c52e440d1/IMG_5497+2.png`. Recorded here as "hero image" until 2026-08-28, when actually looking at it showed the interlocked MIGAS lockup in solid black on white — the exact letterforms the checklist item below has been waiting for, at 2500w. |
| Flower Guide cover | `b07c8fa5-5ea0-4e5e-ac6c-d3a8adfa404e/FGbutton2.png` |
| Veg Guide cover | `6e2acba9-6ede-4684-97a2-714b9a6f5a73/VGbutton2.png` |
| Hand-Water to Automation cover | `695c835f-a131-4967-9ffc-54155b4e2143/HWGButton2.png` |
| The Complete Package cover | `c57047d7-d9da-40a1-ab00-c13da3d4cc10/TCPbutton2.png` |
| Run-Off Guide cover | `bfbe6a96-ab4a-4d25-9c40-aa3dd48add9e/ROGbutton2.png` |
| Merch/lifestyle shoot | `IMG_9011.jpg` – `IMG_9060.jpg`, same prefix, timestamped UUIDs. Recorded as "grow gallery" until 2026-08-28; rendering them showed a beach merch shoot, no rooms in it. |
| **Room photos, shipped** | `public/assets/rooms/{bench,canopy,cola}.webp`, on the home Patreon section. The three homepage gallery images with no photographer credit; several others are credited to @greenmitten and stay off until he clears them, because the owner's permission covers his photographs, not a third photographer's. Sources are Instagram-sized (720w originals); the fourth candidate existed only at 320px and was dropped rather than upscaled. |

The five covers mapped one-to-one onto the guide list this build used to sell — retired
2026-08-27 when he took guide selling off the site. The URLs stay recorded because
permission was granted and the covers may yet be wanted for the Patreon section.

**The white signature logo is probably the one to use.** This build is near-black
(`ink #060403`) and the primary is likely dark-on-transparent.

### The wordmark is still a stand-in, and this is what replaces it

`components/Mark.tsx` sets MIGAS in this build's own display face because his letterforms
could not be traced: they overhang the sun onto pure black, so the strokes leaving the disc
are indistinguishable from the background. That reasoning still holds for tracing, and it is
now moot — `FullLogo.png` is the real artwork.

What is still worth having beyond the PNG:

- **A vector, if it exists** (SVG, AI, EPS, PDF). A wordmark that has to render crisply from
  nav size to poster size wants to be vector. A PNG at 2500w will do for the web but it
  cannot be recoloured, animated, or set as a favicon cleanly.
- **The typeface name**, if he knows it. If the wordmark is set type rather than custom
  lettering, having the font means headings elsewhere on the site can share it, which is what
  makes a site look like the brand rather than like a site with the brand's logo on it.

Until one of those arrives the PNG is a straight upgrade on the stand-in and should be
dropped in as `public/brand/logo.png`, with `Mark.tsx` swapped for an `<Image>`.

**Update, 2026-08-28: the letterforms exist as a file after all.** `IMG_5497+2.png` in
the assets table above is the interlocked lockup in solid black on white at 2500w — no
sun behind it, so the tracing problem this section describes does not apply to it. That
makes the wordmark swap (or a proper trace to SVG from clean black-on-white) unblocked
work rather than a request to him. The typeface question stands.

## Before launch

Real unchecked boxes, because a numbered list of caveats reads as commentary and a checklist
reads as work. Search for `PLACEHOLDER` to find each one in place. Ordered by what it costs
to leave alone.

- [ ] **An email address.** `SITE.email`. There is no contact address anywhere on the live site.
      An operator who will not DM a stranger currently has no way to reach him at all. It also
      unlocks the true `METHOD:REQUEST` invite (see `lib/ics.ts`).
- [ ] **Set the booking environment, then book a real test call end to end.**
      `MIGAS_ADMIN_PIN`, a Blob store on the Vercel project, `MIGAS_BUSY_ICS_URL` from his
      calendar's private iCal address, and the SMTP set. `/admin` shows all four as a status
      panel, red until real. Done means: a test booking arrives in his inbox with photos and
      invite, lands on his phone calendar, and the slot disappears from the grid.
- [ ] **The co-management project minimum.** `COMANAGEMENT`. He said a minimum exists and
      did not put a figure on it. The page says "a project minimum applies" without a number
      until he sets one.
- [ ] **Confirm the 30 and 90 minute prices.** $250/hr is his; $125 and $375 are pro-rata
      arithmetic on it. If calls start at a full hour, delete the 30-minute session from
      `SESSIONS` and nothing else changes.
- [ ] **Patreon growth data and member quotes.** `PATREON.growth` and `PATREON.quotes`. Both
      come from his own dashboard; the section renders without them until they land. Refresh
      `PATREON.stats` from the public page and bump `checkedOn` when touched. **Read the
      warning on `PATREON.growth` first**: the public paid-member history declines from a
      Dec 2023 peak of 129 to 45 now, so the strip must come from his total-member or
      follower history — and if that line does not rise either, ship no strip.
- [ ] **Review text.** `REVIEWS`. Transcribe the six images on the live site. Highest-return
      hour on the project — the cards render as visible empty slots until then, because
      inventing a testimonial is not a placeholder.
- [ ] **His logo, as a file — the letterforms only.** `components/Mark.tsx` now reproduces the
      lockup's actual construction: MIGAS set once, then again directly beneath as a vertical
      mirror, the two rows meeting on a shared axis. That was verified against his artwork
      rather than assumed — masking the letters off the sun and comparing the halves gives an
      intersection-over-union of 0.42 for a vertical flip against 0.37 for a 180° rotation and
      0.13 for anything unmirrored, and his row-ink profile has two peaks with a dip at 51%,
      which is what abutting rows look like. What is still missing is the letterforms: his are
      heavy and angular, closer to blackletter, and they cannot be traced from a screenshot
      because the strokes overhang the disc onto pure black where they are indistinguishable
      from the background.
- [ ] **Who processes his payments** — and has anyone ever asked them about the cannabis
      education category? Everything about how money moves depends on this answer. Start with
      whatever settles his existing Squarespace store sales today.
- [ ] **The runoff numbers on the diagram.** `DIAGRAM`, now rendered on /co-management. A
      specific runoff target on a consultant's page reads as his recommendation. Confirm them
      or the labels go generic.
- [ ] **The facility name.** `SITE.facility`. The site claims "director of Michigan's top
      licensed cannabis facility" and never names it — the strongest credibility asset he has,
      going unused. Plenty of people keep their employer separate from their personal brand
      deliberately, so ask before filling it in.
- [ ] **Sign off on the footer credit, and its wording.** It currently reads "Baked by Glazed
      Web". The pun is the studio's, and in his field "baked" reads a second way — charming to a
      grower, slightly off-message to an institutional buyer, on a site otherwise built in a
      deliberately commercial register. It is our joke in his footer, so it is his call.
      Removing it, or changing the line, is one line in `components/Footer.tsx`.
- [ ] **Confidentiality and rescheduling.** `FAQ`. Licensed operators will ask about the
      first before they book.

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
lib/site.ts         Every fact about the business. One edit per correction.
lib/slots.ts        Slot generation and timezone handling; takes runtime windows + busy.
lib/availability.ts His editable hours: Blob-stored JSON over lib/site.ts defaults,
                    plus openSlots()/bookableSlot(), the two calls everything books through.
lib/busy.ts         His calendar's iCal feed, parsed into busy intervals. Fails open.
lib/admin-auth.ts   The PIN gate for /admin. One operator, one cookie, no store.
lib/ics.ts          Calendar invites, hand-rolled. Timezone conversion and RFC 5545 folding.
lib/forms.ts        Form types and limits — NOT in app/actions.ts, see below.
app/actions.ts      The four actions: booking, co-management application, call
                    request, question. SMTP and photo attachments.
app/admin/          The availability editor. Plain forms, no client JavaScript.
app/co-management/one-pager/  The model as a printable document: ink on bone,
                    strokes-only diagram, survives print background-stripping.
                    Reads the same constants as the page, so it cannot drift.
app/og-card/co-management/    Source frame for public/og-comanagement.jpg, the
                    /co-management page's own link card (that page gets forwarded).
components/Faq.tsx  Draft-vs-answered FAQ rendering, shared by both FAQ pages.
app/globals.css     Component classes and every @keyframes on the site.
tailwind.config.ts  The whole palette, with measured contrast ratios.
components/Sun.tsx      His sun, drawn and alive.
components/FeedRig.tsx  The fertigation diagram, now on /co-management.
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
node tools/audit.mjs     --base http://127.0.0.1:4491 --routes /,/consulting,/co-management,/reviews,/connect,/admin
node tools/contrast.mjs  --base http://127.0.0.1:4491 --routes /,/consulting,/co-management,/connect,/reviews,/admin
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

And a fourth that is easy to miss because it is not about robots at all: **`SITE.url` in
`lib/site.ts` points at `https://mi-gas.net`.** Every canonical, every Open Graph URL and
the structured-data `@id`s read from it. While this is a noindexed pitch that is arguably
the right answer — it disclaims the duplicate rather than competing with it — but the day
this deploy *becomes* the site, or the day it moves to a demo host that should own its own
canonicals, that constant has to be whatever host is actually serving it. The same fault is
open on `chism-chicken-ranch` right now, pointing at a `.vercel.app` host.

Then: set the SMTP variables, fill in the `PLACEHOLDER` list above, and point the domain.
