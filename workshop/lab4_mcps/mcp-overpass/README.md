# mcp-overpass

An MCP server that exposes the [Overpass API](https://overpass-api.de/) as a tool, enabling queries against [OpenStreetMap](https://www.openstreetmap.org/) data. No API key required — Overpass API is a free public service.

> **Note:** This server uses the public [Overpass API](https://overpass-api.de/) (`overpass-api.de`). No API key is required, but the service is a shared public resource — avoid rapid or large queries. Each request includes a `User-Agent: cesium-ai-mcp-overpass/0.1.0` header as required by the API's usage policy. During high-load periods the API may return HTTP 429 or 503; if queries fail, wait a minute and retry.

## Tools

| Tool | Description | Category |
|------|-------------|----------|
| `query_osm_features` | Execute an Overpass QL query and return OSM elements (nodes/ways/relations) as JSON | Query |

## Running

```bash
pnpm dev        # watch mode
pnpm start      # production
```

The server listens on `http://localhost:3013/mcp` by default.

**Environment variables:**

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3013` | HTTP port |
| `ALLOWED_ORIGIN` | `http://localhost:3000` | CORS allowed origin |

## MCP client configuration

```json
{
  "mcpServers": {
    "overpass": {
      "type": "http",
      "url": "http://localhost:3013/mcp"
    }
  }
}
```

## Example prompts

```
Find all hospitals within 5 km of downtown Chicago.
```

```
List parks and green spaces in Berlin.
```

```
Show me all fire stations in San Francisco.
```

```
Find restaurants tagged as "pizza" near Times Square, New York.
```

```
Query all bus stops within a bounding box around London.
```
