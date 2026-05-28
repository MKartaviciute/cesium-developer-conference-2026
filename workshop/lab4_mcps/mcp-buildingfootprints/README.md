# mcp-buildingfootprints

An MCP server that exposes the [Microsoft Global ML Building Footprints](https://github.com/microsoft/GlobalMLBuildingFootprints) dataset as tools. No API key or pre-downloaded data required — shards are fetched on demand.

## Tools

| Tool | Description | Category |
|------|-------------|----------|
| `list_countries` | List all countries/regions available in the dataset | Discovery |
| `query_footprints_by_bbox` | Query building footprints for a country within a bounding box | Query |

## How data is fetched

### Dataset index (CSV)

On the first call to either tool the server fetches a **dataset-links CSV** from Azure Blob Storage:

```
https://minedbuildings.z5.web.core.windows.net/global-buildings/dataset-links.csv
```

The CSV is saved to `data/dataset-links.csv` and reused on subsequent starts. Each row contains three columns:

| Column | Description |
|--------|-------------|
| `Location` | Country or region name (e.g. `UnitedStates`, `Japan`) |
| `QuadKey` | Bing Maps quadkey identifying the geographic tile covered by this shard |
| `Url` | Direct download URL for the shard (gzipped JSONL) |

`list_countries` returns the deduplicated, sorted set of `Location` values from this CSV.

### Shard selection via quadkeys

`query_footprints_by_bbox` converts each row's `QuadKey` to a lat/lon bounding box and checks whether it overlaps the query bbox. Only matching shards are downloaded — the rest are skipped entirely. The response always reports `shardsChecked` (total shards for the country) and `shardsMatched` (shards that overlapped the query bbox).

### Streaming gzipped JSONL

Each shard is a **gzip-compressed JSONL file** (one GeoJSON Feature per line). The server streams and decompresses each matching shard line-by-line rather than loading it fully into memory. For every line:

1. The GeoJSON polygon geometry is parsed.
2. The polygon's coordinate extents are computed and checked against the query bbox.
3. If the feature overlaps, it is added to the result set.
4. Once `limit` results are collected the stream is destroyed early.

Coordinate precision is trimmed to **6 decimal places** (~11 cm accuracy) to keep response size manageable.

## Running

```bash
pnpm dev        # watch mode
pnpm start      # production
```

The server listens on `http://localhost:3027/mcp` by default.

**Environment variables:**

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3027` | HTTP port |
| `ALLOWED_ORIGIN` | `http://localhost:3000` | CORS allowed origin |

## MCP client configuration

```json
{
  "mcpServers": {
    "buildingfootprints": {
      "type": "http",
      "url": "http://localhost:3027/mcp"
    }
  }
}
```

## Tool parameters and response shapes

### `list_countries`

No parameters. Returns a sorted JSON array of country/region name strings (valid values for the `country` parameter of `query_footprints_by_bbox`).

### `query_footprints_by_bbox`

| Parameter | Type | Description |
|-----------|------|-------------|
| `country` | string | Country/region name from `list_countries` |
| `bbox` | string | Bounding box as `minLon,minLat,maxLon,maxLat` (WGS-84) |
| `limit` | integer [1, 2000] | Maximum footprints to return (default 200) |
| `count_only` | boolean (optional) | When `true`, return only count and shard stats — no geometry. Useful for large bboxes that would exceed token limits. |

**Response:** JSON object:
```json
{
  "count": 42,
  "shardsChecked": 120,
  "shardsMatched": 3,
  "features": [
    {
      "geometry": { "type": "Polygon", "coordinates": [...] },
      "height": 15.3,
      "confidence": 0.92
    }
  ]
}
```

`height` and `confidence` are omitted from individual features when the source data has no value for them. When `count_only` is `true`, the `features` array is omitted entirely.

## Example prompts

```
List all available countries in the building footprints dataset.
```

```
Show me building footprints in central Tokyo (bbox: 139.74,35.67,139.78,35.70).
```

```
How many buildings are in downtown San Francisco (bbox: -122.420,37.775,-122.395,37.795)? Use count_only mode.
```

```
Find buildings near Times Square, New York (bbox: -73.990,40.754,-73.982,40.760).
```
