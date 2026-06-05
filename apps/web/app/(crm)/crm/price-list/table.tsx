"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@firstcall/ui";
import { updatePriceListItemAction } from "./actions";

type Item = {
  id: string;
  code: string;
  description: string;
  iicrcCategory: string | null;
  unit: string;
  unitPrice: number;
};

function formatCents(cents: number): string {
  return (cents / 100).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
  });
}

const inputCls =
  "w-full rounded-md border border-line bg-card px-2 py-1.5 text-[13px] text-ink focus:border-[var(--brand-accent)] focus:outline-none";

/**
 * Searchable, paginated, inline-editable view of the full price list. Search
 * and paging push URL params (server re-queries); row edits go through a server
 * action and refresh in place.
 */
export function PriceListTable({
  items,
  total,
  page,
  pageCount,
  pageSize,
  query,
}: {
  items: Item[];
  total: number;
  page: number;
  pageCount: number;
  pageSize: number;
  query: string;
}) {
  const router = useRouter();
  const [search, setSearch] = useState(query);
  const [editingId, setEditingId] = useState<string | null>(null);

  const go = (next: { q?: string; page?: number }) => {
    const params = new URLSearchParams();
    const q = next.q ?? query;
    if (q) params.set("q", q);
    const p = next.page ?? 1;
    if (p > 1) params.set("page", String(p));
    const qs = params.toString();
    router.push(`/crm/price-list${qs ? `?${qs}` : ""}`);
  };

  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  return (
    <div className="flex flex-col gap-3">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          go({ q: search.trim(), page: 1 });
        }}
        className="flex gap-2"
      >
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search code, description, or category…"
          className="min-w-0 flex-1 rounded-control border border-line bg-card px-3 py-2.5 text-sm text-ink placeholder:text-faint focus:border-[var(--brand-accent)] focus:outline-none"
          aria-label="Search price list"
        />
        <Button type="submit" variant="secondary">
          Search
        </Button>
        {query ? (
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              setSearch("");
              go({ q: "", page: 1 });
            }}
          >
            Clear
          </Button>
        ) : null}
      </form>

      <div className="overflow-x-auto rounded-card border border-line">
        <table className="w-full min-w-[680px] text-sm">
          <thead>
            <tr className="border-b border-line2 bg-wash text-left">
              <th className="mono-label px-3 py-3">Code</th>
              <th className="mono-label px-3 py-3">Description</th>
              <th className="mono-label px-3 py-3">Cat.</th>
              <th className="mono-label px-3 py-3">Unit</th>
              <th className="mono-label px-3 py-3 text-right">Price</th>
              <th className="mono-label px-3 py-3 text-right">Edit</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-3 py-8 text-center text-sm text-gray"
                >
                  {query
                    ? `No items match “${query}”.`
                    : "No price-list items yet. Import a CSV to get started."}
                </td>
              </tr>
            ) : (
              items.map((it) =>
                editingId === it.id ? (
                  <EditRow
                    key={it.id}
                    item={it}
                    onClose={() => setEditingId(null)}
                    onSaved={() => {
                      setEditingId(null);
                      router.refresh();
                    }}
                  />
                ) : (
                  <tr
                    key={it.id}
                    className="border-b border-line2 last:border-0 hover:bg-[var(--hover)]"
                  >
                    <td className="whitespace-nowrap px-3 py-2.5 font-mono text-[12.5px] font-medium text-[var(--brand-primary)]">
                      {it.code}
                    </td>
                    <td className="px-3 py-2.5 text-ink">{it.description}</td>
                    <td className="px-3 py-2.5 text-gray">
                      {it.iicrcCategory ?? "—"}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2.5 text-gray">
                      {it.unit}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2.5 text-right font-mono text-ink">
                      {formatCents(it.unitPrice)}
                    </td>
                    <td className="px-3 py-2.5 text-right">
                      <button
                        type="button"
                        onClick={() => setEditingId(it.id)}
                        className="font-mono text-[12px] font-semibold text-[var(--brand-accent)] hover:underline"
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ),
              )
            )}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 text-[12.5px] text-gray">
        <span>
          {total === 0
            ? "No items"
            : `Showing ${from.toLocaleString("en-US")}–${to.toLocaleString("en-US")} of ${total.toLocaleString("en-US")}`}
        </span>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            disabled={page <= 1}
            onClick={() => go({ page: page - 1 })}
          >
            Prev
          </Button>
          <span className="font-mono text-[12px] text-ink">
            Page {page} / {pageCount}
          </span>
          <Button
            variant="secondary"
            size="sm"
            disabled={page >= pageCount}
            onClick={() => go({ page: page + 1 })}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}

function EditRow({
  item,
  onClose,
  onSaved,
}: {
  item: Item;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [description, setDescription] = useState(item.description);
  const [category, setCategory] = useState(item.iicrcCategory ?? "");
  const [unit, setUnit] = useState(item.unit);
  const [priceText, setPriceText] = useState((item.unitPrice / 100).toFixed(2));
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const save = () => {
    setError(null);
    startTransition(async () => {
      const res = await updatePriceListItemAction({
        id: item.id,
        description,
        iicrcCategory: category.trim() ? category.trim() : null,
        unit,
        priceText,
      });
      if (res.ok) onSaved();
      else setError(res.error);
    });
  };

  return (
    <tr className="border-b border-line2 bg-[rgba(232,112,58,0.04)] align-top last:border-0">
      <td className="whitespace-nowrap px-3 py-2.5 font-mono text-[12.5px] font-medium text-[var(--brand-primary)]">
        {item.code}
      </td>
      <td className="px-3 py-2.5">
        <input
          className={inputCls}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          aria-label="Description"
        />
      </td>
      <td className="px-3 py-2.5">
        <input
          className={inputCls}
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          placeholder="—"
          aria-label="Category"
        />
      </td>
      <td className="px-3 py-2.5">
        <input
          className={`${inputCls} w-20`}
          value={unit}
          onChange={(e) => setUnit(e.target.value)}
          aria-label="Unit"
        />
      </td>
      <td className="px-3 py-2.5 text-right">
        <input
          className={`${inputCls} w-24 text-right font-mono`}
          value={priceText}
          onChange={(e) => setPriceText(e.target.value)}
          inputMode="decimal"
          aria-label="Price"
        />
      </td>
      <td className="px-3 py-2.5">
        <div className="flex items-center justify-end gap-1.5">
          <Button size="sm" onClick={save} disabled={pending}>
            {pending ? "Saving…" : "Save"}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={onClose}
            disabled={pending}
          >
            Cancel
          </Button>
        </div>
        {error ? (
          <div className="mt-1 text-right text-[11px] text-red">{error}</div>
        ) : null}
      </td>
    </tr>
  );
}
