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
};

export const EMPTY: FormState = { status: "idle" };

/**
 * Photos. Four is enough to diagnose a room, and small enough to post in one request: a
 * serverless function body caps out around 4.5 MB on Vercel, which is why the browser
 * downscales before submitting rather than the server rejecting after.
 */
export const PHOTO_LIMITS = { count: 4, bytesEach: 3_500_000, bytesTotal: 4_000_000 };
