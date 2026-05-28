import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getSiteInfo } from "../waterdata.js";

export function registerGetSiteInfoTool(server: McpServer): void {
  server.registerTool(
    "get_site_info",
    {
      description: "Retrieve metadata for one or more USGS water monitoring sites.",
      inputSchema: {
        sites: z.string().describe("Comma-separated USGS site numbers (e.g. '01646500,01638500')"),
      },
    },
    async ({ sites }) => {
      try {
        const data = await getSiteInfo({ sites });
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
