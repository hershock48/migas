/**
 * Every fact about MI Gas, in one place.
 *
 * House rule, and it is not tidiness: a number typed into six pieces of copy gets
 * published wrong. Everything the site states about the business reads from here, so
 * a correction is one edit.
 *
 * THE OWNER CALL, 2026-08-27, which reshaped this file. He is in, and he gave
 * direction that retired half of what used to live here:
 *
 *   - Merch sales are off the site. MERCH is gone with the /shop page.
 *   - The site stops selling the guides. GUIDES and BUNDLE are gone with /guides;
 *     the Patreon is advertised instead of undercut. See PATREON below.
 *   - Consulting is $250 per hour, his number, stated on the call. RATE below.
 *   - A new co-management offer, his whole outline, in COMANAGEMENT below.
 *   - Booking should adjust easily and land on his phone calendar. That work lives
 *     in lib/availability.ts and app/admin, not here.
 *
 * WHAT IS REAL AND WHAT IS NOT. Anything marked PLACEHOLDER was invented or inferred
 * and has to be confirmed before this goes live. The social links were read off
 * mi-gas.net directly and are his. The hourly rate and the co-management terms are
 * his, from the call. The 30 and 90 minute prices are arithmetic on his rate rather
 * than numbers he spoke, and are flagged where they are set.
 *
 * ── HOUSE VOICE ──────────────────────────────────────────────────────────────────────
 * Measured against his own site, because "does it match?" deserves a count rather than an
 * impression. His homepage is ~100 words, every heading lowercase with no full stop, no
 * em-dashes, and it is first person plural: "grow with us", "shop mi gas gear", "follow us
 * on instagram", "teaching, training and advising for indoor cultivators around the world".
 * Warm, and it invites you in alongside him.
 *
 * Ours was none of that, and three habits were doing the damage:
 *
 *   1. FIRST PERSON, ALWAYS. Copy here said "he" 21 times — "He has read your intake",
 *      "Tell him about the room", "How did you find him?". Third person is how an agency
 *      describes a client, which is why the site could read as a case study about him
 *      instead of his own shop. It is now "we" throughout. The only third person left is
 *      in the dashed-border build notes and the PLACEHOLDER answers, which are addressed
 *      to us about him and come off at launch.
 *
 *   2. NO FULL STOP ON A HEADING FRAGMENT. 18 of 27 headings ended in one: "Start where
 *      you actually are." / "Three lengths." / "Between runs." A period on a fragment makes
 *      a line land like a verdict, which is a real device and a good one — until it is the
 *      only device, at which point the reader hears the rhythm instead of the content. Down
 *      to 3, and all three are complete sentences that earn it: the h1, the closing line,
 *      and "A program teaches. A call answers."
 *
 *   3. ANTITHESIS IS RATIONED. Nine "X, not Y" constructions: "not a forum thread", "not a
 *      highlight reel", "not the calendar", "not the introduction", "not a tip", "not a
 *      recording nobody rewatches". One is sharp. Nine is a tic, and it frames every claim
 *      against what somebody else does badly, which reads defensive on a site with real
 *      credentials. Down to three, each doing work a positive statement could not: a
 *      technical instruction ("day and night numbers, not averages"), a factual correction
 *      ("a proposal, not published prices"), and one joke ("Here for the growing, not the
 *      hoodie?").
 *
 * What deliberately did NOT change: the specificity. "Every call starts with an
 * eight-question room intake and your photos, read before you dial in" sells the actual
 * differentiator, and his own site never explains what a buyer gets. Sounding more like him
 * was never the goal — sounding like him on a better day was.
 * ─────────────────────────────────────────────────────────────────────────────────────
 */

