/**
 * MI GAS'S DEAL, IN ONE PLACE.
 *
 * Same rule as lib/site.ts: every business fact lives in one constant file so a
 * correction is one edit. These are the numbers from the proposal ($3,500 build, half
 * to start and half at launch, $99 a month) and the Exhibit A terms the master
 * agreement leaves blank. The acceptance page renders from here and the acceptance
 * email quotes from here.
 *
 * SURFACES THAT CANNOT READ FROM HERE: the proposal at public/pitch/migas/index.html
 * is static HTML and repeats the build fee and the monthly fee in prose (its pricebox,
 * and the "Say yes or say no" step that links to /agreement). If a number here changes,
 * the proposal changes by hand in the same commit. The studio's private contracts
 * folder held a paper draft for MI Gas before this page existed; if that draft is
 * ever sent instead, it has to be brought level with this file first.
 *
 * The general terms are NOT restated here or on the acceptance page. They are the
 * glazedweb Client Agreement v1.1, published at glazedweb.com/agreement and
 * incorporated by reference, exactly as the DeVine and Anchor orders do it. One text,
 * one home, no drift.
 *
 * NO PAYMENT TERMS, ON PURPOSE. The Anchor order carries a third part of Exhibit A
 * for its online payment service and DeVine's carries a card-payment row, because
 * money moves through those sites. Nothing moves through this one: a booking arrives
 * as a request and he invoices (app/actions.ts, "What is deliberately not here"). So
 * this Exhibit A says that plainly, once, and has no fee, no processor and no
 * customer-paid line item. If a checkout is ever added it is a written addition to
 * Exhibit A, not something this file grows quietly.
 *
 * Client-safe: the acceptance form imports from here.
 */

