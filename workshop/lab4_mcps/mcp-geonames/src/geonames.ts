const BASE = "http://api.geonames.org";

type GeonamesRecord = Record<string, unknown>;

function filterFields(records: unknown): unknown {
  if (!Array.isArray(records)) return records;
  const keep = new Set(["name", "lat", "lng", "distance", "fcode", "fcodeName", "population", "adminName1", "adminCode1", "countryCode", "countryName"]);
  return records.map((r: GeonamesRecord) =>
    Object.fromEntries(Object.entries(r).filter(([k]) => keep.has(k)))
  );
}

function getUsername(): string | null {
  return process.env.GEONAMES_USERNAME ?? null;
}

export interface SearchPlacesOptions {
  q: string;
  country?: string;
  featureClass?: string;
  maxRows?: number;
}

export async function searchPlaces(opts: SearchPlacesOptions): Promise<unknown> {
  const username = getUsername();
  if (!username) {
    return "Error: GEONAMES_USERNAME environment variable is not set. Register a free account at https://www.geonames.org/login";
  }

  const params: Record<string, string> = {
    q: opts.q,
    username,
    maxRows: String(opts.maxRows ?? 10),
  };
  if (opts.country) params.country = opts.country;
  if (opts.featureClass) params.featureClass = opts.featureClass;

  const url = `${BASE}/searchJSON?${new URLSearchParams(params).toString()}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`GeoNames API HTTP error ${res.status}: ${await res.text()}`);
  }
  const json = await res.json() as { geonames?: unknown };
  return filterFields(json.geonames ?? json);
}

export interface FindNearbyOptions {
  lat: number;
  lng: number;
  radius?: number;
  maxRows?: number;
  featureClass?: string;
}

export async function findNearby(opts: FindNearbyOptions): Promise<unknown> {
  const username = getUsername();
  if (!username) {
    return "Error: GEONAMES_USERNAME environment variable is not set. Register a free account at https://www.geonames.org/login";
  }

  const params: Record<string, string> = {
    lat: String(opts.lat),
    lng: String(opts.lng),
    radius: String(opts.radius ?? 10),
    username,
    maxRows: String(opts.maxRows ?? 10),
  };
  if (opts.featureClass) params.featureClass = opts.featureClass;

  const url = `${BASE}/findNearbyJSON?${new URLSearchParams(params).toString()}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`GeoNames API HTTP error ${res.status}: ${await res.text()}`);
  }
  const json = await res.json() as { geonames?: unknown };
  return filterFields(json.geonames ?? json);
}