export const SITE = {
  name: "MI Gas",
  // His Patreon describes the work more sharply than his own website does:
  // "Commercial cannabis cultivation advice, SOPs, and instruction." That is the
  // language that attracts a facility, where "for growers of all sizes" attracts a
  // hobbyist. The site now leads with the commercial framing.
  tagline: "Commercial cannabis cultivation advice, SOPs, and instruction",
  blurb:
    "Teaching, training and advising for indoor cultivators worldwide, from inside a working commercial facility.",
  // PLACEHOLDER. There is no email address anywhere on the current site; the only
  // route to him is an Instagram DM. This is the single biggest fix on the whole
  // build, and the address has to come from him. Everything that says "email" reads
  // this constant.
  email: "PLACEHOLDER@mi-gas.net",
  // PLACEHOLDER. No phone number is published. Leave null and the site renders no
  // phone anywhere rather than a broken tel: link.
  phone: null as string | null,
  /**
   * WHERE THIS BUILD IS SERVED, and it is not their domain. This said
   * "https://mi-gas.net" — the client's live Squarespace site — and it is metadataBase,
   * so every absolute URL in the page's metadata was built against it. Two consequences,
   * both live:
   *
   * og:image resolved to https://mi-gas.net/og.jpg. og.jpg is a file in THIS repo's
   * public/ folder, deployed to migas.glazedweb.com; nothing puts it on their Squarespace
   * domain. So Apple fetched the page fine, read the title, went looking for the image at
   * an address that has never had it, found nothing, and fell back to the compact card
   * with app/apple-icon.png in the little square slot. Which is exactly what he was
   * looking at: the right title, the right domain underneath, and the site favicon
   * instead of the card.
   *
   * og:url resolved to https://mi-gas.net, so every share of this pitch build named their
   * EXISTING site as its canonical address. A platform that follows og:url would have
   * shown their old Squarespace page to somebody we sent here deliberately.
   *
   * On the day this becomes their real site, this becomes https://mi-gas.net and
   * liveSite below goes away with the rest of the pitch scaffolding.
   */
  url: "https://migas.glazedweb.com",
  /** Their current Squarespace site. Referenced where we mean "their existing site",
   *  never as this build's own address. */
  liveSite: "https://mi-gas.net",
  patreon: "https://www.patreon.com/Mi_gas_",
  // Note the capital M. His own site links to the lowercase form, which 403s.
  instagram: "https://instagram.com/mi_gas_2.0",
  // PLACEHOLDER. The homepage claims "director of Michigan's top licensed cannabis
  // facility" and never names it. Naming it is the strongest credibility asset he
  // has going unused — but plenty of people in this industry deliberately keep their
  // employer separate from their personal brand. Ask before filling this in.
  facility: null as string | null,
  region: "Michigan",
} as const;

/**
 * THE PATREON, advertised rather than resold. His direction on the 2026-08-27 call:
 * remove the store, steer away from selling posts, and give the Patreon one section
 * that shows what it actually is, with the proof and a clickable link.
 *
 * Every number in `stats` was read off his public Patreon page on the date recorded,
 * so each one is checkable by anyone who clicks through. They will drift; the page is
 * the authority and this is a snapshot. Re-read the page and bump the date when they
 * are refreshed.
 *
 * `growth` and `quotes` are seams, empty on purpose. He offered his member-growth
 * history and his member comments on the call, and both only exist inside his own
 * Patreon dashboard. Until he exports them the section renders without a chart and
 * without quotes rather than with invented ones.
 */
export const PATREON = {
  url: "https://www.patreon.com/Mi_gas_",
  stats: {
    /** Free and paid together, Patreon's own figure on his public page. This is the
     *  "followers" number and the one the section leads with. */
    totalMembers: 756,
    paidMembers: 45,
    posts: 162,
    priceFrom: 100,
    /** The day the numbers above were read off the public page. */
    checkedOn: "August 28, 2026",
  },
  /**
   * PLACEHOLDER seam: [{ label: "2024", members: 12 }, ...]. Renders a growth strip
   * the moment it has two or more points.
   *
   * FILL THIS FROM HIS DASHBOARD'S TOTAL-MEMBER OR FOLLOWER HISTORY, NOT THE PAID
   * LINE, and here is why that warning earns this much comment. Graphtreon has
   * tracked his paid members daily since launch, and the public history reads:
   * Oct 2021: 6 → end 2021: 62 → end 2022: 110 → peak Dec 2023: 129 → end 2024: 85
   * → end 2025: 73 → Aug 2026: 45 (read 2026-08-28). A strip built from that line
   * showcases a three-year decline on his own homepage. The 756 total members are
   * the growing audience (Patreon's free tier arrived in 2023 and absorbed it), and
   * only his dashboard has that history. If his dashboard's line does not rise
   * either, the honest move is to ship no strip at all, and the section already
   * stands without one.
   */
  growth: [] as { label: string; members: number }[],
  /** PLACEHOLDER seam: member comments he picks, with whatever attribution each
   *  member agreed to. Same rule as REVIEWS: nothing invented, gaps shown honestly. */
  quotes: [] as { quote: string; who: string }[],
} as const;

