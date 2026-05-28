import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { listDatasets } from "../tnm.js";

export function registerListDatasetsTool(server: McpServer): void {
  server.registerTool(
    "list_datasets",
    {
      description:
        "List all available USGS TNM dataset types. Returns sbDatasetTag (use this in search_products), title, category, refreshCycle, and sub-tags where applicable.",
      inputSchema: {},
    },
    async () => {
      try {
        const datasets = await listDatasets();
        return {
          content: [{ type: "text", text: JSON.stringify(datasets) }],
        };
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        return {
          content: [{ type: "text", text: `Error listing TNM datasets: ${message}` }],
        };
      }
    },
  );
}
