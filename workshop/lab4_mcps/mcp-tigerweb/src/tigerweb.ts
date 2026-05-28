const BASE_URL = "https://tigerweb.geo.census.gov/arcgis/rest/services/TIGERweb";

export type TigerService = "tigerWMS_Current" | "tigerWMS_ACS2023" | "tigerWMS_Census2020";

export async function queryTigerLayer(params: {
  service: TigerService;
  layer_id: number;
  where?: string;
  geometry?: string;
  out_fields?: string[];
  limit?: number;
  return_geometry?: boolean;
  max_allowable_offset?: number;
}): Promise<unknown> {
  const url = new URL(`${BASE_URL}/${params.service}/MapServer/${params.layer_id}/query`);
  url.searchParams.set("f", "geojson");
  url.searchParams.set("where", params.where ?? "1=1");
  if (params.geometry) {
    url.searchParams.set("geometry", params.geometry);
    url.searchParams.set("geometryType", "esriGeometryEnvelope");
    url.searchParams.set("inSR", "4326");
  }
  url.searchParams.set("outSR", "4326");
  url.searchParams.set("outFields", params.out_fields?.join(",") ?? "GEOID,NAME,AREALAND,AREAWATER,INTPTLAT,INTPTLON");
  url.searchParams.set("resultRecordCount", String(params.limit ?? 50));
  url.searchParams.set("returnGeometry", String(params.return_geometry ?? true));
  if (params.max_allowable_offset != null) {
    url.searchParams.set("maxAllowableOffset", String(params.max_allowable_offset));
  }

  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error(`TIGERweb API error: ${response.status} ${response.statusText}`);
  }
  const data = await response.json() as { error?: { code: number; message: string } };
  if (data?.error) {
    throw new Error(`TIGERweb query error ${data.error.code}: ${data.error.message}`);
  }
  return data;
}
