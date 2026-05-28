# mcp-openaddresses

An MCP server that exposes the [OpenAddresses](https://openaddresses.io/) address dataset as tools. Address collections are downloaded and indexed locally — a free [batch.openaddresses.io](https://batch.openaddresses.io) account is required for downloads.

## Tools

| Tool | Description | Category |
|------|-------------|----------|
| `list_collections` | List available OpenAddresses address collections | Discovery |
| `query_addresses_by_bbox` | Find address points within a bounding box for a collection | Query |
| `geocode_address` | Text-search for addresses within an already-indexed collection | Query |

The first `query_addresses_by_bbox` call for a collection triggers a background download and SQLite R-tree index build. Subsequent calls query the local index. `geocode_address` requires the collection to already be indexed.

> **Warning:** Initial indexing is slow. The `us-west` collection took **over 60 minutes** to download and index. Plan accordingly — pre-download collections before a demo or workshop session (see [Setup](#setup)).

## How data is fetched

Data flows through three stages: collection discovery, download + indexing, and query.

### 1. Collection discovery (`list_collections`)

On first call the server fetches the collection index from `https://batch.openaddresses.io/api/collections` and writes it to `data/collections.json`. Every subsequent call reads from that local cache — no network request is made again.

### 2. Download & indexing (`startIndexing`)

> **Recommendation:** Use `pnpm download-data` to pre-download and index collections before starting the server (see [Pre-download collections](#3-pre-download-collections-optional)). On-demand indexing blocks queries for the entire duration — `us-west` took over 60 minutes — and the MCP tool returns a retry message the whole time. Pre-indexing means queries work immediately on startup.

Triggered automatically on the first `query_addresses_by_bbox` call for a collection that has not yet been indexed:

1. **Resolve download URL** — looks up the collection's `download_url` from the cached index.
2. **Spawn a Worker thread** — all heavy work runs in a dedicated `node:worker_threads` Worker so the main thread (MCP request handling) stays fully responsive during a long index build.
3. **Stream the ZIP** — the worker downloads the file via Node.js `https`/`http`, following up to 5 redirects, and pipes the response directly into `unzipper` without buffering the whole file to disk. Cross-origin redirects (e.g. to S3 pre-signed URLs) drop the `Authorization` header automatically.
4. **Parse GeoJSON files** — each `.geojson` entry in the ZIP is read line-by-line with `readline`. Each line is parsed as a GeoJSON `Feature` with a `Point` geometry; lines that are empty or fail `JSON.parse` are skipped.
5. **Batch insert into SQLite** — rows are accumulated in memory in batches of 50 000 and written to a per-collection SQLite database (`data/addresses_<id>.sqlite`) using `better-sqlite3` transactions. During the build the DB is opened with performance pragmas (`synchronous = OFF`, `journal_mode = MEMORY`, `cache_size = 64 MB`, `locking_mode = EXCLUSIVE`) that are restored to durable settings (`WAL`, `synchronous = NORMAL`) before the connection is closed.
6. **Bulk-populate R-tree spatial index** — after all address rows are committed, the R-tree virtual table (`addr_rtree`) is populated in a single `INSERT … SELECT` statement rather than per-row inserts, allowing SQLite to build the tree structure more efficiently.
7. **Mark as indexed** — a `meta` row `indexed = 1` is set when the full import succeeds. The `indexingInProgress` Set on the main thread prevents duplicate concurrent builds.

While indexing runs in the background the tool returns `{ status: "indexing_in_progress" }` — callers should retry after a short delay.

### 3. Query

- **`query_addresses_by_bbox`** — runs a single SQLite R-tree range query against the local database and returns up to `limit` matching rows.
- **`geocode_address`** — runs a `LIKE` substring search on `number || ' ' || street || ' ' || city` within the already-indexed database.

All data is stored locally under the `data/` directory; no external API calls are made after the initial download.

## Setup

### 1. Get an API token

Downloads require a free account at [batch.openaddresses.io](https://batch.openaddresses.io):

1. Log in with your email
2. Open your profile → **Tokens** → create a new token
3. Copy the token value

### 2. Configure `.env`

Create a `.env` file in this directory:

```
OA_TOKEN=your-token-here
```

### 3. Pre-download collections (optional)

Pre-index one or more collections before starting the server so queries work immediately:

```bash
pnpm download-data                        # all collections (~80 GB total)
pnpm download-data us-northeast us-south  # specific collections by name
```

The script uses `curl` under the hood, which handles redirects, retries (up to 5), and can **resume interrupted downloads** — if a download is cut off, re-run the same command and it picks up where it left off.

Additional flags:

| Flag | Description |
|------|-------------|
| `--keep-zip` | Keep the downloaded ZIP after indexing (useful for debugging or re-indexing) |
| `--file <path>` | Index a locally downloaded ZIP instead of fetching from the network (single collection only) |

Example using a local file:

```bash
pnpm download-data us-west --file C:\Downloads\us-west.zip
```

Available collection names: `us-west`, `us-south`, `us-northeast`, `us-midwest`, `ca`, `global`.

Without pre-downloading, the first `query_addresses_by_bbox` call for a collection triggers an on-demand download (streamed directly, no intermediate ZIP on disk). Indexing time varies significantly by collection size — `us-west` took over 60 minutes. **Pre-download and index only the region(s) you actually need** — downloading all collections is unnecessary and takes many hours.

## Running

```bash
pnpm dev        # watch mode
pnpm start      # production
```

The server listens on `http://localhost:3028/mcp` by default.

**Environment variables:**

| Variable | Default | Description |
|----------|---------|-------------|
| `OA_TOKEN` | — | **Required for downloads.** API token from batch.openaddresses.io |
| `PORT` | `3028` | HTTP port |
| `ALLOWED_ORIGIN` | `http://localhost:3000` | CORS allowed origin |

## MCP client configuration

```json
{
  "mcpServers": {
    "openaddresses": {
      "type": "http",
      "url": "http://localhost:3028/mcp"
    }
  }
}
```

## Tool parameters

### `list_collections`

No parameters. Returns a JSON array of `{ id, name }` objects. The collection index is fetched once and cached locally.

### `query_addresses_by_bbox`

| Parameter | Type | Description |
|-----------|------|-------------|
| `collection_id` | string | Collection id from `list_collections` |
| `bbox` | string | Bounding box as `minLon,minLat,maxLon,maxLat` (WGS-84) |
| `limit` | integer [1, 2000] | Maximum results to return (default 100) |

Returns `lon`, `lat`, `number`, `street`, `city`, `region`, and `postcode` for each address. Returns a retry message while the collection is being indexed.

### `geocode_address`

| Parameter | Type | Description |
|-----------|------|-------------|
| `collection_id` | string | Collection id — must already be indexed |
| `q` | string | Case-insensitive substring to match against number + street + city |
| `limit` | integer [1, 200] | Maximum results to return (default 20) |

Returns the same fields as `query_addresses_by_bbox`. Returns an error if the collection is not yet indexed.

## Example prompts

### Discovery

```
List all available OpenAddresses collections.
```

### Bounding-box queries (us-west)

```
Find addresses near downtown San Francisco, CA (bbox: -122.425,37.770,-122.405,37.785).
```

```
Show me addresses near the Las Vegas Strip, NV (bbox: -115.180,36.100,-115.140,36.130).
```

```
Find addresses near Pike Place Market in Seattle, WA (bbox: -122.345,47.607,-122.334,47.614).
```

```
List addresses near downtown Portland, OR (bbox: -122.690,45.515,-122.670,45.530).
```

```
Show addresses near downtown Los Angeles, CA (bbox: -118.260,34.040,-118.240,34.060).
```

```
Find addresses near downtown Phoenix, AZ (bbox: -112.080,33.445,-112.060,33.460).
```

```
List addresses near the University of Washington campus in Seattle (bbox: -122.315,47.650,-122.300,47.660).
```

### Geocode (text search — collection must already be indexed)

```
Find all addresses matching "Market St" in the us-west collection.
```

```
Look up "Sunset Blvd" addresses in the us-west collection.
```

```
Search for "Powell St" in the us-west collection.
```

```
Geocode "Hollywood Blvd" in the us-west collection.
```
