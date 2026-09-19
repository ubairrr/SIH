import { getCaseLogPage } from "@/app/actions/document-log";
import { PaginationControls } from "@/app/(app)/admin/log/pagination-controls";

const PAGE_SIZE = 25;

// Copied verbatim from app/(app)/admin/log/page.tsx's formatDetails helper.
function formatDetails(details: unknown): string {
  if (details === null || details === undefined) {
    return "—";
  }
  return JSON.stringify(details, null, 2);
}

// D-19/D-20/LOG-03: per-case change log, visible to every role (no `{ role:
// "ADMIN" }` restriction — getCaseLogPage's own authorize() call only
// requires an authenticated session). Table markup, columns, and classes
// are copied verbatim from the Admin Log page so the two logs are visually
// identical; only the data source and pagination basePath differ.
export async function ChangeLogTab({
  caseId,
  page,
}: {
  caseId: string;
  page: number;
}) {
  const { rows, total } = await getCaseLogPage({
    caseId,
    page,
    pageSize: PAGE_SIZE,
  });
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  if (total === 0) {
    return (
      <div className="mt-6 rounded-lg border border-slate-200 bg-white p-8 text-center">
        <p className="text-slate-900">
          No changes recorded yet for this case.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="mt-6 overflow-x-auto rounded-lg border border-slate-200">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-3 py-2 text-left font-semibold text-slate-700">
                Time
              </th>
              <th className="px-3 py-2 text-left font-semibold text-slate-700">
                Actor
              </th>
              <th className="px-3 py-2 text-left font-semibold text-slate-700">
                Role
              </th>
              <th className="px-3 py-2 text-left font-semibold text-slate-700">
                Action
              </th>
              <th className="px-3 py-2 text-left font-semibold text-slate-700">
                Target
              </th>
              <th className="px-3 py-2 text-left font-semibold text-slate-700">
                Details
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 bg-white">
            {rows.map((row) => (
              <tr key={row.id.toString()}>
                <td className="whitespace-nowrap px-3 py-2 text-slate-700">
                  {row.createdAt.toLocaleString()}
                </td>
                <td
                  className="max-w-[160px] truncate px-3 py-2 text-slate-900"
                  title={row.actor.fullName}
                >
                  {row.actor.fullName}
                </td>
                <td className="px-3 py-2 text-slate-700">{row.actorRole}</td>
                <td className="px-3 py-2 font-mono text-xs text-slate-700">
                  {row.action}
                </td>
                <td
                  className="max-w-[160px] truncate px-3 py-2 text-slate-700"
                  title={row.targetLabel || undefined}
                >
                  {row.targetLabel || "—"}
                </td>
                <td className="max-w-xs px-3 py-2">
                  <div className="max-h-32 overflow-y-auto whitespace-pre-wrap break-all font-mono text-xs text-slate-500">
                    {formatDetails(row.details)}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <PaginationControls
        page={page}
        totalPages={totalPages}
        basePath={`/cases/${caseId}?tab=change-log&`}
      />
    </>
  );
}
