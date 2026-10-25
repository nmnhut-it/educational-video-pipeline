/**
 * Retry with exponential backoff, shared by all TTS providers.
 * Providers throw RetryableError for rate limits / server errors; fetch()
 * network failures (TypeError) are retried too. Anything else fails at once.
 */

const MAX_ATTEMPTS = 4;
const RETRY_BASE_DELAY_MS = 2000;
const MS_PER_SECOND = 1000;
const HTTP_TOO_MANY_REQUESTS = 429;
const HTTP_SERVER_ERROR = 500;

/** HTTP failure from a provider, with a hint on whether to try again */
export class HttpError extends Error {
  constructor(message: string, readonly retryable: boolean, readonly retryAfterMs?: number) {
    super(message);
  }
}

/** Turns a failed fetch Response into an HttpError (429 and 5xx are retryable) */
export async function httpErrorFrom(response: Response, label: string): Promise<HttpError> {
  const body = await response.text();
  const retryable = response.status === HTTP_TOO_MANY_REQUESTS || response.status >= HTTP_SERVER_ERROR;
  const retryAfterSeconds = Number(response.headers.get("retry-after"));
  const retryAfterMs = retryAfterSeconds > 0 ? retryAfterSeconds * MS_PER_SECOND : undefined;
  return new HttpError(`${label}: ${response.status} ${body}`, retryable, retryAfterMs);
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Runs `call`, retrying retryable failures; `label` prefixes log lines and the final error */
export async function withRetry<T>(label: string, call: () => Promise<T>): Promise<T> {
  for (let attempt = 1; ; attempt++) {
    try {
      return await call();
    } catch (error) {
      const retryable = error instanceof HttpError ? error.retryable : error instanceof TypeError;
      if (!retryable || attempt >= MAX_ATTEMPTS) {
        throw new Error(`${label}: ${(error as Error).message}`);
      }
      const backoffMs = RETRY_BASE_DELAY_MS * 2 ** (attempt - 1);
      const waitMs = (error instanceof HttpError && error.retryAfterMs) || backoffMs;
      console.log(`  ${label}: attempt ${attempt} failed (${(error as Error).message}), retrying in ${waitMs}ms`);
      await sleep(waitMs);
    }
  }
}
