import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { gbifGet } from "../gbif-client.js";

export function registerGetSpeciesTool(server: McpServer): void {
  server.registerTool(
    "get_species",
    {
      description: "Look up taxa by scientific or common name using GBIF species search",
      inputSchema: {
        q: z.string().describe("Scientific or common name search term"),
        limit: z.number().int().min(1).max(100).optional().describe("Number of results (default 10, max 100)"),
      },
    },
    async ({ q, limit }) => {
      const params: Record<string, string> = {
        q,
        limit: String(limit ?? 10),
      };

      const data = await gbifGet("/species/search", params) as { results: unknown[] };
      return {
        content: [{ type: "text" as const, text: JSON.stringify(data.results) }],
      };
    },
  );
}
