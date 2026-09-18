import type { Stage } from "@prisma/client";

import { authorize } from "@/app/lib/authorize";
import { prisma } from "@/app/lib/prisma";
import { STAGE_OWNER } from "@/app/lib/case-guards";
import { DashboardTables } from "./dashboard-tables";

// D-19: two-section dashboard — "At your stage" (this department's work
// queue) then "All other cases" (every other case, labeled by stage).
// D-04/D-19: Admin gets a dashboard too (no redirect) — STAGE_OWNER never
// maps to "ADMIN", so ownedStages is always [] for Admin, which correctly
// yields an empty "At your stage" and every case in "All other cases".
// D-03 prohibition: neither query may filter by policeStation/unit — case
// visibility is department-wide, gated only by Case.stage.
export default async function DashboardPage() {
  const user = await authorize();

  const ownedStages = (Object.keys(STAGE_OWNER) as Stage[]).filter(
    (stage) => STAGE_OWNER[stage] === user.role,
  );

  const [atYourStage, allOtherCases] = await Promise.all([
    prisma.case.findMany({
      where: { stage: { in: ownedStages } },
      orderBy: { incidentDate: "desc" },
    }),
    prisma.case.findMany({
      where: { stage: { notIn: ownedStages } },
      orderBy: { incidentDate: "desc" },
    }),
  ]);

  return (
    <div>
      <h1 className="text-xl font-semibold text-slate-900">Dashboard</h1>
      <DashboardTables
        atYourStage={atYourStage}
        allOtherCases={allOtherCases}
      />
    </div>
  );
}
