import "./load-env";
import { readFileSync } from "node:fs";
import { and, eq, sql } from "drizzle-orm";
import { db } from "./client";
import { priceListItems, tenants } from "./schema";

/**
 * One-time bulk loader for an Xactimate (XA) price-list export. Mirrors the
 * CRM importer's parse/dedupe/upsert semantics but runs against the local DB
 * with an explicitly resolved tenant (admin seeding, not a client request).
 *
 *   pnpm --filter @firstcall/db exec tsx src/import-xa.ts "<path-to.csv>" ["Tenant Name"]
 */

type Field = "code" | "description" | "category" | "unit" | "price";

const HEADER_ALIASES: Record<string, Field> = {
  code: "code",
  "full code": "code",
  sku: "code",
  description: "description",
  desc: "description",
  category: "category",
  "category description": "category",
  iicrc: "category",
  unit: "unit",
  uom: "unit",
  price: "price",
  "unit price": "price",
  "total unit price": "price",
  cost: "price",
};

const REQUIRED: Field[] = ["code", "description", "unit", "price"];

/** Minimal RFC-4180 parser (mirrors apps/web/lib/csv.ts). */
function parseCsv(input: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  const s = input.replace(/\r\n?/g, "\n");
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (inQuotes) {
      if (ch === '"') {
        if (s[i + 1] === '"') {
          field += '"';
          i++;
        } else inQuotes = false;
      } else field += ch;
      continue;
    }
    if (ch === '"') inQuotes = true;
    else if (ch === ",") {
      row.push(field);
      field = "";
    } else if (ch === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else field += ch;
  }
  if (field !== "" || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

function parseMoneyToCents(raw: string): number | null {
  const cleaned = raw.replace(/[$,\s]/g, "");
  if (cleaned === "" || !/^-?\d*\.?\d+$/.test(cleaned)) return null;
  const dollars = Number(cleaned);
  if (!Number.isFinite(dollars)) return null;
  return Math.round(dollars * 100);
}

function mapHeader(cells: string[]): Partial<Record<Field, number>> {
  const col: Partial<Record<Field, number>> = {};
  cells.forEach((raw, i) => {
    const f = HEADER_ALIASES[raw.trim().toLowerCase()];
    if (f && col[f] === undefined) col[f] = i;
  });
  return col;
}

async function main() {
  const path = process.argv[2];
  const tenantName = process.argv[3] ?? "Acme Restoration";
  if (!path) throw new Error("Usage: import-xa.ts <path.csv> [tenantName]");

  const [tenant] = await db
    .select({ id: tenants.id })
    .from(tenants)
    .where(eq(tenants.name, tenantName))
    .limit(1);
  if (!tenant) throw new Error(`Tenant not found: ${tenantName}`);

  const grid = parseCsv(readFileSync(path, "utf8"));
  let headerRow = -1;
  let col: Partial<Record<Field, number>> = {};
  for (let i = 0; i < Math.min(grid.length, 10); i++) {
    const candidate = mapHeader(grid[i]!);
    if (REQUIRED.every((f) => candidate[f] !== undefined)) {
      headerRow = i;
      col = candidate;
      break;
    }
  }
  if (headerRow === -1) throw new Error("Could not locate header row");

  const byCode = new Map<
    string,
    { code: string; description: string; iicrcCategory: string | null; unit: string; unitPrice: number }
  >();
  let skipped = 0;
  for (let r = headerRow + 1; r < grid.length; r++) {
    const cells = grid[r]!;
    if (cells.every((c) => c.trim() === "")) continue;
    const code = (cells[col.code!] ?? "").trim();
    const description = (cells[col.description!] ?? "").trim();
    const unit = (cells[col.unit!] ?? "").trim();
    const cents = parseMoneyToCents(cells[col.price!] ?? "");
    if (!code || !description || !unit || cents === null || cents < 0) {
      skipped++;
      continue;
    }
    byCode.set(code, {
      code: code.slice(0, 64),
      description: description.slice(0, 500),
      iicrcCategory:
        col.category !== undefined ? cells[col.category]?.trim() || null : null,
      unit: unit.slice(0, 32),
      unitPrice: cents,
    });
  }

  const deduped = [...byCode.values()];
  const BATCH = 500;
  for (let i = 0; i < deduped.length; i += BATCH) {
    const chunk = deduped
      .slice(i, i + BATCH)
      .map((r) => ({ ...r, tenantId: tenant.id }));
    await db
      .insert(priceListItems)
      .values(chunk)
      .onConflictDoUpdate({
        target: [priceListItems.tenantId, priceListItems.code],
        set: {
          description: sql`excluded.description`,
          iicrcCategory: sql`excluded.iicrc_category`,
          unit: sql`excluded.unit`,
          unitPrice: sql`excluded.unit_price`,
          updatedAt: new Date(),
        },
      });
  }

  const [count] = await db
    .select({ c: sql<number>`count(*)::int` })
    .from(priceListItems)
    .where(and(eq(priceListItems.tenantId, tenant.id)));

  console.log(
    `XA load → tenant ${tenantName} (${tenant.id}): imported ${deduped.length}, skipped ${skipped}. Catalog now ${count?.c ?? "?"} items.`,
  );
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
