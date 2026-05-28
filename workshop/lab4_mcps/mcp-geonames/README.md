# mcp-geonames

An MCP server that exposes the [GeoNames geographical database](https://www.geonames.org/) as tools. Requires a free GeoNames account with web services enabled.

## Account setup

1. Register at [geonames.org/login](https://www.geonames.org/login)
2. Confirm your email address
3. Log in, then go to [geonames.org/manageaccount](https://www.geonames.org/manageaccount)
4. Check the **"Free Web Services"** checkbox and click **Update**

> Without step 4 the API returns `"user does not exist"` even with a valid username.

## Tools

| Tool | Description | Category |
|------|-------------|----------|
| `search_places` | Search for place names and geographic features by keyword | Search |
| `find_nearby` | Find geographic features close to a coordinate | Proximity |

Results are returned as JSON objects from the GeoNames API. Each record is trimmed to the following fields: `name`, `lat`, `lng`, `distance`, `fcode`, `fcodeName`, `population`, `adminName1`, `adminCode1`, `countryCode`, `countryName`.

## Running

```bash
pnpm dev        # watch mode
pnpm start      # production
```

The server listens on `http://localhost:3021/mcp` by default.

**Environment variables:**

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3021` | HTTP port |
| `ALLOWED_ORIGIN` | `http://localhost:3000` | CORS allowed origin |
| `GEONAMES_USERNAME` | — | **Required.** Free account username from [geonames.org/login](https://www.geonames.org/login) |

## MCP client configuration

```json
{
  "mcpServers": {
    "geonames": {
      "type": "http",
      "url": "http://localhost:3021/mcp"
    }
  }
}
```

## Tool parameters

### `search_places`

| Parameter | Type | Description |
|-----------|------|-------------|
| `q` | string | Place name search term |
| `country` | string (optional) | ISO 3166-1 alpha-2 country code to restrict results (e.g. `"US"`) |
| `featureClass` | string (optional) | GeoNames feature class: `P` populated places, `A` admin divisions, `H` water bodies, `T` terrain |
| `maxRows` | integer [1, 100] (optional) | Maximum results to return (default 10) |

### `find_nearby`

| Parameter | Type | Description |
|-----------|------|-------------|
| `lat` | number | WGS84 latitude |
| `lng` | number | WGS84 longitude |
| `radius` | number [0, 300] (optional) | Search radius in km (default 10) |
| `maxRows` | integer [1, 100] (optional) | Maximum results to return (default 10) |
| `featureClass` | string (optional) | GeoNames feature class filter (e.g. `"P"`, `"A"`, `"H"`, `"T"`) |

## Example prompts

```
What cities are near latitude 48.8566, longitude 2.3522?
```

```
Find mountains within 50 km of Innsbruck (lat 47.27, lng 11.40).
```

```
Search for places named "Springfield" in the United States.
```

```
What administrative regions are near Tokyo (lat 35.68, lng 139.69)?
```
