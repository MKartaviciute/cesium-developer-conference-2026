# mcp-tnm

An MCP server that exposes [USGS The National Map (TNM)](https://tnmaccess.nationalmap.gov/api/v1/) geospatial data products as tools. No API key required — TNM Access is a free public API.

## Tools

| Tool | Description | Category |
|------|-------------|----------|
| `list_datasets` | List all available TNM dataset types | Discovery |
| `search_products` | Search downloadable geospatial products | Search |

### `search_products` parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `datasets` | string | — | Comma-separated dataset tag(s), e.g. `"National Elevation Dataset (NED) 1 arc-second"` |
| `bbox` | string | — | Bounding box as `"minX,minY,maxX,maxY"` in WGS84 decimal degrees |
| `start` | string | — | Product publication date lower bound (`YYYY-MM-DD`) |
| `stop` | string | — | Product publication date upper bound (`YYYY-MM-DD`) |
| `q` | string | — | Keyword search against product title/description |
| `limit` | number | `20` | Maximum results to return (max 100) |
| `offset` | number | `0` | Offset for pagination |

## Running

```bash
pnpm dev        # watch mode
pnpm start      # production
```

The server listens on `http://localhost:3019/mcp` by default.

**Environment variables:**

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3019` | HTTP port |
| `ALLOWED_ORIGIN` | `http://localhost:3000` | CORS allowed origin |

## MCP client configuration

```json
{
  "mcpServers": {
    "tnm": {
      "type": "http",
      "url": "http://localhost:3019/mcp"
    }
  }
}
```

## Example prompts

```
What geospatial datasets are available on The National Map?
```

```
Find elevation data products for Colorado (bounding box: -109,37,-102,41).
```

```
Search for National Hydrography Dataset products published after 2023-01-01.
```

```
Show me lidar point cloud products available for the Seattle area.
```
