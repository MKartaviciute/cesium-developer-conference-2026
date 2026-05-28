const BASE_URL = "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/";

interface RawFeature {
  id: string;
  properties: Record<string, unknown>;
  geometry: { coordinates: [number, number, number] };
}

interface RawFeatureCollection {
  metadata: Record<string, unknown>;
  features: RawFeature[];
}

export interface EarthquakeFeedResult {
  metadata: { generated: number; api: string; count: number; [key: string]: unknown };
  count: number;
  features: ReturnType<typeof slimFeature>[];
}

function slimFeature(f: RawFeature) {
  const p = f.properties;
  return {
    id: f.id,
    mag: p.mag,
    magType: p.magType,
    place: p.place,
    time: p.time,
    status: p.status,
    tsunami: p.tsunami,
    sig: p.sig,
    alert: p.alert,
    felt: p.felt,
    cdi: p.cdi,
    mmi: p.mmi,
    coordinates: f.geometry.coordinates, // [lon, lat, depth_km]
  };
}

export async function fetchEarthquakeFeed(
  minMagnitude: string,
  period: string,
): Promise<EarthquakeFeedResult> {
  const url = `${BASE_URL}${minMagnitude}_${period}.geojson`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`USGS feed request failed: ${response.status} ${response.statusText}`);
  }
  const data = (await response.json()) as RawFeatureCollection;
  return {
    metadata: data.metadata as EarthquakeFeedResult["metadata"],
    count: data.features.length,
    features: data.features.map(slimFeature),
  };
}
