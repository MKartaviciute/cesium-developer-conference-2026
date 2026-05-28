const GBIF_BASE = "https://api.gbif.org/v1";

export async function gbifGet(path: string, params: Record<string, string>): Promise<unknown> {
  const url = new URL(`${GBIF_BASE}${path}`);
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") {
      url.searchParams.set(key, value);
    }
  }
  const res = await fetch(url.toString());
  if (!res.ok) {
    throw new Error(`GBIF API error ${res.status}: ${await res.text()}`);
  }
  return res.json();
}
