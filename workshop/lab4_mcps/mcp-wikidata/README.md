# mcp-wikidata

MCP server for the [Wikidata](https://www.wikidata.org/) knowledge base. Exposes entity lookup by QID and arbitrary SPARQL queries to AI agents.

## Tools

### `get_entity`

Fetch one or more Wikidata entities by QID. Returns labels, descriptions, and aliases by default; pass `props` to include `claims` or `sitelinks`.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `ids` | string \| string[] | yes | One QID or an array of QIDs, e.g. `"Q42"` or `["Q42", "Q64"]` |
| `languages` | string[] | no | Language codes to include (default `["en"]`) |
| `props` | string[] | no | Fields to return. Options: `labels`, `descriptions`, `aliases`, `claims`, `sitelinks` (default `["labels","descriptions","aliases"]`). Add `claims` or `sitelinks` only when needed — they are large. |

**Example**
```json
{ "ids": ["Q42", "Q64"], "languages": ["en", "de"], "props": ["labels", "descriptions"] }
```

---

### `sparql_query`

Execute a SPARQL SELECT query against the [Wikidata Query Service](https://query.wikidata.org/). If the query has no LIMIT clause, one is appended automatically using the `limit` parameter.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `query` | string | yes | Complete SPARQL SELECT query |
| `limit` | number | no | Max results per page (default 100, max 1000). Appended automatically if query has no LIMIT clause. |
| `offset` | number | no | Number of results to skip for pagination (default 0). Appended automatically if query has no OFFSET clause. |

The response includes `count`, `hasMore`, and `offset` fields for pagination.

**Example**
```json
{
  "query": "SELECT ?city ?cityLabel WHERE { ?city wdt:P31 wd:Q515 . SERVICE wikibase:label { bd:serviceParam wikibase:language 'en' } }",
  "limit": 10,
  "offset": 0
}
```

## Prompt examples

```
What is Wikidata entity Q64?
```
```
Look up Douglas Adams (Q42) on Wikidata and return his description in English and German.
```
```
Use SPARQL to find all countries that are members of the European Union.
```
```
Query Wikidata for the 10 tallest mountains and their heights.
```
```
Find all Wikidata entities that are instances of "river" located in Lithuania.
```

## Running

```bash
npm install
npm run build
node dist/index.js           # listens on port 3012 by default
PORT=4012 node dist/index.js   # custom port
```

## API

```
POST /mcp
```

Rate limit: 60 requests per minute per IP.

No authentication is required — both the [Wikidata REST API](https://www.wikidata.org/wiki/Wikidata:REST_API) and the [SPARQL endpoint](https://query.wikidata.org/) are public.