/**
 * CONSULTING. The rate is his: $250 per hour, stated on the 2026-08-27 call. That
 * retires the "all placeholder" era this block spent its first two weeks in.
 *
 * The three lengths survive because a run in trouble and a facility writing SOPs do
 * not need the same hour. Each price is derived from RATE rather than typed, so the
 * day he moves the rate every card moves with it.
 *
 * ONE DERIVATION TO CONFIRM WITH HIM. He said "$250 per hour". The 30 minute call at
 * $125 and the 90 at $375 are pro-rata arithmetic on that sentence, not prices he
 * spoke. If he would rather hold a one-hour minimum, delete the 30-minute session and
 * nothing else changes.
 */
export const RATE = 250;

/** Pro-rata on RATE. Kept as a function so a price can never disagree with the rate. */
const atRate = (minutes: number) => Math.round((RATE * minutes) / 60);

export type SessionType = {
  slug: string;
  name: string;
  minutes: number;
  price: number;
  summary: string;
  forWho: string;
  includes: string[];
};

export const SESSIONS: SessionType[] = [
  {
    slug: "triage",
    name: "Room Triage",
    minutes: 30,
    price: atRate(30),
    summary: "Something is wrong right now and you need an answer this week.",
    forWho: "A run in trouble: deficiency, pests, a runoff number that will not settle.",
    includes: ["Photo review before the call", "Written next actions after"],
  },
  {
    slug: "program",
    name: "Program Review",
    minutes: 60,
    price: atRate(60),
    summary: "Your whole feed and environment program, examined end to end.",
    forWho: "A grow that works but underperforms, or one you are about to scale.",
    includes: [
      "Full intake and photo review",
      "Written recommendations",
      "One follow-up question thread",
    ],
  },
  {
    slug: "facility",
    name: "Facility Call",
    minutes: 90,
    price: atRate(90),
    summary: "Rooms, SOPs and team, walked end to end with the people who run them.",
    forWho: "Licensed operations, new builds, or a facility weighing co-management.",
    includes: [
      "Full intake and photo review",
      "Written recommendations",
      "Two follow-up question threads",
    ],
  },
];

/**
 * CO-MANAGEMENT. His outline from the 2026-08-27 call, close to verbatim: we run the
 * irrigation and the environment remotely, the head grower on the ground runs the
 * program, and the room gets the results of the licensed facility's playbook without
 * hiring its director.
 *
 * Facts that are his, from the call: the service list, $50 to $150 per light by
 * project size, the sensor requirement including the TrolMaster exclusion, the
 * head-grower condition, the relocation network, optional site visits, genetic
 * sourcing through Bractworx or another nursery, and design-build as an ask.
 *
 * PLACEHOLDER, one number: the project minimum. He said a minimum exists and did not
 * put a figure on it, so the copy says "project minimum" without one. Get the number.
 */
export const COMANAGEMENT = {
  perLight: { from: 50, to: 150 },
  services: [
    {
      name: "Irrigation, run remotely",
      body: "Shot sizes, timings and dryback targets set and adjusted off your sensor data, run by run. The program that gets watched daily, not the one that gets installed and left.",
    },
    {
      name: "Environmental parameters",
      body: "Temperature, humidity and VPD targets per phase, day and night set separately, adjusted as the canopy changes rather than on a calendar.",
    },
    {
      name: "Scheduling, with your labor",
      body: "Defol, transplant, flip and harvest planned against the crew you actually have, so the room never waits on a task and the crew never waits on the room.",
    },
    {
      name: "Cost reduction",
      body: "Feed, media and labor spending reviewed against what the room measurably needs. In our own rooms, dialing salts back cut nutrient cost while holding yield. What yours can cut depends on where it is spending.",
    },
  ],
  /** The conditions, stated up front because they filter better than a form does. */
  requirements: [
    {
      name: "Substrate sensors we can read",
      body: "Aroya, Pinnacle, Growlink or equivalent. Remote steering is only as good as the data feed, and we do not work off TrolMaster sensors.",
    },
    {
      name: "A head grower who runs the program",
      body: "Somebody on the ground has to own the day to day and follow the plan. Co-management steers the room; it cannot walk it.",
    },
  ],
  extras: [
    {
      name: "Head growers, ready to relocate",
      body: "A network of proven, experienced commercial head growers, available and ready to relocate if your room needs its person on the ground.",
    },
    {
      name: "On-site visits, if you want them",
      body: "Regular in-person visits are optional and scheduled around your runs.",
    },
    {
      name: "Genetic sourcing included",
      body: "Clean cuts sourced through Bractworx or another nursery we trust, so a new strain does not arrive carrying somebody else's problem.",
    },
    {
      name: "Design-build, by conversation",
      body: "New rooms and retrofits are taken case by case. Ask on the call.",
    },
  ],
} as const;