export const agreement = {
  /** The legal entity, the Provider named in v1.1 of the master. */
  provider: "glazedweb LLC",
  version: "glazedweb Client Agreement v1.1",
  termsUrl: "https://glazedweb.com/agreement",
  pdfUrl: "https://glazedweb.com/glazed-web-agreement-v1-1.pdf",
  exhibit: "Exhibit A: MI Gas, prepared 2026-09-03",

  client: "MI Gas",
  /**
   * PLACEHOLDER, in the lib/site.ts sense: the registered form of the business (an
   * LLC, a sole proprietorship trading as MI Gas, or otherwise) is not in this repo
   * and has to come from him before the link goes out. The form prefills "MI Gas"
   * and lets him correct it, so a wrong guess here would print on the record.
   */
  clientLegal: "MI Gas (registered business name to be confirmed with the owner)",
  clientRegion: "Michigan",
  /** His, and live: it points at Squarespace today and at this build on cutover. */
  domain: "mi-gas.net",
  demo: "migas.glazedweb.com/demo",

  buildFee: 3500,
  deposit: 1750,
  monthly: 99,
  /**
   * HOUSE NUMBERS, NOT HIS. The same two Exhibit A fields the Anchor order carries
   * from the DeVine order, and the two the earlier MI Gas paper draft left open. The
   * proposal's $99 line promises "small content edits" without a figure. Confirm both
   * with Kevin before the link goes to him; they are the only numbers on the page
   * that were not in the proposal.
   */
  editAllowance: "2 hours per month",
  hourlyRate: 125,

  scope: [
    "The site at mi-gas.net, replacing the Squarespace site: home, consulting, co-management with its application and printable one-pager, reviews, connect, and a 404 that routes. Your logo, your photos and your words, a title and description written for every page, structured data for the business and both services, and a link card for when a page gets forwarded.",
    "The booking flow, which is the thing you asked for: session length, the eight-question room intake, photos taken off a phone and downscaled before they leave it, the time grid in Eastern time, then a written brief with the photos attached and a calendar invite to both sides. A booking reaches you as a request; you confirm by reply and invoice as you do now.",
    "Your availability, edited by you: the PIN-gated page at /admin where you set weekly windows, days off, lead time and horizon from your phone, and your own calendar's private feed read back so a booked time drops off the grid for the next visitor.",
    "The Patreon advertised rather than resold, per your direction on August 27: one section with the numbers off your public page, your room photos, and a seam for the member history from your dashboard. No store and no guide selling on the site.",
    "The words, adjusted with you. You said on September 3 that there is a lot of wording to adjust, on more than one section, and that we would go through it together. That pass, section by section until every page reads as yours, is part of the build fee. It is not an edit against the monthly allowance and it is not billed by the hour.",
    "Email over a mailbox you already own, and nothing rented underneath: no scheduling subscription, no hosted mail service, no object store, no analytics script. The one thing the site stores, your availability document, lives on the hosting you already have.",
    "The small studio credit in the footer, with its wording your call.",
  ],

  notIncluded:
    "Online payment or checkout of any kind (see below); photography; the review transcriptions, the FAQ answers, the co-management project minimum and billing cadence, and the figures on the credentials strip, which are yours to supply and ours to place; a vector of your logo, which we would want but can build without; and anything the site says about your licence, which is your lawyer's answer rather than either of ours.",

  /**
   * The paragraph that stands where Anchor's part 3 would be. Terms, not scope, and
   * the one thing an attorney would want to see is that there is nothing to see.
   */
  noPayments:
    "The site takes no card and moves no money. A consult is booked as a request and paid the way you are paid today, on your own invoice, outside the site. There is no processor connected, no customer-paid fee, and no platform charge, and glazedweb holds nothing on your behalf. The reason is the one from the proposal: which processor will underwrite cannabis education is a question for you and your bank, and a checkout built against the wrong answer is work done twice. If we ever add one, it is a written addition to this Exhibit A that both of us sign, with its own terms, and nothing in this agreement turns it on.",

  timeline:
    "Target launch date will be agreed in writing after acceptance. The site is built and reviewable at migas.glazedweb.com/demo. Launch waits on the wording pass above, the list of things only you have (an email address you will read, the six review transcriptions, the FAQ answers, the co-management project minimum and billing cadence, the credentials figures, the diagram numbers, the Patreon history), the booking set up and tested end to end with a real call landing on your calendar, and pointing mi-gas.net at the new site.",
} as const;

export const money = (n: number) => `$${n.toLocaleString("en-US")}`;

/**
 * A recorded acceptance, clickwrap style. THE EMAIL IS THE LEGAL RECORD: both parties
 * receive a copy carrying the version, the exhibit, the name typed, and the timestamp.
 * This build keeps no database row, deliberately: its only store is the public-read
 * availability document, and a name, an email and an IP address do not belong in a
 * public-read store. The server log carries the full record before anything can fail.
 */
export type AgreementAcceptance = {
  id: string;
  business: string;
  name: string;
  title: string;
  email: string;
  /** ISO, stamped by the server at acceptance. */
  acceptedAt: string;
  version: string;
  exhibit: string;
  ip: string;
  userAgent: string;
};

/**
 * What the acceptance action hands back to the form. A plain module, not app/agreement/
 * actions.ts, for the reason lib/forms.ts exists: a "use server" file may only export
 * async functions.
 *
 * "sent" means the countersignature copy reached Kevin's inbox over SMTP. "fallback"
 * means the acceptance was recorded on the server but mail could not go out, and the
 * form hands the visitor a prefilled mailto carrying the exact record text, so the
 * acceptance still reaches a person. A false "you're all set" on a legal record is the
 * one lie this build refuses.
 */
export type AcceptState = {
  status: "idle" | "error" | "sent" | "fallback";
  error?: string;
  /** Echoed back so a failed no-JS submit does not empty the form. */
  values?: Record<string, string>;
  /** The record text, for the mailto fallback. */
  record?: string;
};

export const EMPTY_ACCEPT: AcceptState = { status: "idle" };
