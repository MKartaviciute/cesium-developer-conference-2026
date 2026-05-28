import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { listDatasets } from "../ncei.js";

export function registerListDatasetsTool(server: McpServer): void {
  server.registerTool(
    "list_datasets",
    {
      description: "List available NCEI dataset identifiers",
      inputSchema: {},
    },
    async () => {
      try {
        const data = await listDatasets();
        return { content: [{ type: "text", text: JSON.stringify(data) }] };
      } catch (err) {
        return { content: [{ type: "text", text: `Error: ${err instanceof Error ? err.message : String(err)}` }] };
      }
    },
  );
}
