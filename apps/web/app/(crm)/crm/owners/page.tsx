import { Badge, Button, Field, Input, Panel, Select } from "@firstcall/ui";
import { listOwners } from "@/lib/data";
import { createOwnerAction } from "./actions";

const roleLabel: Record<string, string> = {
  hoa: "HOA",
  unit_owner: "Unit owner",
  tenant: "Tenant",
};

export default async function OwnersPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const owners = await listOwners();

  return (
    <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
      <Panel title={`Owners · ${owners.length}`} bodyClassName="p-0">
        {owners.length === 0 ? (
          <p className="p-6 text-sm text-gray">No owners yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line2 text-left">
                <th className="mono-label px-[18px] py-3">Name</th>
                <th className="mono-label px-[18px] py-3">Contact</th>
                <th className="mono-label px-[18px] py-3">Role</th>
              </tr>
            </thead>
            <tbody>
              {owners.map((o) => (
                <tr
                  key={o.id}
                  className="border-b border-line2 last:border-0 hover:bg-[var(--hover)]"
                >
                  <td className="px-[18px] py-3 font-medium">{o.name}</td>
                  <td className="px-[18px] py-3 text-gray">{o.contact}</td>
                  <td className="px-[18px] py-3">
                    <Badge>{roleLabel[o.role] ?? o.role}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Panel>

      <Panel title="Add owner">
        {error ? (
          <p className="mb-3 rounded bg-[rgba(181,82,75,0.10)] px-3 py-2 text-xs text-red">
            {error}
          </p>
        ) : null}
        <form action={createOwnerAction} className="flex flex-col gap-3">
          <Field label="Name">
            <Input name="name" placeholder="Jane Doe" required />
          </Field>
          <Field label="Contact">
            <Input name="contact" placeholder="jane@example.com" required />
          </Field>
          <Field label="Role">
            <Select name="role" defaultValue="unit_owner">
              <option value="hoa">HOA</option>
              <option value="unit_owner">Unit owner</option>
              <option value="tenant">Tenant</option>
            </Select>
          </Field>
          <Button type="submit">Create owner</Button>
        </form>
      </Panel>
    </div>
  );
}
