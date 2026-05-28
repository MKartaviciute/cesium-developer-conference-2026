import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { fetchCategories } from "../eonet.js";

export function registerListEventCategoriesTool(server: McpServer): void {
  server.registerTool(
    "list_event_categories",
    {
      description:
        "Fetch the list of available natural event categories from the NASA EONET v3 API. Returns a JSON array of category objects with id, title, and description.",
      inputSchema: {},
    },
    async () => {
      const data = await fetchCategories();
      return {
        content: [{ type: "text", text: JSON.stringify(data.categories) }],
      };
    },
  );
}
