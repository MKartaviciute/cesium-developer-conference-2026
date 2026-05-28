import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { fetchMeasurements } from "../openaq.js";

export function registerGetMeasurementsTool(server: McpServer): void {
  server.registerTool(
    "get_measurements",
    {
      description:
        "Get latest measurements for a specific OpenAQ monitoring location.",
      inputSchema: {
        locations_id: z
          .number()
          .int()
          .describe("OpenAQ numeric location ID"),
        limit: z
          .number()
          .int()
          .min(1)
          .max(1000)
          .default(100)
          .optional()
          .describe("Results per page (max 1000)"),
        page: z
          .number()
          .int()
          .min(1)
          .default(1)
          .optional()
          .describe("Page number — use meta.totalPages from the response to know how many pages exist"),
      },
    },
    async ({ locations_id, limit, page }) => {
      try {
        const data = await fetchMeasurements(locations_id, limit, page);
        return {
          content: [{ type: "text", text: JSON.stringify(data) }],
        };
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        return {
          content: [{ type: "text", text: `Error fetching measurements: ${message}` }],
        };
      }
    },
  );
}
