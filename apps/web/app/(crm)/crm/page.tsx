import { getDispatchMetrics, listClaimsForBoard } from "@/lib/data";
import { DispatchBoard } from "./board";

/** C Dispatch Board — capture-ratio gauge + live kanban pipeline (spec §8). */
export default async function CrmDispatchBoard() {
  const [claims, metrics] = await Promise.all([
    listClaimsForBoard(),
    getDispatchMetrics(),
  ]);
  return <DispatchBoard claims={claims} metrics={metrics} />;
}