/**
 * The intake questions.
 *
 * This is the part no scheduling tool gives you, and the part worth building: the
 * questions themselves. They deliberately mirror his own guide topics — flower, veg,
 * run-off, hand-water to automation — so the form reads as his system rather than a
 * generic contact form, and so his answer is already half-formed before the call.
 *
 * He will have a better list than this. That list IS the product; get it from him.
 */
export const INTAKE = [
  {
    id: "stage",
    label: "What stage is the room in right now?",
    type: "select" as const,
    // Phase names and day ranges are his, from his own published bloom program:
    // days 1-21 post-transplant and stretch, 22-44 end of stretch and bulking,
    // 45 onward ripening and flush. A grower answering in those terms hands him an
    // answer already mapped to the schedule, and reads phase names he will recognise
    // from the guide he is thinking about buying. Same select, no extra friction.
    options: [
      "Clone / early veg",
      "Late veg",
      "Just flipped",
      "Stretch (day 1-21)",
      "Bulking (day 22-44)",
      "Ripening / flush (day 45+)",
      "Between runs",
    ],
    required: true,
  },
  {
    id: "canopy",
    label: "Canopy size",
    type: "select" as const,
    options: ["Under 100 sq ft", "100-500 sq ft", "500-2,000 sq ft", "2,000-10,000 sq ft", "Over 10,000 sq ft"],
    required: true,
  },
  {
    id: "media",
    label: "Growing media",
    type: "select" as const,
    options: ["Rockwool", "Coco", "Soil / living soil", "Peat blend", "Rockwool + coco", "Other"],
    required: true,
  },
  {
    id: "watering",
    label: "How are you feeding?",
    type: "select" as const,
    options: ["Hand-water", "Drip, on a timer", "Drip, sensor-driven", "Flood and drain", "Mixed"],
    required: true,
  },
  {
    id: "lights",
    label: "Lights: type and wattage per light",
    type: "text" as const,
    placeholder: "e.g. 8 × 720W LED, or 12 × 1000W DE HPS. Add PPFD or DLI if you have it.",
    required: true,
  },
  {
    id: "nutrients",
    label: "Nutrient line",
    type: "text" as const,
    placeholder: "Brand and line, or your own salts",
    required: true,
  },
  {
    id: "runoff",
    // Volume first. His runoff method is explicit that if EC and pH look wrong AND
    // the volume is wrong, you fix the volume and re-read before touching the recipe.
    // This asked for the two readings and never asked for the number that qualifies
    // them, so the single most useful answer was the one it could not receive.
    label: "Runoff: how much, and EC and pH if you measure them",
    type: "text" as const,
    placeholder: "e.g. 20% runoff, in 3.0 EC / 5.9 pH, out 4.8 EC / 6.4 pH. Volume alone is useful.",
    required: false,
  },
  {
    id: "problem",
    label: "What do you want to come out of the call?",
    type: "textarea" as const,
    placeholder:
      "The more specific the better. What is happening, when it started, and what you have already tried.",
    required: true,
  },
] as const;

/**
 * PLACEHOLDER, all six.
 *
 * The live site has six reviews and every one of them is an image file — R1.png to
 * R6.png. So the text is invisible to Google, invisible to screen readers, and
 * unreadable by anyone auditing the site. For a consultant, testimonials are the
 * product; these need transcribing from the images and republishing as text with
 * whatever attribution the reviewers agreed to.
 */
export const REVIEWS = [
  { quote: "PLACEHOLDER: transcribe from R1.png on the live site.", who: "PLACEHOLDER", context: "" },
  { quote: "PLACEHOLDER: transcribe from R2.png on the live site.", who: "PLACEHOLDER", context: "" },
  { quote: "PLACEHOLDER: transcribe from R3.png on the live site.", who: "PLACEHOLDER", context: "" },
];

