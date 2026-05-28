# mcp-worldbank

MCP server for the [World Bank Open Data API](https://datahelpdesk.worldbank.org/knowledgebase/articles/889392-about-the-indicators-api-documentation). Exposes indicator time-series retrieval and indicator search to AI agents.

## Tools

### `get_indicator_data`

Fetch time-series observations for a World Bank indicator.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `indicator` | string | yes | Indicator code, e.g. `SP.POP.TOTL`, `NY.GDP.MKTP.CD` |
| `country` | string | no | ISO2 country code or `all` for all countries (default `all`) |
| `date` | string | no | Single year `YYYY` or range `YYYY:YYYY` (default: last 10 years) |
| `per_page` | number | no | Results per page (default 100, max 100) |
| `page` | number | no | Page number, 1-based (default 1). Check `pagination.hasMore` to determine if more pages exist. |

The response includes a `pagination` object with `{ page, pages, per_page, total, hasMore }` so callers know how many pages remain.

**Example**
```json
{ "indicator": "SP.POP.TOTL", "country": "all", "page": 2 }
```

**Common indicator codes**

| Code | Description |
|------|-------------|
| `SP.POP.TOTL` | Total population |
| `NY.GDP.MKTP.CD` | GDP (current US$) |
| `SP.DYN.LE00.IN` | Life expectancy at birth |
| `SL.UEM.TOTL.ZS` | Unemployment rate |
| `EN.ATM.CO2E.PC` | CO₂ emissions per capita |

---

### `search_indicators`

Search available World Bank indicator codes by keyword. Results are drawn from the World Development Indicators (source 2).

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `q` | string | yes | Keyword search term |
| `limit` | number | no | Number of results to return (default 50, max 200) |

**Example**
```json
{ "q": "inflation", "limit": 10 }
```

## Prompt examples

```
What was Germany's GDP from 2010 to 2023?
```
```
Show me total population data for all countries over the last 10 years.
```
```
Find World Bank indicators related to climate change.
```
```
What is the unemployment rate trend in Brazil since 2000?
```
```
Search for World Bank indicators about renewable energy.
```

## Running

```bash
npm install
npm run build
node dist/index.js           # listens on port 3011 by default
PORT=4011 node dist/index.js   # custom port
```

## API

```
POST /mcp
```

Rate limit: 60 requests per minute per IP.

No authentication is required — the [World Bank API](https://datahelpdesk.worldbank.org/knowledgebase/articles/889392-about-the-indicators-api-documentation) is public.
