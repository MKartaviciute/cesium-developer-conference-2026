/**
 * Typed fetch wrapper for the Overpass API (OpenStreetMap).
 * No API key required.
 */

const OVERPASS_URL = "https://overpass-api.de/api/interpreter";

export interface PointOfInterest {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  type: string;
  tags: Record<string, string>;
}

interface OverpassElement {
  type: string;
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
}

interface OverpassResponse {
  elements: OverpassElement[];
}

/**
 * Search for points of interest near a coordinate using the Overpass API.
 *
 * @param latitude  - Center latitude
 * @param longitude - Center longitude
 * @param type      - OSM tag value to search for (e.g. "museum", "attraction", "restaurant")
 * @param radius    - Search radius in meters (default 5000)
 */
export async function searchPois(
  latitude: number,
  longitude: number,
  type: string,
  radius: number = 5000,
): Promise<PointOfInterest[]> {
  // Build an Overpass QL query that searches nodes AND ways with the given tag
  const query = `
    [out:json][timeout:10];
    (
      node["tourism"="${type}"](around:${radius},${latitude},${longitude});
      way["tourism"="${type}"](around:${radius},${latitude},${longitude});
      node["amenity"="${type}"](around:${radius},${latitude},${longitude});
      way["amenity"="${type}"](around:${radius},${latitude},${longitude});
      node["historic"="${type}"](around:${radius},${latitude},${longitude});
      way["historic"="${type}"](around:${radius},${latitude},${longitude});
    );
    out center body;
  `;

  const res = await fetch(OVERPASS_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "Accept": "application/json",
      "User-Agent": "mcp-poi-server/1.0",
    },
    body: `data=${encodeURIComponent(query)}`,
  });

  if (!res.ok) {
    throw new Error(`Overpass API error ${res.status}: ${await res.text()}`);
  }

  const data: OverpassResponse = await res.json();

  return data.elements
    .filter((el) => el.tags?.name)
    .map((el) => ({
      id: el.id,
      name: el.tags!.name!,
      latitude: el.lat ?? el.center!.lat,
      longitude: el.lon ?? el.center!.lon,
      type,
      tags: el.tags ?? {},
    }));
}