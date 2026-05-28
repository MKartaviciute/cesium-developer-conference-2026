# mcp-openaq

An MCP server that exposes [OpenAQ](https://openaq.org/) air quality monitoring data as tools. No API key required — OpenAQ is a free public platform.

## Tools

| Tool | Description | Category |
|------|-------------|----------|
| `get_locations` | List air quality monitoring stations | Discovery |
| `get_measurements` | Get latest measurements for a monitoring location | Readings |

### `get_locations` parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `coordinates` | string | — | Centre point for radius search as `"lat,lon"` |
| `radius` | number | `10000` | Search radius in metres (max 100,000); used with `coordinates` |
| `country_id` | string | — | ISO 3166-1 alpha-2 country code filter (e.g. `"US"`) |
| `limit` | number | `20` | Maximum results to return (max 100) |
| `page` | number | `1` | Page number for pagination |

### `get_measurements` parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `locations_id` | number | — | **Required.** OpenAQ numeric location ID |
| `limit` | number | `100` | Maximum measurements to return (max 1000) |

## Running

```bash
pnpm dev        # watch mode
pnpm start      # production
```

The server listens on `http://localhost:3018/mcp` by default.

**Environment variables:**

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3018` | HTTP port |
| `ALLOWED_ORIGIN` | `http://localhost:3000` | CORS allowed origin |

## MCP client configuration

```json
{
  "mcpServers": {
    "openaq": {
      "type": "http",
      "url": "http://localhost:3018/mcp"
    }
  }
}
```

## Example prompts

```
Find air quality monitoring stations within 5 km of Paris (48.8566, 2.3522).
```

```
Show me all OpenAQ locations in Germany.
```

```
Get the latest PM2.5 and NO2 readings for OpenAQ location 7936.
```

```
What are the air quality stations near Los Angeles (34.0522, -118.2437)?
```
