import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getDataset } from "../hdx.js";

export function registerGetDatasetTool(server: McpServer): void {
  server.registerTool(
    "get_dataset",
    {
      description: "Retrieve full metadata for a specific HDX dataset including its resource list",
      inputSchema: {
        id: z.string().describe("Dataset name slug or UUID (e.g. \"syria-humanitarian-situation-report\")"),
      },
    },
    async ({ id }) => {
      const result = await getDataset(id);
      return {
        content: [{ type: "text", text: JSON.stringify(result) }],
      };
    },
  );
}
