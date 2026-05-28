const OVERPASS_URL = "https://overpass-api.de/api/interpreter";

export async function queryOverpass(overpassQl: string): Promise<unknown> {
  const body = new URLSearchParams({ data: overpassQl });
  const response = await fetch(OVERPASS_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "User-Agent": "cesium-ai-mcp-overpass/0.1.0",
    },
    body: body.toString(),
    signal: AbortSignal.timeout(60_000),
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Overpass API error ${response.status}: ${text}`);
  }
  return response.json();
}
