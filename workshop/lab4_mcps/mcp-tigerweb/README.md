# mcp-tigerweb

MCP server for the [Census TIGERweb](https://tigerweb.geo.census.gov/) REST API. Exposes U.S. Census geographic boundary queries (states, counties, tracts, ZIP codes, congressional districts, etc.) as GeoJSON to AI agents.

## Tools

### `list_layers`

Return a reference list of the most useful TIGERweb layer IDs and names. Use this to discover valid `layer_id` values before calling `query_tiger_layer`.

No parameters.

---

### `query_tiger_layer`

Query a TIGERweb geographic layer and return GeoJSON features.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `service` | string | no | TIGERweb service name. Options: `tigerWMS_Current`, `tigerWMS_ACS2023`, `tigerWMS_Census2020` (default `tigerWMS_Current`) |
| `layer_id` | number | yes | ArcGIS layer ID. Common values: `80`=States, `82`=Counties, `8`=Census Tracts, `10`=Block Groups, `54`=Congressional Districts, `88`=Urban Areas, `2`=ZCTAs |
| `where` | string | no | SQL WHERE clause to filter features (e.g. `"STATE='06'"` for California) |
| `geometry` | string | no | Bounding box in WGS84: `"minX,minY,maxX,maxY"` |
| `out_fields` | string[] | no | Fields to return. Valid values: `GEOID`, `NAME`, `BASENAME`, `STATE`, `COUNTY`, `AREALAND`, `AREAWATER`, `INTPTLAT`, `INTPTLON`, `CENTLAT`, `CENTLON`, `OID`, `OBJECTID`, `COUNTYNS`, `LSADC`, `FUNCSTAT`, `COUNTYCC`, `MTFCC`. Defaults to `["GEOID","NAME","AREALAND","AREAWATER","INTPTLAT","INTPTLON"]`. |
| `limit` | number | no | Max features to return (default 50, max 500) |
| `return_geometry` | boolean | no | Whether to include geometry in the response (default `true`). Set to `false` to return attributes only — much smaller responses when you only need properties like GEOID, NAME, or centroid coordinates. |
| `max_allowable_offset` | number | no | Geometry simplification tolerance in degrees WGS84 (default `0.01`). Higher values produce fewer coordinate points and smaller responses. E.g. `0.01` for moderate simplification, `0.1` for aggressive, `0` for full-resolution geometry. |

**Example**
```json
{ "layer_id": 82, "where": "STATE='06'", "out_fields": ["NAME", "COUNTY", "STATE"], "limit": 60 }
```

## Prompt examples

```
List all available TIGERweb layers.
```
```
Get the county boundaries for California as GeoJSON.
```
```
Query TIGERweb for all congressional districts in Texas.
```
```
Fetch ZIP code tabulation areas (ZCTAs) within the bounding box -87.9,41.6,-87.5,42.1.
```
```
Get the census tract boundaries for Cook County, Illinois.
```

## Running

```bash
npm install
npm run dev     # tsx watch, port 3024
npm start       # production, port 3024
```

## API

```
POST /mcp
```

Rate limit: 60 requests per minute per IP.

No authentication is required — the [TIGERweb REST API](https://tigerweb.geo.census.gov/tigerwebmain/TIGERweb_restmapservice.html) is public.
