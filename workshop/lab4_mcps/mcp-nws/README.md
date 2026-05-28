# mcp-nws

An MCP server that exposes [NOAA National Weather Service](https://www.weather.gov/documentation/services-web-api) data as tools. No API key required — NWS is a free public API for US locations.

## Tools

| Tool | Description | Category |
|------|-------------|----------|
| `get_nws_forecast` | 7-day forecast (14 day/night periods) for a lat/lon | Forecast |
| `get_nws_hourly_forecast` | Hourly forecast for up to 156 hours for a lat/lon | Forecast |
| `get_nws_alerts` | Active weather warnings, watches, and advisories for a lat/lon | Alerts |

All tools accept `latitude` and `longitude` in decimal degrees. **US locations only.**

## Running

```bash
pnpm dev        # watch mode
pnpm start      # production
```

The server listens on `http://localhost:3003/mcp` by default.

**Environment variables:**

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3003` | HTTP port |
| `ALLOWED_ORIGIN` | `http://localhost:3000` | CORS allowed origin |

## MCP client configuration

```json
{
  "mcpServers": {
    "nws": {
      "type": "http",
      "url": "http://localhost:3003/mcp"
    }
  }
}
```

## Example prompts

```
What's the weather forecast for New York City?
```

```
Are there any active weather alerts near latitude 40.7128, longitude -74.0060?
```

```
Give me the hourly forecast for the next 12 hours for Denver, Colorado (39.7392, -104.9903).
```

```
Is it safe to fly a drone in Chicago today? Check the forecast and any active alerts.
```

```
What's the weekend weather looking like for Seattle (47.6062, -122.3321)?
```

```
Show me the next 48 hours of hourly weather for Miami (25.7617, -80.1918).
```
