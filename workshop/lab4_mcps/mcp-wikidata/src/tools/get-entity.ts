import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getEntities } from "../wikidata-client.js";

const ALLOWED_PROPS = ["labels", "descriptions", "aliases", "claims", "sitelinks"] as const;
type Prop = typeof ALLOWED_PROPS[number];

interface SlimEntity {
  id: string;
  label?: string;
  description?: string;
  aliases?: string[];
  claims?: unknown;
  sitelinks?: unknown;
}

function slim(id: string, raw: Record<string, unknown>, props: Prop[], lang: string): SlimEntity {
  const out: SlimEntity = { id };
  if (props.includes("labels")) {
    const labels = raw.labels as Record<string, { value: string }> | undefined;
    out.label = labels?.[lang]?.value;
  }
  if (props.includes("descriptions")) {
    const descriptions = raw.descriptions as Record<string, { value: string }> | undefined;
    out.description = descriptions?.[lang]?.value;
  }
  if (props.includes("aliases")) {
    const aliases = raw.aliases as Record<string, Array<{ value: string }>> | undefined;
    out.aliases = aliases?.[lang]?.map((a) => a.value);
  }
  if (props.includes("claims")) out.claims = raw.claims;
  if (props.includes("sitelinks")) out.sitelinks = raw.sitelinks;
  return out;
}

export function registerGetEntityTool(server: McpServer): void {
  server.registerTool(
    "get_entity",
    {
      description: "Fetch one or more Wikidata entities by QID. Returns slim labels/descriptions/aliases by default; pass props to include claims or sitelinks.",
      inputSchema: {
        ids: z.union([z.string(), z.array(z.string())]).describe("One QID or an array of QIDs (e.g. 'Q64' or ['Q64','Q42'])"),
        languages: z.array(z.string()).optional().describe("Language codes (default ['en'])"),
        props: z
          .array(z.enum(ALLOWED_PROPS))
          .optional()
          .describe("Fields to return (default ['labels','descriptions','aliases']). Add 'claims' or 'sitelinks' only when needed — they are large."),
      },
    },
    async ({ ids, languages, props }) => {
      const idList = Array.isArray(ids) ? ids : [ids];
      const langs = languages && languages.length > 0 ? languages : ["en"];
      const effectiveProps: Prop[] = props && props.length > 0 ? props : ["labels", "descriptions", "aliases"];
      const lang = langs[0];

      const data = await getEntities(idList, langs, effectiveProps) as { entities: Record<string, Record<string, unknown>> };
      const results = idList.map((id) => slim(id, data.entities[id] ?? {}, effectiveProps, lang));

      return {
        content: [{ type: "text" as const, text: JSON.stringify(results.length === 1 ? results[0] : results) }],
      };
    },
  );
}
