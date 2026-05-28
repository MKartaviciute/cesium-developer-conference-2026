# mcp-cdo

A standalone Node.js MCP server that wraps the [NOAA Climate Data Online (CDO) API v2](https://www.ncei.noaa.gov/cdo-web/webservices/v2) and serves historical climate station data over [Streamable HTTP](https://modelcontextprotocol.io/docs/concepts/transports).

**An API token is required.** Get a free token at <https://www.ncei.noaa.gov/cdo-web/token> — limits are 5 requests/sec and 10,000 requests/day.

## Quick start

```bash
cd workshop/lab4_mcps/mcp-cdo
pnpm install
CDO_TOKEN=your_token_here pnpm dev
# CDO MCP server running on http://localhost:3005/mcp
```

To run without watch mode:

```bash
CDO_TOKEN=your_token_here pnpm start
```

## Tools exposed

| Tool | Key Parameters | Description |
|------|---------------|-------------|
| `get_cdo_datasets` | `datatypeid`, `locationid`, `stationid`, `startdate`, `enddate` | List available CDO datasets (GHCND, GSOM, GSOY, etc.) with optional filters |
| `get_cdo_stations` | `datasetid`, `locationid`, `extent`, `datatypeid`, `startdate`, `enddate` | Search climate stations by dataset, location ID, bounding box, or data type |
| `get_cdo_data` | `datasetid`, `startdate`, `enddate`, `stationid`, `datatypeid`, `units` | Retrieve historical climate records (temperature, precipitation, snow, etc.) |

### Common dataset IDs

| ID | Name | Max date range |
|----|------|---------------|
| `GHCND` | Global Historical Climatology Network Daily | 1 year |
| `GSOM` | Global Summary of the Month | 10 years |
| `GSOY` | Global Summary of the Year | 10 years |
| `NORMAL_DLY` | Climate Normals Daily | 1 year |
| `NORMAL_MLY` | Climate Normals Monthly | 10 years |

### Common data type IDs

| ID | Description |
|----|-------------|
| `TMAX` | Maximum temperature |
| `TMIN` | Minimum temperature |
| `TAVG` | Average temperature |
| `PRCP` | Precipitation |
| `SNOW` | Snowfall |
| `SNWD` | Snow depth |
| `AWND` | Average wind speed |

Dates use ISO 8601 `YYYY-MM-DD` format. Station IDs follow the pattern `DATASET:STATIONCODE` (e.g. `GHCND:USW00094728` for New York Central Park).

## Connect from the main app

Add this entry to the MCP server list in the app:

```json
{ "label": "CDO", "url": "http://localhost:3005/mcp", "transport": "streamable-http" }
```

Then try prompts like:

> "What GHCND stations are near San Francisco that have precipitation data?"

> "Get the daily max and min temperature at Central Park station GHCND:USW00094728 for January 2024."

> "Show me monthly precipitation totals for Chicago over the last 5 years."

> "Find climate stations in California with snowfall records since 2000."

> "Plot historical annual temperature trends for Boston on the map."

## Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `CDO_TOKEN` | *(required)* | NOAA CDO API token — obtain at https://www.ncei.noaa.gov/cdo-web/token |
| `PORT` | `3005` | HTTP port to listen on |
| `ALLOWED_ORIGIN` | `http://localhost:3000` | CORS allowed origin |

## Running from the monorepo root

```bash
CDO_TOKEN=your_token_here pnpm --filter @cesium-ai/mcp-cdo dev
```
