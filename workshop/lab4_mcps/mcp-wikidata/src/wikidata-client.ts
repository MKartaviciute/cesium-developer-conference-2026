const USER_AGENT = "@cesium-ai/mcp-wikidata/1.0";
const SPARQL_ENDPOINT = "https://query.wikidata.org/sparql";
const REST_BASE = "https://www.wikidata.org/w/api.php";

export async function sparqlQuery(query: string): Promise<unknown> {
  const url = new URL(SPARQL_ENDPOINT);
  url.searchParams.set("query", query);
  url.searchParams.set("format", "json");

  const res = await fetch(url.toString(), {
    headers: {
      "Accept": "application/sparql-results+json",
      "User-Agent": USER_AGENT,
    },
  });
  if (!res.ok) {
    throw new Error(`Wikidata SPARQL error ${res.status}: ${await res.text()}`);
  }
  return res.json();
}

export async function getEntities(ids: string[], languages: string[], props: string[]): Promise<unknown> {
  const url = new URL(REST_BASE);
  url.searchParams.set("action", "wbgetentities");
  url.searchParams.set("ids", ids.join("|"));
  url.searchParams.set("languages", languages.join("|"));
  url.searchParams.set("props", props.join("|"));
  url.searchParams.set("format", "json");

  const res = await fetch(url.toString(), { headers: { "User-Agent": USER_AGENT } });
  if (!res.ok) {
    throw new Error(`Wikidata REST API error ${res.status}: ${await res.text()}`);
  }
  return res.json();
}
