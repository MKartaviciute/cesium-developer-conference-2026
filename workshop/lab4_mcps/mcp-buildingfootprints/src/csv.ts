// Minimal CSV parser that handles quoted fields.
// Used for parsing the dataset-links.csv from Microsoft Building Footprints.

export interface CsvRow {
  Location: string;
  QuadKey: string;
  Url: string;
  Size: string;
}

/**
 * Parse CSV text into typed rows.
 * Handles double-quoted fields with embedded commas.
 */
export function parseCsv(text: string): CsvRow[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) return [];

  // Parse a single CSV line respecting double-quoted fields
  function parseLine(line: string): string[] {
    const fields: string[] = [];
    let i = 0;
    while (i < line.length) {
      if (line[i] === '"') {
        // Quoted field
        let val = "";
        i++; // skip opening quote
        while (i < line.length) {
          if (line[i] === '"' && line[i + 1] === '"') {
            val += '"';
            i += 2;
          } else if (line[i] === '"') {
            i++; // skip closing quote
            break;
          } else {
            val += line[i++];
          }
        }
        fields.push(val);
        if (line[i] === ",") i++; // skip comma after quoted field
      } else {
        // Unquoted field — read until comma or end
        const start = i;
        while (i < line.length && line[i] !== ",") i++;
        fields.push(line.slice(start, i));
        if (line[i] === ",") i++; // skip comma
      }
    }
    return fields;
  }

  const header = parseLine(lines[0]);
  const locIdx = header.indexOf("Location");
  const qkIdx = header.indexOf("QuadKey");
  const urlIdx = header.indexOf("Url");
  const sizeIdx = header.indexOf("Size");

  const rows: CsvRow[] = [];
  for (let r = 1; r < lines.length; r++) {
    const fields = parseLine(lines[r]);
    rows.push({
      Location: fields[locIdx] ?? "",
      QuadKey: fields[qkIdx] ?? "",
      Url: fields[urlIdx] ?? "",
      Size: fields[sizeIdx] ?? "",
    });
  }
  return rows;
}
