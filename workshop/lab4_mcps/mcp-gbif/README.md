# mcp-gbif

MCP server for the [GBIF (Global Biodiversity Information Facility)](https://www.gbif.org/) API. Exposes species taxonomy lookup and occurrence record search to AI agents.

## Tools

### `get_species`

Look up taxa by scientific or common name using the GBIF species search.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `q` | string | yes | Scientific or common name search term |
| `limit` | number | no | Number of results (default 10, max 100) |

**Example**
```json
{ "q": "Quercus robur", "limit": 10 }
```

---

### `search_occurrences`

Search biodiversity occurrence records from GBIF. Supports spatial, temporal, and taxonomic filters. Results are paginated.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `scientificName` | string | no | Scientific name, e.g. `Quercus robur` |
| `country` | string | no | ISO 3166-1 alpha-2 country code, e.g. `US` |
| `geometry` | string | no | WKT polygon or bounding box `minLng,minLat,maxLng,maxLat` |
| `year` | string | no | Single year `YYYY` or range `YYYY,YYYY` |
| `limit` | number | no | Number of results (default 20, max 300) |

**Example**
```json
{ "scientificName": "Panthera leo", "country": "KE", "year": "2015,2023", "limit": 50 }
```

## Prompt examples

```
What species of oak trees are recorded in the GBIF database?
```
```
Find all lion sightings in Kenya between 2015 and 2023.
```
```
Search for occurrences of Panthera tigris in India in the last 5 years.
```
```
Look up the taxonomy for "common chimpanzee" and show me the first 3 results.
```
```
Are there any GBIF occurrence records for wolves in Poland?
```

## Running

```bash
npm install
npm run build
node dist/index.js          # listens on port 3010 by default
PORT=4010 node dist/index.js  # custom port
```

## API

The server exposes a single HTTP endpoint following the MCP stateless transport pattern:

```
POST /mcp
```

Rate limit: 60 requests per minute per IP.

No authentication is required — the underlying [GBIF API](https://www.gbif.org/developer/summary) is public.
