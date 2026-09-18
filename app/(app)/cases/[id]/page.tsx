import { notFound } from "next/navigation";

import { authorize } from "@/app/lib/authorize";
import { prisma } from "@/app/lib/prisma";
import { CaseMetadataGrid } from "./case-metadata-grid";
import { StageTimeline } from "./stage-timeline";
import { StageHistoryList } from "./stage-history-list";
import { EditCaseForm } from "./edit-case-form";
import { CaseDetailClient } from "./case-detail-client";

// ACC-01/D-01: any authenticated role (all departments + Admin) can open any
// case's detail page regardless of its stage — there is no unit scoping and
// no "not reached yet" hiding. A missing case is a real 404, distinct from
// the role-based /access-denied 403 page used elsewhere (D-13).
export default async function CaseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await authorize();

  const kase = await prisma.case.findUnique({
    where: { id },
    include: {
      stageHistory: {
        include: { actor: { select: { fullName: true } } },
        orderBy: { createdAt: "asc" },
      },
      registeredBy: { select: { fullName: true } },
    },
  });

  if (!kase) {
    notFound();
  }

  const isClosed = kase.stage === "CLOSED_JUDGMENT";

  return (
    <div className="mx-auto max-w-4xl">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="font-mono text-sm text-slate-500">{kase.firNumber}</p>
          <h1 className="break-words text-xl font-semibold text-slate-900">
            {kase.title}
          </h1>
        </div>
        <CaseDetailClient
          caseId={kase.id}
          firNumber={kase.firNumber}
          stage={kase.stage}
          role={session.role}
        />
      </div>

      {isClosed && (
        <div className="mt-4 rounded-md border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          This case is closed — read-only.
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
          <EditCaseForm kase={kase} />
        </div>
      </div>
    </div>
  );
}
