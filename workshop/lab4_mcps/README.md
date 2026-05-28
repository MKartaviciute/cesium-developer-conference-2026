# Lab 4 — MCP Servers

A pnpm workspace containing seven independent MCP (Model Context Protocol) HTTP servers that expose environmental and geospatial data to AI agents.

## Servers at a Glance

| Package | Port | Data Source | Auth Required |
|---|---|---|---|
| [mcp-nws](#mcp-nws) | 3003 | NOAA National Weather Service | No |
| [mcp-coops](#mcp-coops) | 3004 | NOAA CO-OPS Tides & Currents | No |
| [mcp-cdo](#mcp-cdo) | 3005 | NOAA Climate Data Online | Yes — CDO token |
| [mcp-earthquake](#mcp-earthquake) | 3006 | USGS Earthquake Catalog | No |
| [mcp-earthquake-feeds](#mcp-earthquake-feeds) | 3007 | USGS Earthquake RSS Feeds | No |
| [mcp-eonet](#mcp-eonet) | 3008 | NASA Earth Observatory Natural Events | No |
| [mcp-waterdata](#mcp-waterdata) | 3009 | USGS Water Data Services | No |

## Prerequisites

- Node.js 20+
- pnpm 9+

## Install & Build

```bash
# From this directory
pnpm install
pnpm --recursive run build
```

## Start All Servers

```bash
pnpm --recursive run start
```

Or start a single server:

```bash
cd mcp-nws && pnpm start
```

## Common Environment Variables

Every server reads these from its own `.env` file or the process environment:

| Variable | Default | Description |
|---|---|---|
| `PORT` | server-specific | Override the listening port |
| `ALLOWED_ORIGIN` | `http://localhost:3000` | CORS allowed origin |

`mcp-cdo` additionally requires `CDO_TOKEN` (see [mcp-cdo](#mcp-cdo) below).

## MCP Endpoint

All servers expose a single stateless endpoint:

```
POST http://localhost:<port>/mcp
```

Each POST creates a fresh MCP session. Rate limit: 60 requests/minute per IP.

---

## mcp-nws

**Port 3003** — NOAA National Weather Service API. US locations only.

### Tools

| Tool | Description |
|---|---|
| `get_nws_forecast` | 7-day forecast for a lat/lon |
| `get_nws_hourly_forecast` | Up to 156-hour hourly forecast |
| `get_nws_alerts` | Active watches, warnings, and advisories |

See [mcp-nws/README.md](mcp-nws/README.md) for full parameter reference and examples.

---

## mcp-coops

**Port 3004** — NOAA Center for Operational Oceanographic Products and Services.

### Tools

| Tool | Description |
|---|---|
| `get_water_level` | Verified/preliminary water levels at tide stations |
| `get_tide_predictions` | Predicted tide heights (high/low events or hourly) |
| `get_station_observations` | Meteorological observations (temperature, wind, pressure) |

See [mcp-coops/README.md](mcp-coops/README.md) for full parameter reference and examples.

---

## mcp-cdo

**Port 3005** — NOAA Climate Data Online historical records.

**Requires a free API token.** Get one at <https://www.ncei.noaa.gov/cdo-web/token> and set it:

```bash
# mcp-cdo/.env
CDO_TOKEN=your_token_here
```

Rate limits imposed by NOAA: 5 requests/second, 10 000 requests/day.

### Tools

| Tool | Description |
|---|---|
| `get_cdo_datasets` | List available datasets (GHCND, GSOM, GSOY, NORMAL_*, …) |
| `get_cdo_stations` | Search climate stations by dataset, location, or bounding box |
| `get_cdo_data` | Retrieve historical climate records |

Common dataset IDs: `GHCND` (daily, max 1-year range), `GSOM` (monthly), `GSOY` (annual).  
Common data types: `TMAX`, `TMIN`, `TAVG`, `PRCP`, `SNOW`, `SNWD`, `AWND`.

See [mcp-cdo/README.md](mcp-cdo/README.md) for full parameter reference and examples.

---

## mcp-earthquake

**Port 3006** — USGS Earthquake Hazards Program FDSN Event API.

### Tools

| Tool | Description |
|---|---|
| `query_earthquakes` | Query seismic events with magnitude, depth, time, and bounding-box filters |
| `get_earthquake_count` | Count earthquakes matching criteria |

Results are returned as GeoJSON FeatureCollections. The `limit` parameter supports up to 20 000 events.

---

## mcp-earthquake-feeds

**Port 3007** — USGS pre-built GeoJSON earthquake feed snapshots.

### Tools

| Tool | Description |
|---|---|
| `get_earthquake_feed` | Fetch earthquakes by magnitude level and time period |

**Magnitude levels:** `all`, `1.0`, `2.5`, `4.5`, `significant`  
**Time periods:** `hour`, `day`, `week`, `month`

---

## mcp-eonet

**Port 3008** — NASA Earth Observatory Natural Event Tracker (EONET) API v3.

### Tools

| Tool | Description |
|---|---|
| `list_natural_events` | List natural events with filters for status, category, and recency |
| `list_event_categories` | List available event categories |

Event types include wildfires, volcanoes, severe storms, sea and lake ice, floods, and more.  
Each event includes geometry (coordinates + optional magnitude) and source citations.

---

## mcp-waterdata

**Port 3009** — USGS National Water Information System instantaneous values.

### Tools

| Tool | Description |
|---|---|
| `get_streamflow` | Retrieve instantaneous streamflow for one or more USGS monitoring sites |
| `get_site_info` | Get metadata for USGS monitoring sites |

`get_streamflow` accepts a `period` in ISO 8601 duration format (e.g. `P1D` for the past day, `P7D` for seven days) or explicit `startDate`/`endDate` strings (`YYYY-MM-DD`).

---

## Architecture

All servers follow the same pattern documented in [docs/mcp-scaffold-reference.md](../../docs/mcp-scaffold-reference.md):

- **Transport:** Stateless `StreamableHTTPServerTransport` — one `McpServer` instance per POST request
- **Validation:** Zod schemas on every tool input
- **CORS:** Configurable via `ALLOWED_ORIGIN`
- **Rate limiting:** `express-rate-limit` at 60 req/min on `/mcp`
- **No secrets in source:** API keys loaded from environment only

```
mcp-<name>/
  src/
    index.ts          # Express server + MCP wiring
    <client>.ts       # Typed REST client for upstream API
    tools/
      index.ts        # Registers tools with McpServer
      <tool>.ts       # Individual tool: Zod schema + handler
```
