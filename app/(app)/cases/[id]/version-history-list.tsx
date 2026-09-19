import Link from "next/link";
import type { DocumentVersion } from "@prisma/client";

const CURRENT_BADGE =
  "flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-900 text-xs font-semibold text-white";
const OLDER_BADGE =
  "flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-200 text-xs font-semibold text-slate-700";
const CURRENT_PILL =
  "rounded-full border border-emerald-300 bg-emerald-100 px-2 py-1 text-xs font-medium text-emerald-800";
const OLDER_PILL =
  "rounded-full border border-slate-300 bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700";

// D-07/E8 zero-one-many: `versions` arrives already ordered newest-first
// (versionNumber desc) from the caller's Prisma query — index 0 is always
// the current version. A single-version document therefore renders one
// card with the "Current" pill and NO "Older version" framing anywhere;
// multiple versions render newest-first with every non-current card
// carrying the neutral "Older version — still viewable" pill.
export function VersionHistoryList({
  caseId,
  documentId,
  versions,
}: {
  caseId: string;
  documentId: string;
  versions: DocumentVersion[];
}) {
  return (
    <div className="mt-8">
      <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        Version History
      </h2>

      {versions.length === 0 ? (
        // Defensive-only per 03-UI-SPEC.md — a document always has >=1
        // version in practice; this path is not reachable via any real
        // upload flow.
        <p className="mt-3 text-sm text-slate-500">No versions found.</p>
      ) : (
        <ol className="mt-3 space-y-4">
          {versions.map((version, index) => {
            const isCurrent = index === 0;
            return (
              <li
                key={version.id}
                className={`rounded-lg border bg-white p-4 shadow-sm ${
                  isCurrent ? "border-slate-300" : "border-slate-200"
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <span className={isCurrent ? CURRENT_BADGE : OLDER_BADGE}>
                      v{version.versionNumber}
                    </span>
                    <div className="min-w-0">
                      <p className="break-words text-sm font-medium text-slate-900">
                        {version.originalFilename}
                      </p>
                      <p className="break-words text-sm text-slate-600">
                        {version.changeNote || "—"}
                      </p>
                    </div>
                  </div>
                  <span className={isCurrent ? CURRENT_PILL : OLDER_PILL}>
                    {isCurrent ? "Current" : "Older version — still viewable"}
                  </span>
                </div>
                <div className="mt-3">
                  <Link
                    href={`/cases/${caseId}/documents/${documentId}?version=${version.versionNumber}`}
                    className="text-sm text-slate-700 underline hover:text-slate-900"
                  >
                    View this version
                  </Link>
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
