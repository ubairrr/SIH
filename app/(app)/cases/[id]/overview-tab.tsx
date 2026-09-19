import type { Case, Stage, User } from "@prisma/client";

import { prisma } from "@/app/lib/prisma";
import { CaseMetadataGrid } from "./case-metadata-grid";
import { StageTimeline } from "./stage-timeline";
import { StageHistoryList, type StageHistoryRow } from "./stage-history-list";
import { EditCaseForm } from "./edit-case-form";

type CaseWithDetails = Case & {
  registeredBy: Pick<User, "fullName">;
  stageHistory: StageHistoryRow[];
};

// D-18: soft, non-blocking stage warning. Checked at exactly the stage that
// precedes the document's expected checkpoint — FIR before leaving
// FIR_REGISTERED, Charge Sheet before leaving CHARGE_SHEET_FILED, Judgment
// before closing out of IN_COURT. Pure function, no I/O — the caller
// supplies the three booleans from its own prisma.document.count() lookups.
export function missingExpectedDocumentLabel(
  stage: Stage,
  hasFir: boolean,
  hasChargeSheet: boolean,
  hasJudgment: boolean,
): string | null {
  if (stage === "FIR_REGISTERED" && !hasFir) return "FIR";
  if (stage === "CHARGE_SHEET_FILED" && !hasChargeSheet) return "Charge Sheet";
  if (stage === "IN_COURT" && !hasJudgment) return "Judgment";
  return null;
}

// Task 1 moved the Case Metadata / Case Lifecycle / Stage History / Edit
// Case Details sections here verbatim from page.tsx, unchanged in substance
// and section order (E1 acceptance: Overview content renders identically to
// before that restructure). Task 3 retrofits the Edit Case Details section
// to the D-12 view/Edit rule (inside EditCaseForm itself — rendering it
// unconditionally for non-closed cases means its own Edit button never
// renders at all for a closed case) and adds the D-18 amber banner, computed
// from a live prisma.document.count() query — safe to query now since
// 03-01's Document schema already exists, even though no upload path
// writes rows until 03-04.
export async function OverviewTab({ kase }: { kase: CaseWithDetails }) {
  const [firCount, chargeSheetCount, judgmentCount] = await Promise.all([
    prisma.document.count({
      where: { caseId: kase.id, category: "FIR", deletedAt: null },
    }),
    prisma.document.count({
      where: { caseId: kase.id, category: "CHARGE_SHEET", deletedAt: null },
    }),
    prisma.document.count({
      where: { caseId: kase.id, category: "JUDGMENT", deletedAt: null },
    }),
  ]);

  const missingDocLabel = missingExpectedDocumentLabel(
    kase.stage,
    firCount > 0,
    chargeSheetCount > 0,
    judgmentCount > 0,
  );

  return (
    <div>
      {missingDocLabel && (
        <div className="mt-6 rounded-md border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          This case doesn&apos;t yet have a {missingDocLabel} on file.
        </div>
      )}

      <div className="mt-6 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Case Metadata
        </h2>
        <div className="mt-4">
          <CaseMetadataGrid kase={kase} />
        </div>
      </div>

      <div className="mt-6 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Case Lifecycle
        </h2>
        <div className="mt-4">
          <StageTimeline currentStage={kase.stage} />
        </div>
      </div>

      <div className="mt-6 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Stage History
        </h2>
        <div className="mt-4">
          <StageHistoryList rows={kase.stageHistory} />
        </div>
      </div>

      <div className="mt-6 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Edit Case Details
        </h2>
        <div className="mt-4">
          {kase.stage === "CLOSED_JUDGMENT" ? (
            <p className="text-sm text-slate-500">
              This case is closed and can no longer be edited.
            </p>
          ) : (
            <EditCaseForm kase={kase} />
          )}
        </div>
      </div>
    </div>
  );
}
