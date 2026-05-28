import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerListLayersTool } from "./list-layers.js";
import { registerQueryCountriesTool } from "./query-countries.js";
import { registerQueryFeaturesTool } from "./query-features.js";

export function registerNaturalEarthTools(server: McpServer): void {
  registerListLayersTool(server);
  registerQueryCountriesTool(server);
  registerQueryFeaturesTool(server);
}
