# mcp-planetarycomputer

An MCP server that exposes the [Microsoft Planetary Computer STAC API](https://planetarycomputer.microsoft.com/api/stac/v1) as tools. No API key required.

## Tools

| Tool | Description | Category |
|------|-------------|----------|
| `list_collections` | List all available earth observation data collections | Discovery |
| `search_items` | Search satellite and earth observation items by collection, bounding box, and date | Search |

Results are returned as JSON objects. `search_items` returns `{ items, nextToken }` where `items` is an array of compact scene summaries (id, bbox, key EO properties, preview URL) and `nextToken` is a pagination cursor (`null` on the last page).

## Running

```bash
pnpm dev        # watch mode
pnpm start      # production
```

The server listens on `http://localhost:3022/mcp` by default.

**Environment variables:**

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3022` | HTTP port |
| `ALLOWED_ORIGIN` | `http://localhost:3000` | CORS allowed origin |

## MCP client configuration

```json
{
  "mcpServers": {
    "planetarycomputer": {
      "type": "http",
      "url": "http://localhost:3022/mcp"
    }
  }
}
```

## Tool parameters

### `list_collections`

No parameters. Returns all available collection IDs and metadata from the Planetary Computer STAC catalog.

### `search_items`

| Parameter | Type | Description |
|-----------|------|-------------|
| `collections` | string[] (optional) | Collection IDs to restrict search (e.g. `["sentinel-2-l2a", "landsat-c2-l2"]`) |
| `bbox` | [number, number, number, number] (optional) | Bounding box as `[minLon, minLat, maxLon, maxLat]` |
| `datetime` | string (optional) | ISO 8601 date or interval (e.g. `"2023-01-01"` or `"2023-01-01/2023-03-31"`) |
| `limit` | integer [1, 100] (optional) | Items to return (default 10) |
| `token` | string (optional) | Pagination cursor — pass the `nextToken` value from a previous `search_items` response to retrieve the next page |

## Example prompts

```
What earth observation collections are available in the Planetary Computer?
```

```
Find Sentinel-2 imagery over San Francisco (bbox: -122.5, 37.7, -122.3, 37.8) from March 2023.
```

```
Search for Landsat scenes over the Amazon rainforest (bbox: -65, -10, -55, 0) in the dry season of 2022.
```

```
What MODIS data is available for Europe during January 2024?
```
