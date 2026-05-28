const BASE_URL = "https://api.gdeltproject.org/api/v2/doc/doc";
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 6_000; // respects GDELT's 1-req/5s rate limit
const FETCH_TIMEOUT_MS = 20_000;

export async function fetchGdelt(params: Record<string, string>): Promise<unknown> {
  const qs = new URLSearchParams(params).toString().replace(/\+/g, "%20");
  const url = `${BASE_URL}?${qs}`;

  let lastError: unknown = new Error("GDELT fetch failed after all retries");
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    if (attempt > 0) {
      await new Promise((r) => setTimeout(r, RETRY_DELAY_MS * attempt));
    }
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) });
      const text = await response.text();
      if (!response.ok) {
        // 429 is retryable; other HTTP errors are not
        if (response.status === 429 && attempt < MAX_RETRIES - 1) {
          lastError = new Error(`GDELT API error ${response.status}: ${text.trim()}`);
          continue;
        }
        throw new Error(`GDELT API error ${response.status}: ${text.trim()}`);
      }
      try {
        return JSON.parse(text);
      } catch {
        // GDELT returns plain text for query errors (e.g. invalid boolean syntax)
        throw new Error(`GDELT returned non-JSON response: ${text.trim()}`);
      }
    } catch (err) {
      if (err instanceof Error && err.message.startsWith("GDELT")) throw err;
      // Timeout/network error — save and retry
      const cause = err instanceof Error ? (err.cause as Error | undefined) : undefined;
      lastError = cause
        ? new Error(`GDELT network error: ${cause.message}`)
        : err;
    }
  }
  throw lastError;
}
