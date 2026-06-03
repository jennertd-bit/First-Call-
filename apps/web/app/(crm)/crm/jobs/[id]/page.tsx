import { notFound } from "next/navigation";
import { getClaimForEstimate } from "@/lib/data";
import { EstimateEditor } from "./editor";

export default async function JobEstimatePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = await getClaimForEstimate(id);
  if (!data) notFound();

  return (
    <EstimateEditor
      claimId={id}
      claim={data.claim}
      estimate={data.estimate}
      lineItems={data.lineItems}
      learning={data.learning}
    />
  );
}
