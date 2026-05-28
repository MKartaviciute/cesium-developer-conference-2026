import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getStreamflow } from "../waterdata.js";

export function registerGetStreamflowTool(server: McpServer): void {
  server.registerTool(
    "get_streamflow",
    {
      description: "Retrieve instantaneous streamflow values for one or more USGS monitoring sites.",
      inputSchema: {
        sites: z.string().describe("Comma-separated USGS site numbers (e.g. '01646500,01638500')"),
        period: z.string().optional().describe("ISO 8601 duration string for how far back to retrieve data (e.g. 'P1D' for last 24 h). Default: P1D. Ignored if start_date is set."),
        start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().describe("Start date in YYYY-MM-DD format. Use instead of period."),
        end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().describe("End date in YYYY-MM-DD format. Defaults to today if start_date is set."),
        offset: z.coerce.number().int().min(0).optional().describe("Number of readings to skip for pagination. Default: 0."),
        limit: z.coerce.number().int().min(1).max(500).optional().describe("Maximum number of readings to return per site. Default: 200. Use with offset and hasMore to paginate large responses."),
      },
    },
    async ({ sites, period, start_date, end_date, offset, limit }) => {
      try {
        const data = await getStreamflow({ sites, period, startDate: start_date, endDate: end_date, offset, limit });
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
