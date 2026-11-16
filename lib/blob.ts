import "server-only";

/**
 * How long this site will wait on its storage before giving up.
 *
 * The Blob SDK retries a request that the service answers with a 5xx ten
 * times, doubling the wait each time: about seventeen minutes in all. Every
 * read here is written to fail open (the booking page falls back to the
 * default hours, the admin page says storage is unreadable), but a page
 * cannot fail open while it is still inside the SDK waiting for retry nine.
 * Rehearsed on 2026-11-16 with a stand-in that answered 500: /admin did not
 * load within thirty seconds, and /consulting reads the same store.
 *
 * Two retries (about three seconds), and no single request longer than eight
 * seconds. The variable is the SDK's own; a value set in the hosting
 * dashboard wins over this default.
 */
process.env.VERCEL_BLOB_RETRIES ??= "2";

export const BLOB_TIMEOUT_MS = 8000;

/** Spread into any SDK call's options. */
export const blobTimeout = () => ({ abortSignal: AbortSignal.timeout(BLOB_TIMEOUT_MS) });
