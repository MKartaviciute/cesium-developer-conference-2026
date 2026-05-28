import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerListCollectionsTool } from "./list-collections.js";
import { registerQueryAddressesByBboxTool } from "./query-addresses-by-bbox.js";
import { registerGeocodeAddressTool } from "./geocode-address.js";

export function registerOpenAddressesTools(server: McpServer): void {
  registerListCollectionsTool(server);
  registerQueryAddressesByBboxTool(server);
  registerGeocodeAddressTool(server);
}
