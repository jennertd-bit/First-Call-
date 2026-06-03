import Link from "next/link";
import { notFound } from "next/navigation";
import { Button, Field, Input, Panel, Select, StatusBadge } from "@firstcall/ui";
import { getProperty } from "@/lib/data";
import { createUnitAction, setUnitHo6Action } from "../actions";

const typeLabel: Record<string, string> = {
  condo: "Condo",
  single: "Single",
  commercial: "Commercial",
};

export default async function PropertyDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const { error } = await searchParams;
  const result = await getProperty(id);
  if (!result) notFound();
  const { property, units } = result;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link
          href="/crm/properties"
          className="font-mono text-[11px] uppercase tracking-[0.08em] text-gray hover:text-[var(--brand-primary)]"
        >
          ← Properties
        </Link>
        <h1 className="mt-1.5 text-2xl font-bold tracking-[-0.015em] text-[var(--brand-primary)]">
          {property.name}
        </h1>
        <p className="text-sm text-gray">
          {property.address} · {typeLabel[property.type] ?? property.type}
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <Panel title={`Units · ${units.length}`} bodyClassName="p-0">
          {units.length === 0 ? (
            <p className="p-6 text-sm text-gray">No units yet.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line2 text-left">
                  <th className="mono-label px-[18px] py-3">Unit</th>
                  <th className="mono-label px-[18px] py-3">HO6 status</th>
                  <th className="mono-label px-[18px] py-3">Update</th>
                </tr>
              </thead>
              <tbody>
                {units.map((u) => (
                  <tr
                    key={u.id}
                    className="border-b border-line2 last:border-0"
                  >
                    <td className="px-[18px] py-3 font-medium">
                      {u.unitNumber}
                    </td>
                    <td className="px-[18px] py-3">
                      <StatusBadge status={u.ho6Status} />
                    </td>
                    <td className="px-[18px] py-3">
                      <form action={setUnitHo6Action} className="flex gap-2">
                        <input type="hidden" name="unitId" value={u.id} />
                        <input
                          type="hidden"
                          name="propertyId"
                          value={property.id}
                        />
                        <Select
                          name="ho6Status"
                          defaultValue={u.ho6Status}
                          className="w-32 py-1.5"
                        >
                          <option value="verified">Verified</option>
                          <option value="pending">Pending</option>
                          <option value="none">None</option>
                        </Select>
                        <Button type="submit" variant="secondary" size="sm">
                          Save
                        </Button>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Panel>

        <Panel title="Add unit">
          {error ? (
            <p className="mb-3 rounded bg-[rgba(181,82,75,0.10)] px-3 py-2 text-xs text-red">
              {error}
            </p>
          ) : null}
          <form action={createUnitAction} className="flex flex-col gap-3">
            <input type="hidden" name="propertyId" value={property.id} />
            <Field label="Unit number">
              <Input name="unitNumber" placeholder="101" required />
            </Field>
            <Field label="HO6 status">
              <Select name="ho6Status" defaultValue="none">
                <option value="verified">Verified</option>
                <option value="pending">Pending</option>
                <option value="none">None on file</option>
              </Select>
            </Field>
            <Button type="submit">Add unit</Button>
          </form>
        </Panel>
      </div>
    </div>
  );
}
