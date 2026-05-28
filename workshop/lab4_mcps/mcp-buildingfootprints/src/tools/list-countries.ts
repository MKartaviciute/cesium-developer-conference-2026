import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ensureCsvLoaded } from "../db.js";

export function registerListCountriesTool(server: McpServer): void {
  server.registerTool(
    "list_countries",
    {
      description:
        "List all countries/regions available in the Microsoft Global ML Building Footprints dataset. Downloads the index CSV on first call.",
      inputSchema: {},
    },
    async () => {
      try {
        const rows = await ensureCsvLoaded();
        const locations = [...new Set(rows.map((r) => r.Location))].sort();
        return {
          content: [{ type: "text", text: JSON.stringify(locations) }],
        };
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        return {
          content: [{ type: "text", text: `Error loading country list: ${msg}` }],
          isError: true,
        };
      }
    },
  );
}
