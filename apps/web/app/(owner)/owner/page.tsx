import { ESTIMATE_AREAS, ESTIMATE_CAUSES } from "@/lib/estimate";
import { getTenantName } from "@/lib/data";
import { OwnerApp } from "./owner-app";

/** Surface A — owner-facing claim intake PWA. Tenant resolved server-side. */
export default async function OwnerPage() {
  const tenant = await getTenantName();
  return (
    <OwnerApp
      tenant={tenant}
      vendor="Summit Restoration"
      msa
      causes={ESTIMATE_CAUSES}
      areas={ESTIMATE_AREAS}
    />
  );
}
