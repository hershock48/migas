/**
 * Every fact about MI Gas, in one place.
 *
 * House rule, and it is not tidiness: a number typed into six pieces of copy gets
 * published wrong. Everything the site states about the business reads from here, so
 * a correction is one edit.
 *
 * WHAT IS REAL AND WHAT IS NOT. Anything marked PLACEHOLDER was invented or inferred
 * and has to be confirmed before this goes live. The guide names and prices, the merch
 * and its prices, and the social links were all read off mi-gas.net directly and are
 * his. The consulting session types and rates are a proposal — he has never published
 * rates, so somebody has to invent a starting point and it should not survive contact
 * with him.
 *
 * ONE ATTRIBUTION TO RE-CHECK. The four guide `blurb` strings were recorded here as read
 * verbatim off his site, and they do not read like his site. His published voice is
 * all-lowercase and loose; these are ours. Either they came off a product page written in
 * a different register, or the attribution is wrong. A later attempt to re-verify failed —
 * his /guides page is not fetchable and his subpages are not indexed — so this is flagged
 * rather than resolved. Confirm with him before launch: publishing our words as his is a
 * worse fault than a blurb that needs rewriting.
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

export type Guide = {
  slug: string;
  name: string;
  price: number;
  blurb: string;
  includes: string[];
  covers: string;
  /**
   * The live product URL on his existing store.
   *
   * Null everywhere for now, and that is the seam rather than an omission: with a URL
   * here the page renders a real buy button straight to his working checkout; without
   * one it renders a request form and he invoices. The guides already sell today, so
   * pasting four URLs in is the difference between a demo and a shop — and it needs no
   * code change to happen.
   */
  buyUrl?: string | null;
  /** Longer sell copy for the guide's own page. Kept separate from `blurb`, which has to
   *  work in a four-across grid. */
  detail?: string[];
};

/**
 * Read verbatim off mi-gas.net. Prices, names and the `blurb` copy are his.
 *
 * The `detail` lines are new writing, and they are framing rather than content: what the
 * program is, who it suits, what arrives. Nothing in them claims a technique or a number
 * he has not published. Filling a sales page with invented specifics is how you sell
 * something the product does not contain.
 */
export const GUIDES: Guide[] = [
  {
    slug: "flower",
    name: "Flower Guide",
    price: 200,
    blurb:
      "The entire flower program as MI Gas runs it, flip to harvest. Methods and practices that apply to gardens of any size.",
    includes: ["Guide video library", "Downloadable PDF"],
    covers: "Flip to harvest",
    buyUrl: null,
    detail: [
      "The flower program as it is actually run in a licensed room, week by week from flip to chop.",
      "Video alongside the written guide, because a technique you can watch once is worth more than three paragraphs describing it.",
      "Written for scale independence. The same decisions apply to a tent and to a flower room; the numbers move, the reasoning does not.",
    ],
  },
  {
    slug: "veg",
    name: "Veg Guide",
    price: 200,
    blurb:
      "The full veg program with video demonstration, from clone and transplant through to flip. Faster growth, better structure, bigger canopies.",
    includes: ["Guide video gallery", "Downloadable PDF"],
    covers: "Clone to flip",
    buyUrl: null,
    detail: [
      "Clone, transplant, and everything up to the day you flip. Veg is where the size of the harvest is decided, and where most rooms lose it.",
      "Aimed at structure as much as speed. A canopy that finishes evenly starts as a plant built for it.",
      "Pairs directly with the Flower Guide. Bought together with Run-Off, they are the Complete Package.",
    ],
  },
  {
    slug: "run-off",
    name: "Run-Off Guide",
    price: 200,
    blurb:
      "The runoff SOP, developed across years of trials in different rooms, medias and nutrient lines. Makes plant health simpler to hold at every phase.",
    includes: ["Guide video gallery", "Downloadable PDF"],
    covers: "Every growth phase",
    buyUrl: null,
    detail: [
      "A standard operating procedure, written to be followed. Runoff is the only direct read you get on what the root zone is doing, and most rooms never take it.",
      "Developed across years of trials in different rooms, medias and nutrient lines, which is why it survives being applied to yours.",
      "The one program that makes the other two easier. Start here if you are choosing a single guide.",
    ],
  },
  {
    slug: "automation",
    name: "Hand-Water to Automation",
    price: 200,
    blurb:
      "Multiple strategies for the hardest transition in a grow: getting off hand-watering and onto automated feeding without losing a run.",
    includes: ["Downloadable PDF"],
    covers: "The transition",
    buyUrl: null,
    detail: [
      "The transition nobody writes about: moving off hand-watering without paying for it with a run.",
      "More than one route, because the right one depends on your media, your room and how much of it you can change at once.",
      "Written for the grower who has outgrown the watering can and cannot afford a bad first attempt at automation.",
    ],
  },
];

