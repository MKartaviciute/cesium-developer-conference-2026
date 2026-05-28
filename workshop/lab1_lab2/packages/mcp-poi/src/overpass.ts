/**
 * Typed fetch wrapper for the Overpass API (OpenStreetMap).
 * No API key required.
 *
 * This file is pre-populated — no edits needed here.
 * Your work for Lab 2 is in packages/mcp-poi/src/tools/index.ts.
 */

// Public Overpass endpoint used by this MCP server.
const OVERPASS_URL = "https://overpass-api.de/api/interpreter";

// Final shape returned to the MCP tool.
export interface PointOfInterest {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  type: string;
  tags: Record<string, string>;
}

// Raw Overpass element shape. Coordinates may be on lat/lon or center.
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
  // Build an Overpass QL query that searches nodes and ways across multiple tag groups.
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

  // Execute the query via HTTP POST.
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
    // Bubble up provider errors with full body text for easier debugging.
    throw new Error(`Overpass API error ${res.status}: ${await res.text()}`);
  }

  const data: OverpassResponse = await res.json();

  // Normalize mixed Overpass response shapes into a single POI output.
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
