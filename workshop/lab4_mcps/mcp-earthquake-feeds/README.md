# mcp-earthquake-feeds

An MCP server that exposes [USGS pre-built GeoJSON earthquake feed snapshots](https://earthquake.usgs.gov/earthquakes/feed/v1.0/geojson.php) as a tool. No API key required. Feeds are cached on the USGS side and update every minute.

## Tools

| Tool | Description | Category |
|------|-------------|----------|
| `get_earthquake_feed` | Fetch a pre-bucketed USGS GeoJSON summary feed of recent earthquakes | Feed |

## Running

```bash
pnpm dev        # watch mode
pnpm start      # production
```

The server listens on `http://localhost:3007/mcp` by default.

**Environment variables:**

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3007` | HTTP port |
| `ALLOWED_ORIGIN` | `http://localhost:3000` | CORS allowed origin |

## MCP client configuration

```json
{
  "mcpServers": {
    "earthquake-feeds": {
      "type": "http",
      "url": "http://localhost:3007/mcp"
    }
  }
}
```

## Tool parameters

### `get_earthquake_feed`

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `period` | `"hour"` \| `"day"` \| `"week"` \| `"month"` | `"day"` | Time window for the feed |
| `min_magnitude` | `"all"` \| `"1.0"` \| `"2.5"` \| `"4.5"` \| `"significant"` | `"2.5"` | Minimum magnitude bucket |

Returns a raw GeoJSON FeatureCollection. Use `mcp-earthquake` for custom time ranges or fine-grained filters.

## Example prompts

```
What significant earthquakes happened in the past week?
```

```
Show me all earthquakes in the past hour.
```

```
Are there any magnitude 4.5+ earthquakes from the past month?
```

```
Give me a quick summary of today's seismic activity worldwide.
```

```
What are the most recent significant earthquakes? Show me the top events from this week.
```

```
List all earthquakes from the past day, including small ones (all magnitudes).
```
