# mcp-earthquake

An MCP server that exposes the [USGS Earthquake Hazards Program FDSN Event API](https://earthquake.usgs.gov/fdsnws/event/1/) as tools. No API key required.

## Tools

| Tool | Description | Category |
|------|-------------|----------|
| `query_earthquakes` | Query seismic events with magnitude, depth, time, and bounding-box filters | Query |
| `get_earthquake_count` | Count earthquakes matching criteria without fetching full event data | Query |

Results are returned as GeoJSON FeatureCollections (or a plain integer for the count tool). The `limit` parameter supports up to 20 000 events.

## Running

```bash
pnpm dev        # watch mode
pnpm start      # production
```

The server listens on `http://localhost:3006/mcp` by default.

**Environment variables:**

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3006` | HTTP port |
| `ALLOWED_ORIGIN` | `http://localhost:3000` | CORS allowed origin |

## MCP client configuration

```json
{
  "mcpServers": {
    "earthquake": {
      "type": "http",
      "url": "http://localhost:3006/mcp"
    }
  }
}
```

## Tool parameters

### `query_earthquakes`

| Parameter | Type | Description |
|-----------|------|-------------|
| `starttime` | string (ISO 8601) | Start of time range, e.g. `2024-01-01T00:00:00` |
| `endtime` | string (ISO 8601) | End of time range |
| `minmagnitude` | number | Minimum magnitude (inclusive) |
| `maxmagnitude` | number | Maximum magnitude (inclusive) |
| `mindepth` | number | Minimum depth in km |
| `maxdepth` | number | Maximum depth in km |
| `minlatitude` | number [-90, 90] | Southern edge of bounding box |
| `maxlatitude` | number [-90, 90] | Northern edge of bounding box |
| `minlongitude` | number [-360, 360] | Western edge of bounding box |
| `maxlongitude` | number [-360, 360] | Eastern edge of bounding box |
| `limit` | integer [1, 20000] | Maximum events to return |

### `get_earthquake_count`

Same filters as `query_earthquakes` (no `limit`). Returns a single integer.

## Example prompts

```
How many earthquakes magnitude 4.0 or greater happened worldwide in the last 7 days?
```

```
Show me all earthquakes in California (lat 32–42, lon -125 to -114) since January 1, 2024.
```

```
Were there any deep earthquakes (deeper than 300 km) in the Pacific this month?
```

```
What were the 10 largest earthquakes in 2023?
```

```
Give me a count of earthquakes near Japan (lat 30–46, lon 130–146) for each month of 2024.
```

```
Find earthquakes between magnitude 2.5 and 4.0 in the Pacific Northwest in the past 30 days.
```
