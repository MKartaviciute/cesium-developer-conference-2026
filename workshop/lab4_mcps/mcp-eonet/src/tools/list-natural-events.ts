import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { fetchEvents } from "../eonet.js";

export function registerListNaturalEventsTool(server: McpServer): void {
  server.registerTool(
    "list_natural_events",
    {
      description:
        "Fetch open or closed natural events from the NASA EONET v3 API. Returns a JSON array of events with geometry, categories, and source links.",
      inputSchema: {
        status: z
          .enum(["open", "closed", "all"])
          .default("open")
          .describe('Filter by event status: "open", "closed", or "all". Defaults to "open".'),
        category: z
          .string()
          .optional()
          .describe(
            'Optional category filter, e.g. "wildfires", "severeStorms", "volcanoes". Use list_event_categories to see all available IDs.',
          ),
        days: z
          .number()
          .int()
          .positive()
          .optional()
          .describe("Limit results to events updated in the last N days."),
        limit: z
          .number()
          .int()
          .min(1)
          .max(500)
          .default(50)
          .describe("Maximum number of events to return. Defaults to 50, maximum 500."),
      },
    },
    async ({ status, category, days, limit }) => {
      const data = await fetchEvents({ status, category, days, limit });
      const slim = data.events.map((e) => ({
        id: e.id,
        title: e.title,
        geometry: e.geometry.map((g) => ({
          date: g.date,
          coordinates: g.coordinates,
          ...(g.magnitudeValue != null && { magnitude: g.magnitudeValue, magnitudeUnit: g.magnitudeUnit }),
        })),
      }));
      return {
        content: [{ type: "text", text: JSON.stringify(slim) }],
      };
    },
  );
}
