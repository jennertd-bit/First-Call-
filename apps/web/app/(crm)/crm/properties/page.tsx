import Link from "next/link";
import { Button, Field, Input, Panel, Select } from "@firstcall/ui";
import { listProperties } from "@/lib/data";
import { createPropertyAction } from "./actions";

const typeLabel: Record<string, string> = {
  condo: "Condo",
  single: "Single",
  commercial: "Commercial",
};

export default async function PropertiesPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const properties = await listProperties();

  return (
    <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
      <Panel title={`Properties · ${properties.length}`} bodyClassName="p-0">
        {properties.length === 0 ? (
          <p className="p-6 text-sm text-gray">
            No properties yet. Add your first one →
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line2 text-left">
                <th className="mono-label px-[18px] py-3">Name</th>
                <th className="mono-label px-[18px] py-3">Address</th>
                <th className="mono-label px-[18px] py-3">Type</th>
              </tr>
            </thead>
            <tbody>
              {properties.map((p) => (
                <tr
                  key={p.id}
                  className="border-b border-line2 last:border-0 hover:bg-[var(--hover)]"
                >
                  <td className="px-[18px] py-3 font-medium">
                    <Link
                      href={`/crm/properties/${p.id}`}
                      className="text-[var(--brand-accent)] hover:underline"
                    >
                      {p.name}
                    </Link>
                  </td>
                  <td className="px-[18px] py-3 text-gray">{p.address}</td>
                  <td className="px-[18px] py-3 text-gray">
                    {typeLabel[p.type] ?? p.type}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Panel>

      <Panel title="Add property">
        {error ? (
          <p className="mb-3 rounded bg-[rgba(181,82,75,0.10)] px-3 py-2 text-xs text-red">
            {error}
          </p>
        ) : null}
        <form action={createPropertyAction} className="flex flex-col gap-3">
          <Field label="Name">
            <Input name="name" placeholder="Bayview Condos" required />
          </Field>
          <Field label="Address">
            <Input name="address" placeholder="100 Harbor Way, San Diego" required />
          </Field>
          <Field label="Type">
            <Select name="type" defaultValue="condo">
              <option value="condo">Condo</option>
              <option value="single">Single</option>
              <option value="commercial">Commercial</option>
            </Select>
          </Field>
          <Button type="submit">Create property</Button>
        </form>
      </Panel>
    </div>
  );
}
