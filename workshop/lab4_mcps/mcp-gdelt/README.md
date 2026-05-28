# mcp-gdelt

An MCP server that exposes the [GDELT DOC 2.0 API](https://blog.gdeltproject.org/gdelt-doc-2-0-api-debuts/) as tools. GDELT monitors news media worldwide in real time. No API key required — GDELT is a free public dataset.

> **Note:** GDELT's public API is a free shared resource and can experience high load, rate limiting (429), or timeouts — especially for broad queries. If requests fail, try narrowing the query (fewer records, shorter timespan, add `sourcelang:english` or `sourcecountry:` filters) or retry after a few seconds.

## Tools

| Tool | Description | Category |
|------|-------------|----------|
| `search_articles` | Search global news articles with GDELT boolean operators | Search |
| `get_timeline` | Get an article-volume or tone timeline for a query | Timeline |

## Running

```bash
pnpm dev        # watch mode
pnpm start      # production
```

The server listens on `http://localhost:3015/mcp` by default.

**Environment variables:**

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3015` | HTTP port |
| `ALLOWED_ORIGIN` | `http://localhost:3000` | CORS allowed origin |

## MCP client configuration

```json
{
  "mcpServers": {
    "gdelt": {
      "type": "http",
      "url": "http://localhost:3015/mcp"
    }
  }
}
```

## Example prompts

Use `themes` for event/disaster types and `countries` for geographic filtering.

```
Search for recent news articles about flooding in Southeast Asia.
→ themes: ["ENV_FLOOD"], countries: ["TH", "VM", "RP", "ID", "MY", "BM", "CB", "LA", "SN"]
```

```
Find earthquake news from Japan and the Philippines in the past 24 hours.
→ themes: ["ENV_EARTHQUAKE"], countries: ["JA", "RP"], timespan: "24h"
```

```
Show me the news volume timeline for wildfires in Australia over the last month.
→ themes: ["ENV_WILDFIRE"], countries: ["AS"], timespan: "1m"
```

```
Search for articles about climate policy negotiations in Europe.
→ themes: ["ENV_SEA_LEVEL_RISE", "ENV_DROUGHT"], countries: ["UK", "FR", "GM", "IT", "SP"]
```

```
Get the sentiment timeline for hurricane coverage in the past 7 days.
→ themes: ["ENV_HURRICANE"], mode: "TimelineTone", timespan: "7d"
```
