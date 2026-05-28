const FDSN_BASE = "https://earthquake.usgs.gov/fdsnws/event/1";

export interface EarthquakeQueryParams {
  starttime?: string;
  endtime?: string;
  minmagnitude?: number;
  maxmagnitude?: number;
  mindepth?: number;
  maxdepth?: number;
  minlatitude?: number;
  maxlatitude?: number;
  minlongitude?: number;
  maxlongitude?: number;
  limit?: number;
  offset?: number;
}

export interface EarthquakePage {
  total: number;
  offset: number;
  count: number;
  features: unknown[];
}

export async function queryEarthquakes(params: EarthquakeQueryParams): Promise<EarthquakePage> {
  const limit = params.limit ?? 100;
  // USGS offset is 1-based
  const usgsOffset = (params.offset ?? 0) + 1;

  const query = new URLSearchParams({ format: "geojson", jsonerror: "true", limit: String(limit), offset: String(usgsOffset) });
  if (params.starttime !== undefined) query.set("starttime", params.starttime);
  if (params.endtime !== undefined) query.set("endtime", params.endtime);
  if (params.minmagnitude !== undefined) query.set("minmagnitude", String(params.minmagnitude));
  if (params.maxmagnitude !== undefined) query.set("maxmagnitude", String(params.maxmagnitude));
  if (params.mindepth !== undefined) query.set("mindepth", String(params.mindepth));
  if (params.maxdepth !== undefined) query.set("maxdepth", String(params.maxdepth));
  if (params.minlatitude !== undefined) query.set("minlatitude", String(params.minlatitude));
  if (params.maxlatitude !== undefined) query.set("maxlatitude", String(params.maxlatitude));
  if (params.minlongitude !== undefined) query.set("minlongitude", String(params.minlongitude));
  if (params.maxlongitude !== undefined) query.set("maxlongitude", String(params.maxlongitude));

  const response = await fetch(`${FDSN_BASE}/query?${query}`);
  if (!response.ok) {
    throw new Error(`USGS API error ${response.status}`);
  }

  const result = await response.json();
  if (!result || result.type !== "FeatureCollection" || !Array.isArray(result.features)) {
    throw new Error("Unexpected USGS response shape");
  }

  return {
    total: result.metadata?.count ?? result.features.length,
    offset: params.offset ?? 0,
    count: result.features.length,
    features: result.features,
  };
}

export async function getEarthquakeCount(params: Omit<EarthquakeQueryParams, "limit" | "offset">): Promise<number> {
  const query = new URLSearchParams({ format: "text" });
  if (params.starttime !== undefined) query.set("starttime", params.starttime);
  if (params.endtime !== undefined) query.set("endtime", params.endtime);
  if (params.minmagnitude !== undefined) query.set("minmagnitude", String(params.minmagnitude));
  if (params.maxmagnitude !== undefined) query.set("maxmagnitude", String(params.maxmagnitude));
  if (params.mindepth !== undefined) query.set("mindepth", String(params.mindepth));
  if (params.maxdepth !== undefined) query.set("maxdepth", String(params.maxdepth));
  if (params.minlatitude !== undefined) query.set("minlatitude", String(params.minlatitude));
  if (params.maxlatitude !== undefined) query.set("maxlatitude", String(params.maxlatitude));
  if (params.minlongitude !== undefined) query.set("minlongitude", String(params.minlongitude));
  if (params.maxlongitude !== undefined) query.set("maxlongitude", String(params.maxlongitude));

  const response = await fetch(`${FDSN_BASE}/count?${query}`);
  if (!response.ok) {
    throw new Error(`USGS API error ${response.status}`);
  }

  const text = await response.text();
  const count = parseInt(text.trim(), 10);
  if (isNaN(count)) throw new Error("Unexpected count response from USGS");
  return count;
}
