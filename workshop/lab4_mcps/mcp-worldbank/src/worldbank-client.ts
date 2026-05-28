const WORLDBANK_BASE = "https://api.worldbank.org/v2";

export async function worldBankGet(path: string, params: Record<string, string>): Promise<unknown> {
  const url = new URL(`${WORLDBANK_BASE}${path}`);
  url.searchParams.set("format", "json");
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") {
      url.searchParams.set(key, value);
    }
  }
  const res = await fetch(url.toString());
  if (!res.ok) {
    throw new Error(`World Bank API error ${res.status}: ${await res.text()}`);
  }
  return res.json();
}
