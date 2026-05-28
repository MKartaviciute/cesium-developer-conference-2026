import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getSiteStats } from "../waterdata.js";

export function registerGetSiteStatsTool(server: McpServer): void {
  server.registerTool(
    "get_site_stats",
    {
      description:
        "Retrieve historical streamflow statistics (mean, median, and percentiles) for a USGS monitoring site on a given day of year. Use this to determine whether current flow is above or below normal.",
      inputSchema: {
        site: z.string().describe("USGS site number (e.g. '01646500')"),
        date: z
          .string()
          .regex(/^\d{4}-\d{2}-\d{2}$/)
          .optional()
          .describe(
            "Date in YYYY-MM-DD format to look up statistics for that day of year. Defaults to today.",
          ),
      },
    },
    async ({ site, date }) => {
      try {
        const data = await getSiteStats({ site, date });
        return { content: [{ type: "text", text: JSON.stringify(data) }] };
      } catch (err) {
        return {
          content: [{ type: "text", text: err instanceof Error ? err.message : String(err) }],
          isError: true,
        };
      }
    },
  );
}
