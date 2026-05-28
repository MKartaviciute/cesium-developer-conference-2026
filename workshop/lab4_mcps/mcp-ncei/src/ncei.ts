const BASE = "https://www.ncei.noaa.gov/access/services/data/v1";

export interface GetStationDataOptions {
  dataset: string;
  stations: string;
  startDate: string;
  endDate: string;
  dataTypes?: string;
  fields?: string;
  limit?: number;
}

// Strip optional "NETWORK:" prefixes (e.g. "GHCND:") — the Data Service API uses bare IDs.
// For global-hourly, the API requires an 11-digit USAF+WBAN compound ID (e.g. "72505394728").
// Accept the user-friendly "USAF-WBAN" hyphenated form (e.g. "725053-94728") and normalise it.
function normalizeStations(stations: string, dataset: string): string {
  return stations
    .split(",")
    .map((s) => {
      const id = s.trim().replace(/^[A-Z0-9]+:/, "");
      if (dataset === "global-hourly" && /^\d{6}-\d{5}$/.test(id)) {
        return id.replace("-", "");
      }
      return id;
    })
    .join(",");
}

// Fields stripped from every record — raw remarks are verbose and add no value for LLM consumers.
const ALWAYS_STRIP = new Set(["REM", "SOURCE", "QUALITY_CONTROL"]);

// Core identifiers kept even when dataTypes filtering is active.
const CORE_FIELDS = new Set(["STATION", "DATE", "NAME", "LATITUDE", "LONGITUDE", "ELEVATION"]);

function filterRecord(
  record: Record<string, unknown>,
  keepTypes?: Set<string>,
  fieldsFilter?: Set<string>,
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(record)) {
    if (ALWAYS_STRIP.has(k)) continue;
    if (fieldsFilter) {
      // fields allowlist takes precedence; DATE is always kept as the row key
      if (k !== "DATE" && !fieldsFilter.has(k)) continue;
    } else if (keepTypes && !CORE_FIELDS.has(k) && !keepTypes.has(k)) continue;
    out[k] = v;
  }
  return out;
}

export async function getStationData(opts: GetStationDataOptions): Promise<unknown> {
  const params: Record<string, string> = {
    dataset: opts.dataset,
    stations: normalizeStations(opts.stations, opts.dataset),
    startDate: opts.startDate,
    endDate: opts.endDate,
    format: "json",
    limit: String(opts.limit ?? 100),
  };
  if (opts.dataTypes) params.dataTypes = opts.dataTypes;

  const url = `${BASE}?${new URLSearchParams(params).toString()}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`NCEI API HTTP error ${res.status}: ${await res.text()}`);
  }

  const data = await res.json();
  if (!Array.isArray(data)) return data;

  const keepTypes = opts.dataTypes
    ? new Set(opts.dataTypes.split(",").map((t) => t.trim()))
    : undefined;

  const fieldsFilter = opts.fields
    ? new Set(opts.fields.split(",").map((f) => f.trim()))
    : undefined;

  return data.map((record) =>
    typeof record === "object" && record !== null
      ? filterRecord(record as Record<string, unknown>, keepTypes, fieldsFilter)
      : record
  );
}

const FALLBACK_DATASETS = [
  { id: "daily-summaries", name: "Daily Summaries", description: "Daily climate summaries from land surface stations" },
  { id: "global-hourly", name: "Global Hourly", description: "Hourly surface observations from global weather stations" },
  { id: "global-marine", name: "Global Marine", description: "Marine surface observations from ships and buoys" },
  { id: "weather-observation-locations", name: "Weather Observation Locations", description: "Metadata for NCEI observation locations" },
  { id: "normals-monthly", name: "Normals Monthly", description: "Monthly climate normals for 1981–2010 period" },
  { id: "precipitation-15min", name: "Precipitation 15-Minute", description: "15-minute precipitation data from US stations" },
];

export async function listDatasets(): Promise<unknown> {
  try {
    const url = `${BASE}/datasets`;
    const res = await fetch(url);
    if (!res.ok) {
      return FALLBACK_DATASETS;
    }
    return res.json();
  } catch {
    return FALLBACK_DATASETS;
  }
}
