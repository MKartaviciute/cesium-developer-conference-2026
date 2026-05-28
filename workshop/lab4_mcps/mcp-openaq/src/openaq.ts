const BASE_URL = "https://api.openaq.org/v3";

// OpenAQ v3 parameter IDs for common pollutants
const PARAMETER_IDS: Record<string, number> = {
  pm10: 1,
  pm25: 2,
  o3: 3,
  co: 4,
  no2: 5,
  no: 19843,
  pm1: 19,
  so2: 9,
  bc: 7,
};

function buildHeaders(): Record<string, string> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  const apiKey = process.env.OPENAQ_API_KEY;
  if (apiKey) headers["X-API-Key"] = apiKey;
  return headers;
}

export interface LocationsMeta {
  found: number | string;
  page: number;
  limit: number;
  totalPages?: number;
}

export interface LocationsResult {
  meta: LocationsMeta;
  results: unknown[];
}

export interface LocationsParams {
  coordinates?: string;
  radius?: number;
  country_id?: string;
  limit?: number;
  page?: number;
  parameters?: string[];
  monitor?: boolean;
  mobile?: boolean;
}

export async function fetchLocations(params: LocationsParams): Promise<LocationsResult> {
  const query = new URLSearchParams();
  if (params.coordinates) query.set("coordinates", params.coordinates);
  if (params.radius !== undefined) query.set("radius", String(params.radius));
  if (params.country_id) query.set("country_id", params.country_id);
  if (params.limit !== undefined) query.set("limit", String(params.limit));
  if (params.page !== undefined) query.set("page", String(params.page));
  if (params.monitor !== undefined) query.set("monitor", String(params.monitor));
  if (params.mobile !== undefined) query.set("mobile", String(params.mobile));
  if (params.parameters?.length) {
    for (const name of params.parameters) {
      const id = PARAMETER_IDS[name.toLowerCase()];
      if (id !== undefined) query.append("parameters_id", String(id));
    }
  }

  const url = `${BASE_URL}/locations${query.toString() ? `?${query.toString()}` : ""}`;
  const response = await fetch(url, { headers: buildHeaders() });
  if (!response.ok) {
    throw new Error(`OpenAQ API error: ${response.status} ${response.statusText}`);
  }
  const data = (await response.json()) as {
    results?: unknown[];
    meta?: { found?: number | string; page?: number; limit?: number };
  };
  const results = data.results ?? [];
  const rawFound = data.meta?.found ?? results.length;
  const found = typeof rawFound === "string" ? rawFound : Number(rawFound);
  const page = data.meta?.page ?? (params.page ?? 1);
  const limit = data.meta?.limit ?? (params.limit ?? 20);
  const totalPages = typeof found === "number" ? Math.ceil(found / limit) : undefined;
  return {
    meta: { found, page, limit, ...(totalPages !== undefined && { totalPages }) },
    results,
  };
}

export async function fetchMeasurements(
  locationsId: number,
  limit: number,
  page: number,
): Promise<{ meta: LocationsMeta; results: unknown[] }> {
  const query = new URLSearchParams({ limit: String(limit), page: String(page) });
  const url = `${BASE_URL}/locations/${locationsId}/latest?${query.toString()}`;
  const response = await fetch(url, { headers: buildHeaders() });
  if (!response.ok) {
    throw new Error(`OpenAQ API error: ${response.status} ${response.statusText}`);
  }
  const data = (await response.json()) as {
    results?: unknown[];
    meta?: { found?: number; page?: number; limit?: number };
  };
  const results = data.results ?? [];
  const found = data.meta?.found ?? results.length;
  return {
    meta: { found, page, limit, totalPages: Math.ceil(found / limit) },
    results,
  };
}
