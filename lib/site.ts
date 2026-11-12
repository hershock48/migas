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
/**
 * Two lengths, two prices, his numbers from the 2026-11-04 email: a half hour
 * at $250, a full hour at $400. Not pro-rata (the hour is less than twice the
 * half), so each price is written, not derived. The 90-minute facility call
 * is gone with the email's two-option list.
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
    slug: "half",
    name: "Half hour",
    minutes: 30,
    price: 250,
    summary: "For one room and one problem.",
    forWho: "Usually a run that's in trouble or a number that won't settle. Also good for a second opinion before you change something.",
    includes: ["We read your profile and photos beforehand", "Written next actions after"],
  },
  {
    slug: "hour",
    name: "Full hour",
    minutes: 60,
    price: 400,
    summary: "For the whole program or the whole facility.",
    forWho: "A grow that works but underperforms, a design or build-out, or a facility weighing co-management.",
    includes: ["We read your profile and photos beforehand", "Written recommendations", "One follow-up question thread"],
  },
];

/** What a call is for, in his words from the email. */
export const CONSULT_TOPICS = [
  "Advice on a project you are planning",
  "Cultivation practices, and the issues they cause",
  "Design and build-out",
  "Troubleshooting a run that is going wrong",
] as const;

/**
 * What to have open before the call. It sits beside the booking form on
 * /consulting; it used to sit after the form and after the callback box, which
 * is to say after anyone needed it.
 */
export const HAVE_READY = [
  "Your last two runs' yields, and what you changed between them.",
  "Runoff EC and pH if you take them, in and out, for the last week.",
  "Room temperature, humidity and CO₂ over a 24-hour cycle. Day and night numbers, not averages.",
  "A wide shot of the canopy plus close-ups of whatever is wrong.",
  "Your feed chart, even if it's the one off the bottle.",
] as const;

/**
 * The four Instagram posts and four Patreon posts the home page shows, two by
 * two, per the email. PLACEHOLDER: he has not named the four of each yet. Until
 * he does, the Instagram tiles are three of his own room photographs linking
 * to the profile plus one tile that asks for the fourth, and the Patreon tiles
 * are his four guide topics linking to the Patreon page.
 */
export const INSTAGRAM_POSTS = [
  { href: SITE.instagram, caption: "The bench, staked and lined out before a run" },
  { href: SITE.instagram, caption: "The canopy at lights-off" },
  { href: SITE.instagram, caption: "Late flower, in the net" },
  { href: SITE.instagram, caption: "PLACEHOLDER" },
] as const;

export const PATREON_POSTS = [
  { title: "Flower, start to finish", blurb: "The bloom program by phase, with the feed and runoff targets for each.", href: PATREON.url },
  { title: "Veg, from clone to flip", blurb: "Rooting and transplant, through to the end of veg.", href: PATREON.url },
  { title: "Runoff, the SOP", blurb: "Collecting and reading runoff, and what to change when the numbers move.", href: PATREON.url },
  { title: "Hand-water to automation", blurb: "Moving a room from hand-watering to drip and sensors.", href: PATREON.url },
] as const;

/**
 * CO-MANAGEMENT. His outline from the 2026-08-27 call, close to verbatim: we run the
 * irrigation and the environment remotely, the head grower on the ground runs the
 * program, and the room gets the results of the licensed facility's playbook without
 * hiring its director.
 *
 * Facts that are his, from the call: the service list, the sensor requirement
 * including the TrolMaster exclusion, the head-grower condition, the relocation
 * network, optional site visits, genetic sourcing through Bractworx or another
 * nursery, and design-build as an ask.
 *
 * PRICING CHANGED 2026-11-04. The per-light range from the August call ($50 to
 * $150 a light, project minimum unnamed) is retired. Co-management now runs on
 * the Remote Grow Solutions platform and is priced by its tiers, which are his
 * numbers from his November planning notes: four tiers set by flowering lights
 * or flower rooms, the higher one wins. The same four live in the platform's
 * lib/pricing.ts; change both together.
 */
