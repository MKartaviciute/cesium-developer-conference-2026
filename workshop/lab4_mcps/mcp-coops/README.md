# mcp-coops

A standalone Node.js MCP server that wraps the [NOAA CO-OPS Tides and Currents API](https://api.tidesandcurrents.noaa.gov/api/prod/) and serves tidal and meteorological station data over [Streamable HTTP](https://modelcontextprotocol.io/docs/concepts/transports).

No API key required — the NOAA CO-OPS API is free and open.

## Quick start

```bash
cd packages/mcp-coops
pnpm install
pnpm dev
# CO-OPS MCP server running on http://localhost:3004/mcp
```

To run without watch mode:

```bash
pnpm start
```

## Tools exposed

| Tool | Parameters | Description |
|------|-----------|-------------|
| `get_water_level` | `station`, `begin_date`, `end_date`, `datum`, `interval`, `units`, `time_zone` | Verified or preliminary water level readings for a tide station |
| `get_tide_predictions` | `station`, `begin_date`, `end_date`, `datum`, `interval`, `units`, `time_zone` | Predicted tide heights (high/low events, hourly, or 6-minute) |
| `get_station_observations` | `station`, `product`, `begin_date`, `end_date`, `units`, `time_zone` | Meteorological observations: air/water temperature, wind, air pressure, humidity |

Dates use `YYYYMMDD` format. Station IDs are 7-digit NOAA CO-OPS identifiers (e.g. `9414290` for San Francisco).

## Connect from the main app

Add this entry to the MCP server list in the app:

```json
{ "label": "CO-OPS", "url": "http://localhost:3004/mcp", "transport": "streamable-http" }
```

Then try prompts like:

> "What are the tide predictions for Boston Harbor this week?"

> "Show me the water level readings at San Francisco station 9414290 for the past 3 days."

> "What was the wind speed and direction at Lewes station 8557380 yesterday?"

> "Get the hourly water temperature at Key West for last week and plot it on the map."

> "Compare high and low tides at Seattle station 9447130 over the next 7 days."

## Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3004` | HTTP port to listen on |
| `ALLOWED_ORIGIN` | `http://localhost:3000` | CORS allowed origin |

## Running from the monorepo root

```bash
pnpm --filter @cesium-ai/mcp-coops dev
```
