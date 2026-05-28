# mcp-waterdata

An MCP server that exposes the [USGS National Water Information System (NWIS)](https://waterservices.usgs.gov/) instantaneous values as tools. No API key required.

## Tools

| Tool | Description | Category |
|------|-------------|----------|
| `get_streamflow` | Retrieve instantaneous streamflow values for one or more USGS monitoring sites | Streamflow |
| `get_site_info` | Get metadata for one or more USGS water monitoring sites | Metadata |

## Running

```bash
pnpm dev        # watch mode
pnpm start      # production
```

The server listens on `http://localhost:3009/mcp` by default.

**Environment variables:**

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3009` | HTTP port |
| `ALLOWED_ORIGIN` | `http://localhost:3000` | CORS allowed origin |

## MCP client configuration

```json
{
  "mcpServers": {
    "waterdata": {
      "type": "http",
      "url": "http://localhost:3009/mcp"
    }
  }
}
```

## Tool parameters

### `get_streamflow`

| Parameter | Type | Description |
|-----------|------|-------------|
| `sites` | string | Comma-separated USGS site numbers, e.g. `01646500,01638500` |
| `period` | string (ISO 8601 duration) | How far back to retrieve data, e.g. `P1D` (1 day), `P7D` (7 days). Default: `P1D`. Ignored if `start_date` is set. |
| `start_date` | string (`YYYY-MM-DD`) | Start date. Use instead of `period`. |
| `end_date` | string (`YYYY-MM-DD`) | End date. Defaults to today if `start_date` is set. |

### `get_site_info`

| Parameter | Type | Description |
|-----------|------|-------------|
| `sites` | string | Comma-separated USGS site numbers, e.g. `01646500,01638500` |

To find USGS site numbers, search the [USGS NWIS mapper](https://maps.waterdata.usgs.gov/mapper/index.html).

## Example prompts

```
What is the current streamflow at USGS site 01646500 (Potomac River near Washington DC)?
```

```
Show me streamflow data for the Mississippi River at St. Louis (site 07010000) for the past 7 days.
```

```
Get site information for USGS monitoring stations 01646500 and 01638500.
```

```
What was the streamflow at the Colorado River (site 09380000) from 2024-05-01 to 2024-05-07?
```

```
Compare streamflow at sites 01646500 and 01573000 over the past 3 days.
```

```
Is the Potomac River (site 01646500) running above or below normal right now?
```