export const COMANAGEMENT = {
  // The one paragraph that says what co-management is. It was typed out twice, on the
  // page and on the one-pager, which is how two copies drift; both read this now.
  intro:
    "We steer irrigation and climate remotely, off your own sensor data, and your head grower handles the floor. It's the same program we run in our own licensed facility.",
  tiers: [
    { name: "Essential", rooms: "1 to 2 flower rooms", lights: "up to 100 lights", monthly: 2000, open: false },
    { name: "Professional", rooms: "3 to 5 flower rooms", lights: "101 to 400 lights", monthly: 4000, open: false },
    { name: "Advanced", rooms: "6 to 8 flower rooms", lights: "401 to 750 lights", monthly: 6000, open: false },
    { name: "Enterprise", rooms: "9 or more flower rooms", lights: "751 or more lights", monthly: 8000, open: true },
  ],
  rule: "If your room count and your light count land in different tiers, you pay the higher one. They're never added together, and every tier gets the same service.",
  cadence: [
    "Three check-ins a week per flower room, from a phone, three to five minutes each",
    "One 60-minute call a week, with action items that land on a shared calendar",
    "A written report every week, covering the week behind and the week ahead",
    "Clone, mother and veg advisory included at no extra cost",
  ],
  /** The KPIs co-management is judged on, his list. */
  kpis: ["Runs per year", "Yield per square foot", "Consistency, run to run", "Quality: potency, terpenes, appearance", "Revenue per pound"],
  software: {
    name: "Remote Grow Solutions",
    url: "https://remotegrowsolutions.vercel.app",
    demo: "https://remotegrowsolutions.vercel.app/login",
    blurb:
      "It shows each room's readings against its targets, flags the rooms that need a look first, tracks each run from flip to harvest, and holds the shared calendar and the weekly report. Your team logs what the sensors can't measure, and we read it before each call.",
  },
  services: [
    {
      name: "Irrigation, run remotely",
      body: "We set shot sizes, timings and dryback targets off your sensor data and adjust them run by run. We look at the numbers every day.",
    },
    {
      name: "Environmental parameters",
      body: "Temperature, humidity and VPD targets for each phase, with day and night set separately, adjusted as the canopy develops.",
    },
    {
      name: "Scheduling, with your labor",
      body: "Defol, transplant, flip and harvest planned around the crew you have and the days they work.",
    },
    {
      name: "Cost reduction",
      body: "We go through feed, media and labor costs against what the room needs. In our own rooms, cutting back on salts lowered nutrient cost and yield held. What you can cut depends on where your money is going.",
    },
  ],
  /** The conditions, stated up front because they filter better than a form does. */
  requirements: [
    {
      name: "Substrate sensors we can read",
      body: "Aroya, Pinnacle, Growlink or similar. Remote steering is only as good as the data, and we don't work off TrolMaster sensors.",
    },
    {
      name: "A head grower who runs the program",
      body: "Someone on site has to own the day to day and follow the plan. We can set the numbers from here, but we can't be in the room.",
    },
  ],
  extras: [
    {
      name: "Head growers, ready to relocate",
      body: "We know experienced commercial head growers who are open to relocating, if your room needs someone on site.",
    },
    {
      name: "On-site visits, if you want them",
      body: "Regular in-person visits are optional and scheduled around your runs.",
    },
    {
      name: "Genetic sourcing included",
      body: "Clean cuts through Bractworx or another nursery we trust, so a new strain doesn't bring pests or disease in with it.",
    },
    {
      name: "Design-build, by conversation",
      body: "We take on new rooms and retrofits case by case. Ask about it on the call.",
    },
  ],
} as const;

/**
 * The co-management FAQ: what a licensed operation asks before letting outsiders
 * steer its rooms. Same convention as FAQ below — the answers only he can give are
 * marked PLACEHOLDER and render as drafts addressed to him, because the questions
 * get asked whether or not the page answers them.
 */
