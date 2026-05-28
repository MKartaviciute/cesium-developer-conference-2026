# mcp-naturalearth

An MCP server that exposes the [Natural Earth](https://www.naturalearthdata.com/) GeoPackage as tools. Provides country metadata and arbitrary vector-layer queries at 10 m, 50 m, and 110 m scales. No API key required.

## Tools

| Tool | Description | Category |
|------|-------------|----------|
| `list_layers` | List all vector layer names available in the GeoPackage | Discovery |
| `query_countries` | Find countries by name or ISO-A2 code with population estimates | Query |
| `query_features` | Query any Natural Earth layer by table name with optional bbox, field selection, pagination, and count | Query |

## How data is fetched

### GeoPackage download (first start only)

At startup the server checks for `data/natural_earth_vector.gpkg`. If it is absent, it downloads the full **Natural Earth vector GeoPackage** (~200 MB ZIP) from:

```
https://naciscdn.org/naturalearth/packages/natural_earth_vector.gpkg.zip
```

The ZIP is streamed directly into an `unzipper` pipeline — the first `.gpkg` file found inside is extracted to `data/natural_earth_vector.gpkg`. The ZIP itself is not kept on disk. On subsequent starts the existing file is opened immediately.

### SQLite / better-sqlite3

The GeoPackage is a standard SQLite database opened read-only with **`better-sqlite3`**. All queries are synchronous prepared statements. The `dbReady` flag is set after the file is opened; any tool call that arrives before this completes returns a retry message.

### Spatial filtering with GeoPackage R-tree index

When `query_features` receives a `bbox`, it looks for a GeoPackage R-tree index table (`rtree_{table}_{geomCol}`). If one exists it joins against it:

```sql
FROM "{table}" t
INNER JOIN "rtree_{table}_{geomCol}" r ON t."{pk}" = r.id
WHERE r.minx <= maxLon AND r.maxx >= minLon
  AND r.miny <= maxLat AND r.maxy >= minLat
```

If no R-tree is present the bbox is silently ignored and all rows are returned up to `limit`.

### Geometry exclusion

Geometry and BLOB columns are never returned. The server inspects `gpkg_geometry_columns` and `PRAGMA table_info` to identify and exclude them before building the SELECT list. Any `fields` value that names a geometry or unknown column is rejected with a descriptive error before the query runs.

### Response size cap

`query_features` enforces a **50,000-character cap** on the serialised JSON response. If the result exceeds this, the tool returns an error asking the caller to narrow the request via `fields` or `limit`.

## Running

```bash
pnpm dev        # watch mode
pnpm start      # production
```

The server listens on `http://localhost:3025/mcp` by default.

**Environment variables:**

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3025` | HTTP port |
| `ALLOWED_ORIGIN` | `http://localhost:3000` | CORS allowed origin |

## MCP client configuration

```json
{
  "mcpServers": {
    "naturalearth": {
      "type": "http",
      "url": "http://localhost:3025/mcp"
    }
  }
}
```

## Tool parameters and response shapes

### `list_layers`

No parameters. Returns a JSON array of `{ table_name, data_type }` objects sorted alphabetically, sourced from the GeoPackage `gpkg_contents` metadata table.

### `query_countries`

| Parameter | Type | Description |
|-----------|------|-------------|
| `name` | string (optional) | Case-insensitive substring match on country name |
| `iso_a2` | string (optional) | Exact ISO-A2 code (e.g. `US`, `DE`) |
| `scale` | `10m` \| `50m` \| `110m` | Map scale — selects `ne_{scale}_admin_0_countries` table (default `110m`) |
| `limit` | integer [1, 200] | Maximum rows to return (default 20) |

**SQL executed:**
```sql
SELECT NAME as name, ISO_A2 as iso_a2, CONTINENT as continent, POP_EST as pop_est
FROM "ne_{scale}_admin_0_countries"
[WHERE UPPER(NAME) LIKE UPPER(?) [AND ISO_A2 = ?]]
LIMIT ?
```

**Response:** JSON array of `{ name, iso_a2, continent, pop_est }` objects.

### `query_features`

| Parameter | Type | Description |
|-----------|------|-------------|
| `table` | string | Exact GeoPackage table name (use `list_layers` to find names) |
| `bbox` | string (optional) | Bounding box as `minLon,minLat,maxLon,maxLat` (WGS-84) |
| `limit` | integer [1, 500] | Maximum rows to return (default 50) |
| `offset` | integer ≥ 0 | Rows to skip for pagination (default 0) |
| `count` | boolean (optional) | When `true`, return only `{ total }` — no row data fetched |
| `fields` | string[] (optional) | Column names to return. Omit to get all non-geometry columns. Unknown or geometry column names cause an error. |

**Response:** JSON array of row objects (non-geometry columns only), or `{ total }` when `count` is `true`. Errors if the serialised result exceeds 50,000 characters — reduce `limit` or specify `fields`.

> **Tip:** On an unknown table, omit `fields` on the first call to discover available columns, then refine with `fields` and `limit` on subsequent calls.

## Example prompts

```
List all available Natural Earth layers.
```

```
Find all countries in Europe with a population over 10 million.
```

```
Query the ne_10m_rivers_lake_centerlines layer for rivers in North America (bbox: -130,25,-60,50).
```

```
What is the ISO-A2 code and population estimate for Germany?
```

```
Show me all urban area features (ne_50m_urban_areas) within the bounding box of the UK.
```
