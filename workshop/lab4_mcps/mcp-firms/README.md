# mcp-firms

An MCP server that exposes [NASA FIRMS (Fire Information for Resource Management System)](https://firms.modaps.eosdis.nasa.gov/) active fire and hotspot data as tools. Requires a free NASA FIRMS MAP key.

## Tools

| Tool | Description | Category |
|------|-------------|----------|
| `get_active_fires` | Fetch active fire/hotspot detections for a region | Fire data |
| `get_transaction_status` | Check API quota/transaction status for your MAP key | Account |

### `get_active_fires` parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `source` | enum | `VIIRS_SNPP_NRT` | Satellite/instrument: `VIIRS_SNPP_NRT`, `VIIRS_NOAA20_NRT`, or `MODIS_NRT` |
| `area` | string | `world` | `"world"` for global, or bounding box as `"minLon,minLat,maxLon,maxLat"` |
| `day_range` | number | `1` | Number of days back from date (1–10) |
| `date` | string | today UTC | ISO date (`YYYY-MM-DD`) |

## Setup

### 1. Get a NASA FIRMS MAP key (required)

Register for a free MAP key at <https://firms.modaps.eosdis.nasa.gov/api/map_key/>. The key is issued instantly.

### 2. Create a `.env` file

```bash
cp .env.example .env
# then open .env and replace the placeholder with your key
```

`.env` is loaded automatically by the `dev` and `start` scripts via `tsx --env-file .env`.

## Running

```bash
pnpm dev        # watch mode
pnpm start      # production
```

The server listens on `http://localhost:3017/mcp` by default.

**Environment variables:**

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3017` | HTTP port |
| `ALLOWED_ORIGIN` | `http://localhost:3000` | CORS allowed origin |
| `FIRMS_MAP_KEY` | — | **Required.** NASA FIRMS MAP key |

**API limits:**

NASA FIRMS MAP keys are subject to a **5,000 transaction limit per 10 minutes**. Each `get_active_fires` call counts as one transaction. Use `get_transaction_status` to check your remaining quota.

## MCP client configuration

```json
{
  "mcpServers": {
    "firms": {
      "type": "http",
      "url": "http://localhost:3017/mcp"
    }
  }
}
```

## Example prompts

```
Show me active wildfires in California over the last 3 days.
```

```
Are there any fire hotspots detected in Australia right now?
```

```
Fetch active fires in the bounding box -125,24,-66,49 (contiguous US) for today using MODIS.
```

```
How many API transactions have I used this month on my FIRMS key?
```