export const COMANAGE_FAQ = [
  {
    q: "Is what we share with you confidential?",
    a: "PLACEHOLDER: a facility won't share its sensor feed and its numbers without an answer, and for co-management it's usually the first thing they ask. It should be in your own words.",
  },
  {
    q: "Who reads our data?",
    a: "We do. Your feed is read by the same grower who runs our own licensed rooms, against the same program.",
  },
  {
    q: "What happens in the first week?",
    a: "PLACEHOLDER: what happens between signing and a normal week is your process, and we don't want to guess at it.",
  },
  {
    q: "How long are we committing for?",
    a: "PLACEHOLDER: term and notice are your call. Decide them along with the onboarding fee and billing.",
  },
  {
    q: "Why tiers by rooms and lights?",
    a: "Because you can work out the price before we talk. Room count tells us how much there is to manage and light count tells us how big the production is. Whichever puts you higher sets the tier, and the tier doesn't change with the price per pound.",
  },
  {
    q: "Where do you co-manage?",
    a: "Anywhere we can read your sensors remotely. In-person visits and rooms outside Michigan are case by case.",
  },
];

/**
 * The co-management application, from Kevin's notes of the same call: "enter in a
 * bunch of info about their grow and what they're looking for to become a client."
 * This is that form's question list, and like INTAKE above, the questions ARE the
 * product: light count and sensor platform are the two facts that price a room and
 * qualify it, so the application collects exactly what the first call needs.
 *
 * CAPTURE, DO NOT WALL. The sensor list deliberately includes the answers that fail
 * the stated conditions (TrolMaster, none yet). The page says the conditions plainly;
 * a facility that applies anyway is a lead he may still want, on his terms, and a
 * form that refuses to submit teaches nothing except that the site is broken. His
 * ticket prints the answer and he decides.
 */
