# mcp-eonet

An MCP server that exposes the [NASA Earth Observatory Natural Event Tracker (EONET) v3 API](https://eonet.gsfc.nasa.gov/docs/v3) as tools. No API key required.

## Tools

| Tool | Description | Category |
|------|-------------|----------|
| `list_natural_events` | List natural events with filters for status, category, and recency | Events |
| `list_event_categories` | List all available event category IDs and descriptions | Metadata |

Event types include wildfires, volcanoes, severe storms, sea and lake ice, floods, and more. Each event includes geometry (coordinates + optional magnitude) and source citations.

## Running

```bash
pnpm dev        # watch mode
pnpm start      # production
```

The server listens on `http://localhost:3008/mcp` by default.

**Environment variables:**

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3008` | HTTP port |
| `ALLOWED_ORIGIN` | `http://localhost:3000` | CORS allowed origin |

## MCP client configuration

```json
{
  "mcpServers": {
    "eonet": {
      "type": "http",
      "url": "http://localhost:3008/mcp"
    }
  }
}
```

## Tool parameters

### `list_natural_events`

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `status` | `"open"` \| `"closed"` \| `"all"` | `"open"` | Filter by event status |
| `category` | string | — | Category ID, e.g. `wildfires`, `severeStorms`, `volcanoes`. Use `list_event_categories` for all IDs |
| `days` | integer > 0 | — | Limit to events updated in the last N days |
| `limit` | integer [1, 500] | `50` | Maximum number of events to return |

### `list_event_categories`

No parameters. Returns an array of category objects with `id`, `title`, and `description`.

## Example prompts

```
What wildfires are currently active according to NASA EONET?
```

```
Show me all active volcanoes being tracked right now.
```

```
Are there any severe storms in the past 7 days?
```

```
What natural event categories does EONET track?
```

```
Give me the 20 most recent natural events of any type.
```

```
List all closed (resolved) flood events from the past 30 days.
```
