import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { getDb, isReady } from "../db.js";

export function registerListLayersTool(server: McpServer): void {
  server.registerTool(
    "list_layers",
    {
      description:
        "List all vector layer names available in the Natural Earth GeoPackage",
      inputSchema: {},
    },
    async () => {
      if (!isReady()) {
        return {
          content: [
            {
              type: "text",
              text: "data initialising — retry in a moment",
            },
          ],
        };
      }
      const db = getDb()!;
      const rows = db
        .prepare(
          "SELECT table_name, data_type FROM gpkg_contents ORDER BY table_name",
        )
        .all();
      return {
        content: [{ type: "text", text: JSON.stringify(rows) }],
      };
    },
  );
}
