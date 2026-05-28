import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

const LAYERS = [
  { service: "tigerWMS_Current", layer_id: 80, name: "States" },
  { service: "tigerWMS_Current", layer_id: 82, name: "Counties" },
  { service: "tigerWMS_Current", layer_id: 8, name: "Census Tracts" },
  { service: "tigerWMS_Current", layer_id: 10, name: "Block Groups" },
  { service: "tigerWMS_Current", layer_id: 54, name: "Congressional Districts" },
  { service: "tigerWMS_Current", layer_id: 88, name: "Urban Areas" },
  { service: "tigerWMS_Current", layer_id: 2, name: "ZIP Code Tabulation Areas (ZCTAs)" },
  { service: "tigerWMS_ACS2023", layer_id: 80, name: "States (ACS 2023)" },
  { service: "tigerWMS_ACS2023", layer_id: 82, name: "Counties (ACS 2023)" },
  { service: "tigerWMS_Census2020", layer_id: 80, name: "States (Census 2020)" },
  { service: "tigerWMS_Census2020", layer_id: 82, name: "Counties (Census 2020)" },
  { service: "tigerWMS_Census2020", layer_id: 6, name: "Census Tracts (Census 2020)" },
];

export function registerListLayersTool(server: McpServer): void {
  server.registerTool(
    "list_layers",
    {
      description: "Return a reference list of the most useful TIGERweb layer IDs and names",
      inputSchema: {},
    },
    async () => {
      return {
        content: [{ type: "text", text: JSON.stringify(LAYERS) }],
      };
    },
  );
}
