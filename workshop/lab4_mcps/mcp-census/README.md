# mcp-census

An MCP server that exposes [US Census Bureau](https://www.census.gov/data/developers/data-sets/acs-5year.html) American Community Survey (ACS) 5-year estimates as tools. A free Census API key is required — register at [api.census.gov/data/key_signup.html](https://api.census.gov/data/key_signup.html).

## Tools

| Tool | Description | Category |
|------|-------------|----------|
| `list_acs_variables` | List available ACS 5-year variables with optional search filtering | Discovery |
| `get_acs_data` | Fetch ACS 5-year estimates for given variable codes and geography | Data |

## Running

```bash
pnpm dev        # watch mode
pnpm start      # production
```

The server listens on `http://localhost:3014/mcp` by default.

**Environment variables:**

| Variable | Default | Description |
|----------|---------|-------------|
| `CENSUS_API_KEY` | _(none)_ | **Required.** Free key from [api.census.gov/data/key_signup.html](https://api.census.gov/data/key_signup.html) |
| `PORT` | `3014` | HTTP port |
| `ALLOWED_ORIGIN` | `http://localhost:3000` | CORS allowed origin |

## MCP client configuration

```json
{
  "mcpServers": {
    "census": {
      "type": "http",
      "url": "http://localhost:3014/mcp"
    }
  }
}
```

## Example prompts

```
What ACS variables are available for measuring income?
```

```
Get total population for all US states.
```

```
Show me the median household income by county in Texas (state FIPS 48).
```

```
List ACS variables related to educational attainment.
```

```
Fetch tract-level population data for California (state FIPS 06).
```
