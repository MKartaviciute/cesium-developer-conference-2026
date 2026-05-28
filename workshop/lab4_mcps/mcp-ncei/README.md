# mcp-ncei

An MCP server that exposes the [NOAA National Centers for Environmental Information (NCEI) Climate Data Online Web Services API](https://www.ncei.noaa.gov/support/access-data-service-api-user-documentation) as tools. No API key required.

## Tools

| Tool | Description | Category |
|------|-------------|----------|
| `list_datasets` | List available NCEI dataset identifiers | Discovery |
| `get_station_data` | Retrieve observational data records for one or more NCEI stations | Query |

Results are returned as JSON objects from the NCEI API.

## Running

```bash
pnpm dev        # watch mode
pnpm start      # production
```

The server listens on `http://localhost:3020/mcp` by default.

**Environment variables:**

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3020` | HTTP port |
| `ALLOWED_ORIGIN` | `http://localhost:3000` | CORS allowed origin |

## MCP client configuration

```json
{
  "mcpServers": {
    "ncei": {
      "type": "http",
      "url": "http://localhost:3020/mcp"
    }
  }
}
```

## Tool parameters

### `list_datasets`

No parameters. Returns all available NCEI dataset identifiers.

### `get_station_data`

| Parameter | Type | Description |
|-----------|------|-------------|
| `dataset` | string | NCEI dataset identifier (e.g. `"daily-summaries"`, `"global-hourly"`) |
| `stations` | string | Comma-separated NCEI station IDs. For `daily-summaries`: bare or prefixed GHCND IDs (e.g. `"USW00094728"` or `"GHCND:USW00094728"`). For `global-hourly`: use USAF-WBAN hyphenated format (e.g. `"725053-94728"`) or the 11-digit compound form (e.g. `"72505394728"`). |
| `startDate` | string (YYYY-MM-DD) | Start of date range |
| `endDate` | string (YYYY-MM-DD) | End of date range |
| `dataTypes` | string (optional) | Comma-separated variable codes (e.g. `"TMAX,TMIN,PRCP"`) |
| `fields` | string (optional) | Comma-separated response field names to keep (e.g. `"DATE,TMP,WND"`). `DATE` is always included. Useful to reduce payload size for wide datasets like `global-hourly`. |
| `limit` | integer [1, 1000] (optional) | Records to return (default 100) |

## Example prompts

```
What NCEI datasets are available?
```

```
Get daily temperature and precipitation data for Central Park (GHCND:USW00094728) for January 2024.
```

```
Retrieve hourly observations from station WBAN:94728 for the first week of July 2023.
```

```
What were the maximum temperatures at O'Hare Airport (GHCND:USW00094846) during the summer of 2022?
```
