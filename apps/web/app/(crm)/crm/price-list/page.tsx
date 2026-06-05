import { Button, Field, Panel, Stat } from "@firstcall/ui";
import { countPriceListItems, listPriceListItemsPage } from "@/lib/data";
import { importPriceListAction } from "./actions";
import { PriceListTable } from "./table";

export default async function PriceListPage({
  searchParams,
}: {
  searchParams: Promise<{
    error?: string;
    imported?: string;
    skipped?: string;
    reason?: string;
    q?: string;
    page?: string;
  }>;
}) {
  const { error, imported, skipped, reason, q, page } = await searchParams;
  const query = typeof q === "string" ? q : "";
  const pageNum = Math.max(1, Number.parseInt(page ?? "1", 10) || 1);

  const [count, result] = await Promise.all([
    countPriceListItems(),
    listPriceListItemsPage({ q: query, page: pageNum }),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <Stat
          n={count.toLocaleString("en-US")}
          label="T&M items active"
          sub="This tenant's price list"
          accent="var(--brand-accent)"
        />
      </div>

      <Panel title="Price list — search, browse, and edit">
        <PriceListTable
          items={result.items}
          total={result.total}
          page={result.page}
          pageCount={result.pageCount}
          pageSize={result.pageSize}
          query={query}
        />
      </Panel>

      <Panel title="Import price list" className="w-full lg:max-w-md">
        {error ? (
          <p className="mb-3 rounded bg-[rgba(181,82,75,0.10)] px-3 py-2 text-xs text-red">
            {error}
          </p>
        ) : null}
        {imported ? (
          <p className="mb-3 rounded bg-[rgba(31,168,160,0.12)] px-3 py-2 text-xs text-teal">
            Imported {imported} item{imported === "1" ? "" : "s"}.
            {skipped
              ? ` Skipped ${skipped} (e.g. ${reason ?? "invalid row"}).`
              : ""}
          </p>
        ) : null}
        <form
          action={importPriceListAction}
          className="flex flex-col gap-3"
          encType="multipart/form-data"
        >
          <Field
            label="CSV file"
            hint="Headers: code, description, unit, price (category optional). Existing codes are updated."
          >
            <input
              type="file"
              name="file"
              accept=".csv,text/csv"
              required
              className="w-full rounded-control border border-line bg-card px-3 py-2.5 text-sm text-ink file:mr-3 file:rounded-md file:border-0 file:bg-[var(--brand-primary)] file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-white"
            />
          </Field>
          <Button type="submit">Import CSV</Button>
        </form>
      </Panel>
    </div>
  );
}
