import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { fetchCollections } from "../collections.js";

export function registerListCollectionsTool(server: McpServer): void {
  server.registerTool(
    "list_collections",
    {
      description:
        "List available OpenAddresses address collections. Fetches the collection index once " +
        "and caches it locally. Returns an array of { id, name } objects.",
      inputSchema: {},
    },
    async () => {
      try {
        const collections = await fetchCollections(process.env.OA_TOKEN);
        const result = collections.map((c) => ({ id: c.id, name: c.name }));
        return { content: [{ type: "text", text: JSON.stringify(result) }] };
      } catch (err) {
        return { content: [{ type: "text", text: JSON.stringify({ error: String(err) }) }] };
      }
    }
  );
}
