import "dotenv/config";

const BASE_URL = "https://api.census.gov/data";

export function getCensusApiKey(): string | undefined {
  return process.env.CENSUS_API_KEY;
}

export async function fetchCensusData(url: string): Promise<unknown> {
  const response = await fetch(url, {
    signal: AbortSignal.timeout(30_000),
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Census API error ${response.status}: ${text}`);
  }
  return response.json();
}

export function buildAcsUrl(
  year: number,
  variables: string[],
  geography: string,
  state: string | undefined,
): string {
  const apiKey = getCensusApiKey();
  let url = `${BASE_URL}/${year}/acs/acs5?get=${variables.join(",")}&for=${encodeURIComponent(geography)}`;
  if (state) {
    url += `&in=state:${state}`;
  }
  if (apiKey) {
    url += `&key=${apiKey}`;
  }
  return url;
}

export function buildAcsVariablesUrl(year: number): string {
  const apiKey = getCensusApiKey();
  let url = `${BASE_URL}/${year}/acs/acs5/variables.json`;
  if (apiKey) {
    url += `?key=${apiKey}`;
  }
  return url;
}
