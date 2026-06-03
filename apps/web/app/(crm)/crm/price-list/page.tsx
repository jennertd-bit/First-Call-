import { Button, Field, Panel, Stat } from "@firstcall/ui";
import { countPriceListItems, listPriceListItems } from "@/lib/data";
import { importPriceListAction } from "./actions";

function formatCents(cents: number): string {
  return (cents / 100).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
  });
}

export default async function PriceListPage({
  searchParams,
}: {
  searchParams: Promise<{
    error?: string;
    imported?: string;
    skipped?: string;
    reason?: string;
  }>;
}) {
  const { error, imported, skipped, reason } = await searchParams;
  const [count, items] = await Promise.all([
    countPriceListItems(),
    listPriceListItems(50),
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

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <Panel
          title={`Items · showing ${items.length} of ${count.toLocaleString("en-US")}`}
          bodyClassName="p-0"
        >
          {items.length === 0 ? (
            <p className="p-6 text-sm text-gray">
              No price-list items yet. Import a CSV to get started →
            </p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line2 text-left">
                  <th className="mono-label px-[18px] py-3">Code</th>
                  <th className="mono-label px-[18px] py-3">Description</th>
                  <th className="mono-label px-[18px] py-3">Cat.</th>
                  <th className="mono-label px-[18px] py-3">Unit</th>
                  <th className="mono-label px-[18px] py-3 text-right">Price</th>
                </tr>
              </thead>
              <tbody>
                {items.map((it) => (
                  <tr
                    key={it.id}
                    className="border-b border-line2 last:border-0 hover:bg-[var(--hover)]"
                  >
                    <td className="px-[18px] py-2.5 font-mono text-[12.5px] font-medium text-[var(--brand-primary)]">
                      {it.code}
                    </td>
                    <td className="px-[18px] py-2.5 text-ink">
                      {it.description}
                    </td>
                    <td className="px-[18px] py-2.5 text-gray">
                      {it.iicrcCategory ?? "—"}
                    </td>
                    <td className="px-[18px] py-2.5 text-gray">{it.unit}</td>
                    <td className="px-[18px] py-2.5 text-right font-mono text-ink">
                      {formatCents(it.unitPrice)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Panel>

        <Panel title="Import price list">
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
    </div>
  );
}
