import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerGetActiveFiresTool } from "./get-active-fires.js";
import { registerGetTransactionStatusTool } from "./get-transaction-status.js";

export function registerFirmsTools(server: McpServer): void {
  registerGetActiveFiresTool(server);
  registerGetTransactionStatusTool(server);
}