/**
 * The three credibility lines under the hero.
 *
 * Each one is a claim, so each one has to be defensible. These are drawn from what
 * his own site and Patreon already say. Nothing here is an achievement nobody
 * published.
 *
 * WHAT THIS STRIP USED TO BE, AND WHY IT CHANGED. It read "Licensed / 4 / SOPs"
 * and it was not doing the job. Twice it was deferred on the belief that fixing
 * it needed a licence class, a licence number and a canopy figure that only he
 * could supply.
 *
 * His own long-form writing says that is not what he thinks proves anything:
 *
 *   "I don't see them backed up with the work! They usually feature some random
 *    up close nug shots, shots of gardens with somewhat questionable health...
 *    It's hard to even tell if they are their own pictures. You can see the same
 *    rooms every time in our shots, over and over again with new plants and the
 *    same consistent success and quality."
 *
 * So his proof is the rooms over time plus deltas he has already stated in
 * public, and all three lines above are his, not ours. See
 * glaze/clients/migas-voice.md in the glazedweb repo for the sourcing.
 *
 * "Licensed" came out because the hero paragraph and the meta description both
 * already say licensed Michigan facility. Three times on one page is the
 * repetition rule, and a strip is worth more carrying something the hero cannot.
 *
 * ALL THREE ARE PLACEHOLDER UNTIL HE CONFIRMS THEM. The +25-30% and the operating
 * history come from posts of a particular date and those numbers move. Ask him
 * which figures he is happy to publish, and run any licence wording past him
 * separately, because what a licensed operator may claim about their licence is
 * his lawyer's question and not ours.
 */
export const CREDS = [
  // PLACEHOLDER on all three figures until he confirms them. See below.
  {
    stat: "+25-30%",
    label: "Average THC per strain, after we moved the program to lower EC",
  },
  {
    stat: "Same rooms",
    label: "Every run shot in the same rooms, new plants, one after another",
  },
  {
    stat: "Tissue tested",
    label: "Foliar analysis run on our own crop, results published",
  },
];

/**
 * Numbers on the hero diagram. PLACEHOLDER, and of everything invented in this build
 * these are the ones that would embarrass him fastest: a specific runoff target on a
 * consultant's homepage reads as his recommendation. They are illustrative only, they
 * live here so they are one edit, and they either come from him or the labels go
 * generic before launch.
 */
export const DIAGRAM = {
  inLabel: "Feed in",
  // Two short lines rather than one long one, and that is a layout decision as much as a
  // typographic one: "3.0 EC · 5.9 pH" set on one line needed a label column wide enough
  // to hold it, which squeezed the drawing itself into half the frame on a phone. Split,
  // the column is half as wide and the rig is a quarter bigger.
  inValues: ["3.0 EC", "5.9 pH"],
  outLabel: "Runoff out",
  outValues: ["4.8 EC", "6.4 pH"],
  caption:
    "An illustration, not a target: runoff coming back higher than it went in is a room stacking salt. Reading it is how you catch that.",
};

/**
 * AVAILABILITY — PLACEHOLDER, every field.
 *
 * These windows are a plausible shape for a working facility director, not his
 * calendar. Two honest notes about what this is and is not:
 *
 * Slots are generated from these windows in lib/slots.ts and rendered as real radio
 * inputs, so the booking form works with JavaScript switched off. What it does NOT do
 * is know whether a slot is already taken, sync to his calendar, or handle two people
 * submitting the same slot four seconds apart. That is a live-availability problem,
 * and hand-writing it is how you end up double-booked at 9am on a Tuesday. The seam
 * is in lib/slots.ts and the README says exactly where a calendar feed plugs in.
 *
 * Times are shown in one timezone, labelled, rather than guessed from the visitor's
 * browser. A wrong timezone is a missed call.
 */
/**
 * THE LINK PREVIEW IMAGE, in one place, because Next does NOT deep-merge `openGraph`.
 * A page that defines its own openGraph REPLACES the parent's object rather than adding to
 * it, so the five guide pages — which set their own title and description, and are the
 * pages most likely to actually get pasted to somebody, since they are the products —
 * emitted no og:image at all while every other route had one. Verified in the served HTML
 * before and after. Spread this into any openGraph block instead of restating it.
 */
