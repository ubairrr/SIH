import type { Case, User } from "@prisma/client";

import { CaseMetadataGrid } from "./case-metadata-grid";
import { StageTimeline } from "./stage-timeline";
import { StageHistoryList, type StageHistoryRow } from "./stage-history-list";
import { EditCaseForm } from "./edit-case-form";

type CaseWithDetails = Case & {
  registeredBy: Pick<User, "fullName">;
  stageHistory: StageHistoryRow[];
};

// Task 1 moves the Case Metadata / Case Lifecycle / Stage History / Edit
// Case Details sections here verbatim from page.tsx, unchanged in substance
// and section order (E1 acceptance: Overview content renders identically to
// before this restructure). Task 3 retrofits the Edit Case Details section
// to the D-12 view/Edit rule and adds the D-18 soft stage-warning banner.
export function OverviewTab({ kase }: { kase: CaseWithDetails }) {
  return (
    <div>
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
