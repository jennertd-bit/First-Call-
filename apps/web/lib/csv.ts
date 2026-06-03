/**
 * Minimal RFC-4180 CSV parser. Handles quoted fields, embedded commas /
 * newlines, and "" escaped quotes. Returns rows of string cells; trailing
 * blank line is ignored.
 */
export function parseCsv(input: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  // Normalize CRLF/CR to LF so newline handling is uniform.
  const s = input.replace(/\r\n?/g, "\n");

  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (inQuotes) {
      if (ch === '"') {
        if (s[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
      continue;
    }
    if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      row.push(field);
      field = "";
    } else if (ch === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += ch;
    }
  }
  // Flush trailing field/row if the file didn't end with a newline.
  if (field !== "" || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

/** Parse a money string ("$1,234.50", "1234.5", "12") to integer cents. */
export function parseMoneyToCents(raw: string): number | null {
  const cleaned = raw.replace(/[$,\s]/g, "");
  if (cleaned === "" || !/^-?\d*\.?\d+$/.test(cleaned)) return null;
  const dollars = Number(cleaned);
  if (!Number.isFinite(dollars)) return null;
  return Math.round(dollars * 100);
}
