# mcp-overture

An MCP server that exposes [Overture Maps](https://overturemaps.org/) data (buildings, places, and administrative divisions) as tools. Queries are executed against remote Parquet files via DuckDB — no local data download or API key required.

## How data is fetched

All data lives in the **public Overture Maps S3 bucket** (`s3://overturemaps-us-west-2/release/2026-05-20.0`). Access is entirely anonymous — no credentials are set or needed.

At startup the server opens an **in-memory DuckDB database** and installs two extensions:

- **`httpfs`** — enables DuckDB to read Parquet files directly over HTTPS from S3 without downloading them first. Only the row-groups needed to satisfy a query's predicates are fetched.
- **`spatial`** — adds geometry types and `ST_AsGeoJSON()`, used to serialise building footprint polygons.

After the extensions load, `s3_region` is set to `us-west-2` and credentials are cleared so every S3 request is unsigned. The flag `dbReady` flips to `true`; any tool call that arrives before this completes returns a retry message.

### Data sources

| Theme | S3 path glob | Used by |
|-------|-------------|---------|
| Buildings | `theme=buildings/type=building/*.parquet` | `query_buildings` |
| Places | `theme=places/type=place/*.parquet` | `query_places` |
| Divisions | `theme=divisions/type=division_area/*.parquet` | `query_admin_divisions` |

### Bounding-box filtering

The Overture Parquet files embed a `bbox` struct column (`xmin`, `ymin`, `xmax`, `ymax`) in every row. Each tool WHERE-clause filters on this column:

```sql
bbox.xmin <= maxLon AND bbox.xmax >= minLon
AND bbox.ymin <= maxLat AND bbox.ymax >= minLat
```

DuckDB's Parquet reader uses Parquet statistics to skip row-groups whose bounding boxes fall entirely outside the query bbox, so only relevant data is fetched from S3.

### Buildings shard index

The buildings dataset is split across **512 Parquet shards**. Without guidance, a query scans all of them (~120 s). A hardcoded shard index maps known geographic regions to the small subset of shards that contain their data:

- **UK / Ireland** (`-10°–2°E, 49°–62°N`) → 11 specific shards, reducing scan time dramatically.

If the query bbox falls inside a known region the SQL source becomes a literal list of those shard filenames. If not, it falls back to the global glob (`*.parquet`), which is slow.

### Query timeout

Every query races against a **120-second timeout**. If DuckDB hasn't returned by then the tool responds with a timeout error.

## Tools

| Tool | Description | Category |
|------|-------------|----------|
| `query_buildings` | Query building footprints within a bounding box | Query |
| `query_places` | Query POIs/places within a bounding box with optional category filter and pagination | Query |
| `query_admin_divisions` | Query administrative division areas by name or ISO-2 country code | Query |

## Running

```bash
pnpm dev        # watch mode
pnpm start      # production
```

The server listens on `http://localhost:3026/mcp` by default.

**Environment variables:**

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3026` | HTTP port |
| `ALLOWED_ORIGIN` | `http://localhost:3000` | CORS allowed origin |

## MCP client configuration

```json
{
  "mcpServers": {
    "overture": {
      "type": "http",
      "url": "http://localhost:3026/mcp"
    }
  }
}
```

## Tool parameters and response shapes

### `query_buildings`

| Parameter | Type | Description |
|-----------|------|-------------|
| `bbox` | string | Bounding box as `minLon,minLat,maxLon,maxLat` (WGS-84) |
| `min_height` | number (optional) | Minimum building height in metres |
| `limit` | integer [1, 1000] | Maximum rows to return (default 100) |

**SQL executed:**
```sql
SELECT id, height, class, ST_AsGeoJSON(geometry) AS geometry
FROM read_parquet(<source>, hive_partitioning=false)
WHERE bbox.xmin <= maxLon AND bbox.xmax >= minLon
  AND bbox.ymin <= maxLat AND bbox.ymax >= minLat
  [AND height >= min_height]
LIMIT <limit>
```

**Response:** JSON array of objects with `id`, `height`, `class`, and `geometry` (GeoJSON polygon string).

> **Performance note:** S3 shard-skipping is currently indexed for UK/Ireland only. Bounding boxes outside that region scan all 512 S3 shards (~2 minutes).

---

### `query_places`

| Parameter | Type | Description |
|-----------|------|-------------|
| `bbox` | string | Bounding box as `minLon,minLat,maxLon,maxLat` (WGS-84) |
| `category` | string (optional) | Case-insensitive substring filter on primary category |
| `limit` | integer [1, 100] | Maximum rows to return (default 50) |
| `offset` | integer ≥ 0 | Rows to skip for pagination (default 0) |

**SQL executed:** two queries run in parallel — a `COUNT(*)` and a paginated `SELECT`:
```sql
-- count
SELECT COUNT(*) AS total
FROM read_parquet('<places_url>', hive_partitioning=false)
WHERE bbox.xmin <= maxLon AND ... [AND lower(categories.primary) LIKE ...]

-- data
SELECT id, names.primary AS name, categories.primary AS category,
       bbox.xmin AS lon, bbox.ymin AS lat
FROM read_parquet('<places_url>', hive_partitioning=false)
WHERE ...
LIMIT <limit> OFFSET <offset>
```

**Response:** JSON object `{ total, offset, rows }` where `rows` is an array of `{ id, name, category, lon, lat }`. The `total` field lets callers determine whether a next page exists.

---

### `query_admin_divisions`

| Parameter | Type | Description |
|-----------|------|-------------|
| `name` | string (optional) | Case-insensitive substring filter on division name |
| `country` | string (optional) | ISO-2 country code (e.g. `US`, `DE`) |
| `limit` | integer [1, 200] | Maximum rows to return (default 50) |

**SQL executed:**
```sql
SELECT id, country, subtype, names.primary AS name
FROM read_parquet('<divisions_url>', hive_partitioning=false)
[WHERE lower(names.primary) LIKE ... [AND country = '...']]
LIMIT <limit>
```

**Response:** JSON array of objects with `id`, `country`, `subtype`, and `name`.

## Example prompts

```
Show me buildings taller than 50 m in downtown Chicago (bbox: -87.640,41.878,-87.620,41.892).
```

```
Find restaurants near the Eiffel Tower (bbox: 2.288,48.853,2.302,48.862).
```

```
List all administrative divisions in Germany.
```

```
What buildings are in the bbox covering central London (bbox: -0.130,51.500,-0.090,51.520)?
```

```
Find all hospital places within the bounding box of Manhattan.
```
