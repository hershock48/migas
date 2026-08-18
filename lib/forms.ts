/**
 * Shared form types and constants.
 *
 * These live here rather than in app/actions.ts for a hard reason, not a tidy one: a file
 * marked "use server" may only export async functions. Exporting a plain object from it —
 * an initial state, a limits constant — fails the build with `A "use server" file can only
 * export async functions, found object`, and the error names the file, not the export, so
 * it is slower to place than it looks.
 */

export type FormState = {
  status: "idle" | "error" | "done";
  errors?: Record<string, string>;
  /** Echoed back so a failed no-JS submit does not empty the form the visitor just filled
   *  in. With JavaScript the DOM keeps the inputs and this goes unused. */
  values?: Record<string, string>;
  reference?: string;
  summary?: string[];
  /** A data: URL holding the .ics for a confirmed booking. Inline rather than a route,
   *  because the file is already in the response that rendered the confirmation — no
   *  storage, no second request, nothing to expire. */
  ics?: string;
  /**
   * WHETHER THE MAIL ACTUALLY WENT OUT. sendMail already returned this and every caller
   * threw it away, so the confirmation asserted "a copy is on its way to your inbox"
   * whether or not anything had been sent. With SMTP unset — or with MIGAS_NOTIFY_TO
   * unset, which leaves the recipient at PLACEHOLDER@ — that sentence is false, and the
   * person it is false to is the one who just filled in eight fields.
   *
   * Two flags, not one, because they fail apart. The owner notification is gated on a
   * real recipient address and the visitor confirmation is not, so a build can perfectly
   * well confirm the booking to the visitor while nobody at the other end ever hears
   * about it. Those are different lies and the page needs to be able to tell them apart.
   */
  delivered?: { toOwner: boolean; toVisitor: boolean };
};

export const EMPTY: FormState = { status: "idle" };

/**
 * Photos. Four is enough to diagnose a room, and small enough to post in one request: a
 * serverless function body caps out around 4.5 MB on Vercel, which is why the browser
 * downscales before submitting rather than the server rejecting after.
 */
export const PHOTO_LIMITS = { count: 4, bytesEach: 3_500_000, bytesTotal: 4_000_000 };
