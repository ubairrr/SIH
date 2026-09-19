import { notFound } from "next/navigation";

import { authorize } from "@/app/lib/authorize";
import { prisma } from "@/app/lib/prisma";
import { CaseDetailClient } from "./case-detail-client";
import { TabBar, type CaseTab } from "./tab-bar";
import { OverviewTab } from "./overview-tab";
import { ChangeLogTab } from "./change-log-tab";

const TABS: CaseTab[] = [
  { key: "overview", label: "Overview" },
  { key: "change-log", label: "Change log" },
];

const TAB_KEYS = TABS.map((t) => t.key);

// ACC-01/D-01: any authenticated role (all departments + Admin) can open any
// case's detail page regardless of its stage — there is no unit scoping and
// no "not reached yet" hiding. A missing case is a real 404, distinct from
// the role-based /access-denied 403 page used elsewhere (D-13).
//
// D-13: the page is now a URL-synced tab shell. `?tab=` selects the active
// tab (E1: an unknown/missing value falls back to "overview" with no error
// surface); `?page=` (only meaningful for `?tab=change-log`) selects the
// Change log's page. Documents/Evidence entries are added to the same
// `TABS` array literal by 03-04.
export default async function CaseDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string; page?: string }>;
}) {
  const { id } = await params;
  const session = await authorize();
  const resolvedSearchParams = await searchParams;

  const tab = TAB_KEYS.includes(resolvedSearchParams.tab ?? "")
    ? (resolvedSearchParams.tab as string)
    : "overview";

  const requestedPage = Number(resolvedSearchParams.page);
  const page =
    Number.isFinite(requestedPage) && requestedPage >= 1
      ? Math.floor(requestedPage)
      : 1;

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

      <div className="mt-6">
        <TabBar tabs={TABS} activeTab={tab} />
      </div>

      {tab === "overview" && <OverviewTab kase={kase} />}
      {tab === "change-log" && <ChangeLogTab caseId={kase.id} page={page} />}
    </div>
  );
}
