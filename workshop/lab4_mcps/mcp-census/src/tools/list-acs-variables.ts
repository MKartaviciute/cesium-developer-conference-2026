import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { buildAcsVariablesUrl, fetchCensusData } from "../census.js";

interface VariableEntry {
  label?: string;
  concept?: string;
  [key: string]: unknown;
}

interface VariablesResponse {
  variables: Record<string, VariableEntry>;
}

function cleanLabel(raw: string): string {
  return raw
    .replace(/^Estimate!!/, "")
    .replace(/^Margin of Error!!/, "MOE:")
    .replace(/!!/g, " > ");
}

export function registerListAcsVariablesTool(server: McpServer): void {
  server.registerTool(
    "list_acs_variables",
    {
      description:
        "List available ACS 5-year variables from the US Census Bureau, with optional search filtering. " +
        "Returns a compact response: labels are cleaned (no 'Estimate!!' prefix, '!!' replaced with ' > '), " +
        "and concepts are deduplicated into a separate 'concepts' map keyed by short IDs. " +
        "Use offset + limit to page through large result sets.",
      inputSchema: {
        year: z
          .number()
          .int()
          .optional()
          .default(2022)
          .describe("ACS 5-year estimate year (default 2022)"),
        search: z
          .string()
          .optional()
          .describe("Case-insensitive substring filter on variable concept or label"),
        limit: z
          .number()
          .int()
          .optional()
          .default(50)
          .describe("Maximum number of results to return per page (default 50)"),
        offset: z
          .number()
          .int()
          .optional()
          .default(0)
          .describe("Number of results to skip for pagination (default 0)"),
      },
    },
    async ({ year, search, limit, offset }) => {
      const y = year ?? 2022;
      const lim = limit ?? 50;
      const off = offset ?? 0;
      const url = buildAcsVariablesUrl(y);
      const raw = (await fetchCensusData(url)) as VariablesResponse;

      const entries = Object.entries(raw.variables ?? {}).map(([name, meta]) => ({
        name,
        label: cleanLabel(meta.label ?? ""),
        concept: meta.concept ?? "",
      }));

      const lower = search ? search.toLowerCase() : undefined;
      const filtered = lower
        ? entries.filter(
            (e) =>
              e.label.toLowerCase().includes(lower) ||
              e.concept.toLowerCase().includes(lower),
          )
        : entries;

      const page = filtered.slice(off, off + lim);

      // Deduplicate concepts into a map to avoid repeating long strings per variable
      const conceptMap: Record<string, string> = {};
      const conceptIndex: Record<string, string> = {};
      let conceptCounter = 0;
      for (const entry of page) {
        if (entry.concept && !(entry.concept in conceptIndex)) {
          const key = `C${conceptCounter++}`;
          conceptIndex[entry.concept] = key;
          conceptMap[key] = entry.concept;
        }
      }

      const variables = page.map(({ name, label, concept }) => ({
        name,
        label,
        concept: concept ? conceptIndex[concept] : undefined,
      }));

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              total: filtered.length,
              offset: off,
              limit: lim,
              concepts: conceptMap,
              variables,
            }),
          },
        ],
      };
    },
  );
}
