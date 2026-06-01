const OVERPASS_URL = "https://overpass-api.de/api/interpreter";
const RETRYABLE_STATUSES = new Set([429, 503, 504]);

export async function queryOverpass(overpassQl: string): Promise<unknown> {
  const body = new URLSearchParams({ data: overpassQl });
  let response!: Response;
  for (let attempt = 0; attempt < 3; attempt++) {
    response = await fetch(OVERPASS_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent": "cesium-ai-mcp-overpass/0.1.0",
      },
      body: body.toString(),
      signal: AbortSignal.timeout(60_000),
    });
    if (response.ok || !RETRYABLE_STATUSES.has(response.status)) break;
    if (attempt < 2) await new Promise((r) => setTimeout(r, 1000 * (attempt + 1) + Math.random() * 500));
  }
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Overpass API error ${response.status}: ${text}`);
  }
  return response.json();
}
