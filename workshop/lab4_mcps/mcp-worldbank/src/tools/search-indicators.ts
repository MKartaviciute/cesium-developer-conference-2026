import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { worldBankGet } from "../worldbank-client.js";

export function registerSearchIndicatorsTool(server: McpServer): void {
  server.registerTool(
    "search_indicators",
    {
      description: "Search available World Bank indicator codes by keyword",
      inputSchema: {
        q: z.string().describe("Keyword search term"),
        limit: z.number().int().min(1).max(200).optional().describe("Number of results (default 50, max 200)"),
      },
    },
    async ({ q, limit }) => {
      const params: Record<string, string> = {
        source: "2",
        q,
        per_page: String(limit ?? 50),
      };

      const data = await worldBankGet("/indicator", params) as [unknown, unknown[]];
      // World Bank returns [metadata, data] — skip metadata at index 0
      const indicators = Array.isArray(data) && data.length > 1 ? data[1] : data;
      return {
        content: [{ type: "text" as const, text: JSON.stringify(indicators) }],
      };
    },
  );
}
