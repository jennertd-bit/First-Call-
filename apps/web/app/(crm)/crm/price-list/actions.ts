"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import {
  importPriceListItems,
  updatePriceListItem,
  type PriceListRow,
} from "@/lib/data";
import { parseCsv, parseMoneyToCents } from "@/lib/csv";

type Field = "code" | "description" | "category" | "unit" | "price";

/** Header aliases → canonical field. Matched case-insensitively. */
const HEADER_ALIASES: Record<string, Field> = {
  code: "code",
  item: "code",
  "item code": "code",
  sku: "code",
  "full code": "code", // Xactimate
  description: "description",
  desc: "description",
  name: "description",
  category: "category",
  "iicrc category": "category",
  iicrc: "category",
  "category description": "category", // Xactimate
  unit: "unit",
  uom: "unit",
  "unit of measure": "unit",
  price: "price",
  "unit price": "price",
  "total unit price": "price", // Xactimate
  cost: "price",
  rate: "price",
};

const REQUIRED = ["code", "description", "unit", "price"] as const;

/** Map a header row's cells to canonical column indexes (first alias wins). */
function mapHeader(cells: string[]): Partial<Record<Field, number>> {
  const col: Partial<Record<Field, number>> = {};
  cells.forEach((raw, i) => {
    const field = HEADER_ALIASES[raw.trim().toLowerCase()];
    if (field && col[field] === undefined) col[field] = i;
  });
  return col;
}

const RowSchema = z.object({
  code: z.string().trim().min(1).max(64),
  description: z.string().trim().min(1).max(500),
  iicrcCategory: z.string().trim().max(128).nullable(),
  unit: z.string().trim().min(1).max(32),
  unitPrice: z.number().int().nonnegative(),
});

function fail(msg: string): never {
  redirect(`/crm/price-list?error=${encodeURIComponent(msg)}`);
}

export async function importPriceListAction(formData: FormData) {
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    fail("Choose a CSV file to import.");
  }
  if (file.size > 25 * 1024 * 1024) {
    fail("File too large (max 25 MB).");
  }

  const text = await file.text();
  const grid = parseCsv(text);
  if (grid.length < 2) {
    fail("CSV has no data rows.");
  }

  // Find the header row. Some exports (e.g. Xactimate) prefix a title row, so
  // scan the first several rows for the one whose columns cover all required
  // fields rather than assuming row 0.
  let headerRow = -1;
  let col: Partial<Record<Field, number>> = {};
  const scanLimit = Math.min(grid.length, 10);
  for (let i = 0; i < scanLimit; i++) {
    const candidate = mapHeader(grid[i]!);
    if (REQUIRED.every((f) => candidate[f] !== undefined)) {
      headerRow = i;
      col = candidate;
      break;
    }
  }
  if (headerRow === -1) {
    const best = mapHeader(grid[0]!);
    const missing = REQUIRED.filter((f) => best[f] === undefined);
    fail(
      `Missing required column(s): ${missing.join(", ")}. ` +
        `Expected headers like code, description, unit, price.`,
    );
  }

  const rows: PriceListRow[] = [];
  let skipped = 0;
  let firstError = "";
  for (let r = headerRow + 1; r < grid.length; r++) {
    const cells = grid[r]!;
    // Skip fully blank lines.
    if (cells.every((c) => c.trim() === "")) continue;

    const cents = parseMoneyToCents(cells[col.price!] ?? "");
    const parsed = RowSchema.safeParse({
      code: cells[col.code!] ?? "",
      description: cells[col.description!] ?? "",
      iicrcCategory:
        col.category !== undefined
          ? (cells[col.category]?.trim() || null)
          : null,
      unit: cells[col.unit!] ?? "",
      unitPrice: cents ?? Number.NaN,
    });
    if (!parsed.success || cents === null) {
      skipped++;
      if (!firstError) {
        firstError =
          cents === null
            ? `row ${r + 1}: invalid price "${cells[col.price!] ?? ""}"`
            : `row ${r + 1}: ${parsed.error?.issues[0]?.message ?? "invalid"}`;
      }
      continue;
    }
    rows.push(parsed.data);
  }

  if (rows.length === 0) {
    fail(`No valid rows. First issue: ${firstError || "unknown"}`);
  }

  const { total } = await importPriceListItems(rows);
  revalidatePath("/crm/price-list");

  const params = new URLSearchParams({ imported: String(total) });
  if (skipped > 0) {
    params.set("skipped", String(skipped));
    if (firstError) params.set("reason", firstError);
  }
  redirect(`/crm/price-list?${params.toString()}`);
}

const UpdateSchema = z.object({
  id: z.string().uuid(),
  description: z.string().trim().min(1, "Description is required").max(500),
  iicrcCategory: z.string().trim().max(128).nullable(),
  unit: z.string().trim().min(1, "Unit is required").max(32),
  unitPrice: z.number().int().nonnegative(),
});

export type UpdatePriceListInput = {
  id: string;
  description: string;
  iicrcCategory: string | null;
  unit: string;
  /** Raw price text from the input (e.g. "1,250.00" or "$42"). */
  priceText: string;
};

export type UpdatePriceListResult =
  | { ok: true }
  | { ok: false; error: string };

/**
 * Inline-edit a single price-list row. Returns a result object (rather than
 * redirecting) so the table can show per-row success/error without a full
 * navigation. Tenant scoping is enforced in the data layer.
 */
export async function updatePriceListItemAction(
  input: UpdatePriceListInput,
): Promise<UpdatePriceListResult> {
  const cents = parseMoneyToCents(input.priceText);
  if (cents === null) {
    return { ok: false, error: `Invalid price "${input.priceText}"` };
  }
  const parsed = UpdateSchema.safeParse({
    id: input.id,
    description: input.description,
    iicrcCategory: input.iicrcCategory?.trim() ? input.iicrcCategory.trim() : null,
    unit: input.unit,
    unitPrice: cents,
  });
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Invalid input",
    };
  }

  const { id, ...fields } = parsed.data;
  await updatePriceListItem(id, fields);
  revalidatePath("/crm/price-list");
  return { ok: true };
}
