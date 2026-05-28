import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { listCollections } from "../planetarycomputer.js";

export function registerListCollectionsTool(server: McpServer): void {
  server.registerTool(
    "list_collections",
    {
      description: "List all available data collections in Microsoft Planetary Computer STAC API",
      inputSchema: {},
    },
    async () => {
      try {
        const collections = await listCollections();
        return { content: [{ type: "text", text: JSON.stringify(collections) }] };
      } catch (err) {
        return { content: [{ type: "text", text: `Error: ${err instanceof Error ? err.message : String(err)}` }] };
      }
    },
  );
}