export const COMANAGE_APPLY = [
  { id: "name", label: "Your name", type: "text", required: true },
  { id: "email", label: "Email", type: "email", required: true },
  { id: "phone", label: "Phone", type: "tel", required: false },
  { id: "facility", label: "Facility or company", type: "text", required: false },
  {
    id: "state",
    label: "State the rooms are in",
    type: "text",
    // That sentence was the placeholder, which a half-width field cut off at "other
    // states are c" and which disappeared as soon as the visitor started typing.
    hint: "Calls are remote. Ask us about rooms outside Michigan.",
    placeholder: "e.g. Michigan",
    required: true,
  },
  {
    id: "lights",
    label: "How many lights?",
    type: "text",
    placeholder: "e.g. 120, across two flower rooms",
    required: true,
  },
  {
    id: "sensors",
    label: "Substrate sensors",
    type: "select",
    options: [
      "Aroya",
      "Pinnacle",
      "Growlink",
      "Other substrate sensors",
      "TrolMaster",
      "No sensors yet",
    ],
    required: true,
  },
  {
    id: "media",
    label: "Growing media",
    type: "select",
    // Same list the consult intake uses, so his tickets speak one language.
    options: ["Rockwool", "Coco", "Soil / living soil", "Peat blend", "Rockwool + coco", "Other"],
    required: true,
  },
  {
    id: "headGrower",
    label: "Head grower on the ground",
    type: "select",
    options: [
      "Yes, and they will run the program",
      "Hiring one now",
      "No, we would need one",
    ],
    required: true,
  },
  {
    id: "goal",
    label: "What are you looking for out of co-management?",
    type: "textarea",
    placeholder:
      "Where the room is now, and where it's losing money or consistency.",
    required: true,
    wide: true,
  },
] as const;

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
  // The facility profile, first, per the 2026-11-04 email: "fill out facility
  // profile onboarding form for time efficiency." Three questions that place
  // the room before the room questions start.
  {
    id: "facility",
    label: "Your facility: rooms and lights",
    type: "text" as const,
    // A hint rather than a placeholder when the example is longer than the field.
    // See the intake loop in components/Booking.tsx for what the placeholder did.
    hint: "For example: 4 flower rooms and 168 lights, plus a veg and a mother room.",
    required: true,
  },
  {
    id: "sensors",
    label: "Sensors you run",
    type: "select" as const,
    options: ["Aroya", "Pinnacle", "Growlink", "TrolMaster", "Other", "None yet"],
    required: false,
  },
  {
    id: "climate",
    label: "HVAC and dehumidification",
    type: "text" as const,
    hint: "Brand and capacity per room, if you know it.",
    required: false,
  },
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
    hint: "For example: 8 × 720W LED, or 12 × 1000W DE HPS. Add PPFD or DLI if you have it.",
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
    hint: "For example: 20% runoff, in 3.0 EC / 5.9 pH, out 4.8 EC / 6.4 pH. Volume alone is useful.",
    required: false,
  },
  {
    id: "problem",
    label: "What do you want to come out of the call?",
    type: "textarea" as const,
    placeholder:
      "What's happening, when it started, and what you've already tried.",
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
    "Example numbers, not targets. When runoff EC comes back higher than the feed, salt is building up in the media, and reading runoff is how you catch it.",
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
    title: "You fill in the profile",
    body:
      "It covers rooms, lights, sensors, stage, media, feed and runoff, plus photos of the problem. It takes a few minutes.",
  },
  {
    step: "The call",
    // Deliberately NOT "the call opens at the diagnosis", which was the first rewrite: this
    // step sits on the consulting page directly under an h1 reading "A call that starts at the
    // diagnosis", and the two said the same thing twice within one screen. A step title should
    // add the next fact, not restate the heading above it.
    title: "We start on the problem",
    body:
      "We go through what we saw in your profile and photos, and what to change first.",
  },
  {
    step: "After",
    title: "You get next steps in writing",
    body:
      "A short list of next actions, in order, that someone on your team can start on Monday without having been on the call.",
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
    // Two answers, because which one is true depends on whether the card step is on
    // (STRIPE_SECRET_KEY). The page picks; see app/consulting/page.tsx. The old single
    // answer covered both with "if the card step is not showing", which asked the visitor
    // to work out the site's configuration.
    a: "By card when you book. A half hour is $250 and a full hour is $400.",
    aInvoice: "We email an invoice with your booking confirmation, to pay before the call. A half hour is $250 and a full hour is $400.",
  },
  {
    q: "What if I need to move it?",
    a: "PLACEHOLDER: reply to your confirmation and we'll move it, up to 24 hours ahead. Inside 24 hours the time is held.",
  },
  {
    q: "Is what I tell you confidential?",
    a: "PLACEHOLDER: licensed operators will ask this before they book. It should be in your own words.",
  },
  {
    q: "Will you look at photos before the call?",
    a: "Yes. The booking form takes up to four photos, and we look at them first.",
  },
  {
    q: "Do you consult outside Michigan?",
    a: "Yes. Calls are remote and the methods aren't specific to one state. Co-management and facility work outside Michigan are case by case.",
  },
  {
    q: "What does co-management need from my room?",
    a: "It needs substrate sensors we can read remotely (Aroya, Pinnacle, Growlink or similar) and a head grower on site who will run the program. We don't take on a room without both. There's more on the co-management page.",
  },
];

export const NAV = [
  { href: "/consulting", label: "Consulting" },
  { href: "/co-management", label: "Co-Management" },
  { href: "/reviews", label: "Reviews" },
  { href: "/connect", label: "Connect" },
];

/** True once REVIEWS holds a real quote. Until then the Reviews page is a page of
 *  placeholders, so the header and the 404 leave it out (the footer keeps it). */
export const HAS_REVIEWS = REVIEWS.some((r) => !r.quote.startsWith("PLACEHOLDER"));

export const money = (n: number) =>
  n % 1 === 0 ? `$${n.toLocaleString("en-US")}` : `$${n.toFixed(2)}`;