export const OG_IMAGE = {
  url: "/og.jpg",
  width: 1200,
  height: 630,
  alt: "The MI Gas mark over a burning sun, with the words Grow with us",
} as const;

export const AVAILABILITY = {
  timeZone: "America/Detroit",
  timeZoneLabel: "Eastern (Michigan)",
  /** 0 = Sunday. Windows are local to timeZone. */
  windows: [
    { day: 1, from: "09:00", to: "12:00" },
    { day: 2, from: "09:00", to: "12:00" },
    { day: 2, from: "14:00", to: "17:00" },
    { day: 3, from: "14:00", to: "17:00" },
    { day: 4, from: "09:00", to: "12:00" },
    { day: 4, from: "14:00", to: "17:00" },
  ],
  /** Days ahead to offer. Two weeks looks booked without looking absent, and keeps the
   *  server-rendered slot grid to a size a phone can hold. */
  horizonDays: 14,
  /** Nothing inside this many days, so intake and photos land before the call. */
  leadDays: 2,
  stepMinutes: 30,
} as const;

/**
 * What happens around the call. This is the actual answer to "make the whole
 * experience better" — the booking widget is not the product, the choreography is.
 */
export const PROCESS = [
  {
    step: "Before",
    title: "The room comes before the calendar",
    body:
      "Stage, canopy, media, feed, lights, runoff numbers, and photos of the problem. Eight questions, two minutes, and they are the questions we would otherwise spend the first twenty minutes of your call asking.",
  },
  {
    step: "The call",
    // Deliberately NOT "the call opens at the diagnosis", which was the first rewrite: this
    // step sits on the consulting page directly under an h1 reading "A call that starts at the
    // diagnosis", and the two said the same thing twice within one screen. A step title should
    // add the next fact, not restate the heading above it.
    title: "Straight into the problem",
    body:
      "We have read your intake and looked at your photos before you dial in. Thirty minutes that skip the setup are worth more than an hour that does not.",
  },
  {
    step: "After",
    title: "Written actions you can hand to a grower",
    body:
      "A short written set of next actions, in order, that somebody on your team can execute on Monday without having been on the call.",
  },
];

/**
 * FAQ. Four of these are answers only he can give, marked so. They are written out
 * anyway because the questions get asked whether or not the site answers them, and an
 * empty FAQ is worse than a draft one.
 */
export const FAQ = [
  {
    q: "How do I pay?",
    // PLACEHOLDER. Genuinely unresolved and not a detail: Stripe's published
    // restricted-business list prohibits "Courses and information on cultivating
    // marijuana", and Calendly, Acuity and Setmore all settle through Stripe, Square
    // or PayPal. This is the single biggest open question on the build and the reason
    // the booking flow deliberately stops before taking a card.
    a: "PLACEHOLDER: payment route to be confirmed. Right now a booking request reaches us and we send you an invoice to settle before the call.",
  },
  {
    q: "What if I need to move it?",
    a: "PLACEHOLDER: reply to your confirmation and we will move it, up to 24 hours before. Inside 24 hours the slot is held.",
  },
  {
    q: "Is what I tell you confidential?",
    a: "PLACEHOLDER: he needs to write this one himself. Licensed operators will ask, and for a facility consult it decides whether they book.",
  },
  {
    q: "Will you look at photos before the call?",
    a: "Yes, and that is the point of the intake. Photos of the room, the canopy and whatever is going wrong go up with your booking, and we read them before you speak.",
  },
  {
    q: "Do you consult outside Michigan?",
    a: "Yes. Calls are remote, and the methods are not state-specific. Co-management and facility work in other states is case by case.",
  },
  {
    q: "What does co-management need from my room?",
    a: "Substrate sensors we can read remotely, Aroya, Pinnacle, Growlink or equivalent, and a head grower on the ground who will run the program. Both are firm. The details are on the co-management page.",
  },
];

export const NAV = [
  { href: "/consulting", label: "Consulting" },
  { href: "/co-management", label: "Co-Management" },
  { href: "/reviews", label: "Reviews" },
  { href: "/connect", label: "Connect" },
];

export const money = (n: number) =>
  n % 1 === 0 ? `$${n.toLocaleString("en-US")}` : `$${n.toFixed(2)}`;