/**
 * The bundle. Priced by him at $500 against $600 bought separately.
 *
 * Typed as a Guide so it renders through exactly the same page and card as the rest —
 * the live site treats it as a fifth tile, which is how the highest-value thing on the
 * site ends up looking like the cheapest.
 */
export const BUNDLE: Guide & { contains: string[] } = {
  slug: "complete",
  name: "The Complete Package",
  price: 500,
  contains: ["flower", "veg", "run-off"],
  blurb: "Flower, Veg and Run-Off together. The whole program, start to finish.",
  includes: ["Guide video gallery", "Downloadable PDFs"],
  covers: "Clone to harvest",
  buyUrl: null,
  detail: [
    "Veg, Flower and Run-Off together: the full program from clone to chop, plus the SOP that holds it steady.",
    "Bought separately these are $600. Together they are $500, and the reason to take them together is that they were built to be read together.",
    "The Hand-Water to Automation guide is separate and stays separate. It solves a different problem, for a grower at a different point.",
  ],
};

/**
 * CONSULTING — ALL PLACEHOLDER.
 *
 * He has never published rates, so these are a proposal and a conversation starter,
 * not his prices. Two things informed them rather than nothing: published
 * comparables in this niche run from roughly $200/hr at the grow-operations end to
 * $325/hr at the licensing end, and a live hour of his time should cost MORE than a
 * $200 guide, because the guide is the scalable product and the call is the premium
 * one. Credit a guide purchase against a first consult and the guide becomes a paid
 * lead magnet rather than a competitor.
 */
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
    price: 150,
    summary: "Something is wrong right now and you need an answer this week.",
    forWho: "A run in trouble: deficiency, pests, a runoff number that will not settle.",
    includes: ["Photo review before the call", "Written next actions after"],
  },
  {
    slug: "program",
    name: "Program Review",
    minutes: 60,
    price: 300,
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
    name: "Facility & SOP Consult",
    minutes: 90,
    price: 500,
    summary: "Standard operating procedures for a team that has to run this without you.",
    forWho: "Licensed operations, new builds, or a facility standardizing across rooms.",
    includes: [
      "Full intake and photo review",
      "Draft SOP tailored to your rooms",
      "Two follow-up question threads",
    ],
  },
];

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

/** Read off mi-gas.net. Every item is currently sold out on the live site. */
export const MERCH = [
  { name: "MI Gas Tbird Hoodie", price: 41.4, kind: "Hoodie", soldOut: true },
  { name: "MI Gas Her Tbird Hoodie", price: 41.4, kind: "Hoodie", soldOut: true },
  { name: "PRIMO DANKS Impala Hoodie", price: 41.4, kind: "Hoodie", soldOut: true },
  { name: "MI Gas Tbird Tee", price: 31.9, kind: "Tee", soldOut: true },
  { name: "MI Gas Her Tbird Tee", price: 31.9, kind: "Tee", soldOut: true },
  { name: "PRIMO DANKS Impala Tee", price: 31.9, kind: "Tee", soldOut: true },
  { name: "MI Gas Camo Trucker", price: 50, kind: "Hat", soldOut: true },
];

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
    a: "Yes. Calls are remote, and the programs are not state-specific. Facility work in other states is case by case.",
  },
  {
    q: "I bought a guide. Does that count toward a call?",
    // PLACEHOLDER, and worth pushing him on: it turns a $200 guide into a paid lead
    // magnet for a $300 call instead of a competitor to it.
    a: "PLACEHOLDER: proposed: yes, one guide purchase credits toward your first consult. His call.",
  },
];

export const NAV = [
  { href: "/consulting", label: "Consulting" },
  { href: "/guides", label: "Guides" },
  { href: "/shop", label: "Shop" },
  { href: "/reviews", label: "Reviews" },
  { href: "/connect", label: "Connect" },
];

/** What the bundle's contents cost bought one at a time. Derived, so the "saving"
 *  on the page can never disagree with the prices above it. */
export const bundleSeparately = () =>
  BUNDLE.contains.reduce((sum, slug) => sum + (GUIDES.find((g) => g.slug === slug)?.price ?? 0), 0);

export const money = (n: number) =>
  n % 1 === 0 ? `$${n.toLocaleString("en-US")}` : `$${n.toFixed(2)}`;
