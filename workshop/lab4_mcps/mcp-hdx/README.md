# mcp-hdx

MCP server for the [Humanitarian Data Exchange (HDX)](https://data.humdata.org/) API. Exposes humanitarian dataset search and metadata retrieval to AI agents.

## Tools

### `search_datasets`

Search humanitarian datasets on HDX by keyword and optional filters.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `q` | string | yes | Keyword search term |
| `fq` | string | no | SOLR filter query (e.g. `groups:"syr"` for Syria) |
| `rows` | number | no | Number of results to return (default 10, max 100) |
| `start` | number | no | Pagination offset (default 0) |

**Example**
```json
{ "q": "food security", "fq": "groups:\"syr\"", "rows": 10, "start": 0 }
```

---

### `get_dataset`

Retrieve full metadata for a specific HDX dataset including its resource list.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | yes | Dataset name slug or UUID (e.g. `"syria-humanitarian-situation-report"`) |

**Example**
```json
{ "id": "syria-humanitarian-situation-report" }
```

## Usage patterns

### 1. Discover datasets

Use `search_datasets` to explore what's available. Filter by country using the SOLR `groups` field (ISO3 country code):

```
Search HDX for food security datasets in Syria.
Search HDX for COVID-19 datasets filtered to Afghanistan.
Find the most recent displacement data available on HDX.
Find humanitarian datasets about flooding in Bangladesh on HDX.
```

Country filter syntax: `fq: 'groups:"afg"'` (Afghanistan), `fq: 'groups:"syr"'` (Syria), etc.  
Pagination: use `start=50` to fetch the next page when results exceed `rows`.

### 2. Fetch dataset details

Once you have a dataset name slug or UUID from `search_datasets`, call `get_dataset` to retrieve full metadata including the list of downloadable resources (CSV, GeoJSON, Shapefile, XLSX, etc.) with their direct download URLs:

```
Get the full metadata for HDX dataset "afghanistan-covid-19-health-facilities-by-province".
Get the full metadata for HDX dataset "wfp-food-security-indicators-for-yemen".
```

The response includes a `resources` array with `url`, `format`, and `name` for each file attached to the dataset.

### 3. Using HDX data with Cesium

HDX datasets often contain geospatial data (GeoJSON, Shapefile, CSV with coordinates) that can be visualised on a Cesium globe. The workflow is:

1. **Search** — `search_datasets` to find a relevant dataset
2. **Inspect** — `get_dataset` to retrieve resource download URLs and formats
3. **Load into Cesium** — additional tools are required to actually fetch and render the data:
   - A **file-fetch / HTTP tool** to download the resource file from its URL
   - A **Cesium data-source tool** to load GeoJSON or CSV into the viewer (e.g. `GeoJsonDataSource`, `CzmlDataSource`, or a custom entity builder)
   - Optionally a **coordinate extraction tool** to parse CSVs with lat/lon columns into Cesium `Entity` objects

Without those additional tools, `mcp-hdx` can only surface metadata and resource URLs — the actual file download and globe visualisation step sits outside its scope.

## Prompt examples

```
Search HDX for food security datasets in Syria.
```
```
Find humanitarian datasets about flooding in Bangladesh on HDX.
```
```
Get the full metadata for HDX dataset "wfp-food-security-indicators-for-yemen".
```
```
Search HDX for COVID-19 datasets filtered to Afghanistan.
```
```
Find the most recent displacement data available on HDX.
```

## Running

```bash
npm install
npm run dev     # tsx watch, port 3023
npm start       # production, port 3023
```

## API

```
POST /mcp
```

Rate limit: 60 requests per minute per IP.

No authentication is required — the [HDX CKAN API](https://data.humdata.org/api/3) is public.
