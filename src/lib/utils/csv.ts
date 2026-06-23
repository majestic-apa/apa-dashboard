/**
 * Minimal RFC-4180-compatible CSV parser.
 * Handles double-quoted fields (including quoted commas and escaped double-quotes "").
 * Used server-side only to parse mock data CSV files.
 */

function parseRow(line: string): string[] {
  const fields: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        // Escaped quote inside a quoted field
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === ',' && !inQuotes) {
      fields.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  fields.push(current.trim());
  return fields;
}

export function parseCSV(csvText: string): Record<string, string>[] {
  const lines = csvText
    .split('\n')
    .map((l) => l.replace(/\r$/, '')) // strip Windows CR
    .filter((l) => l.trim().length > 0);

  if (lines.length < 2) return [];

  const headers = parseRow(lines[0]);

  return lines.slice(1).map((line) => {
    const values = parseRow(line);
    const row: Record<string, string> = {};
    headers.forEach((h, i) => {
      row[h] = values[i] ?? '';
    });
    return row;
  });
}
