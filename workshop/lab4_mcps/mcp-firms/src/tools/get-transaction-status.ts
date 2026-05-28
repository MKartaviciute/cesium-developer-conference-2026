import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { fetchTransactionStatus, getMapKey } from "../firms.js";

export function registerGetTransactionStatusTool(server: McpServer): void {
  server.registerTool(
    "get_transaction_status",
    {
      description:
        "Check API quota/transaction status for the configured NASA FIRMS MAP key.",
      inputSchema: {},
    },
    async () => {
      const mapKey = getMapKey();
      if (!mapKey) {
        return {
          content: [
            {
              type: "text",
              text: "Error: FIRMS_MAP_KEY environment variable is not set. Please configure your NASA FIRMS MAP key.",
            },
          ],
        };
      }
      try {
        const status = await fetchTransactionStatus(mapKey);
        return {
          content: [{ type: "text", text: JSON.stringify(status) }],
        };
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        return {
          content: [{ type: "text", text: `Error fetching transaction status: ${message}` }],
        };
      }
    },
  );
}
