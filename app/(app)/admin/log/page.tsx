import { authorize } from "@/app/lib/authorize";
import { getAuditLogPage } from "@/app/actions/audit";
import { PaginationControls } from "./pagination-controls";
import { TamperTestPanel } from "./tamper-test-panel";

const PAGE_SIZE = 25;

function formatDetails(details: unknown): string {
  if (details === null || details === undefined) {
    return "—";
  }
  return JSON.stringify(details, null, 2);
}

// LOG-04/D-14: Admin-only, system-wide, newest-first, paginated audit log.
// authorize() is the first statement — non-Admin callers are redirected
// server-side before any AuditLog query runs (AUTH-03 blocking pattern).
export default async function AdminLogPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  await authorize({ role: "ADMIN" });

  const resolvedSearchParams = await searchParams;
  const requestedPage = Number(resolvedSearchParams.page);
  const page =
    Number.isFinite(requestedPage) && requestedPage >= 1
      ? Math.floor(requestedPage)
      : 1;

  const { rows, total } = await getAuditLogPage({ page, pageSize: PAGE_SIZE });
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div>
      <h1 className="text-lg font-semibold text-white">Change Log</h1>

      <TamperTestPanel />

      {total === 0 ? (
        <div className="mt-6 rounded-lg border border-slate-800 bg-slate-900 p-8 text-center">
          <p className="text-slate-200">No changes recorded yet.</p>
          <p className="mt-1 text-sm text-slate-400">
            Actions like creating or deactivating a user will appear here.
          </p>
        </div>
      ) : (
        <>
          <div className="mt-6 overflow-x-auto rounded-lg border border-slate-800">
            <table className="min-w-full divide-y divide-slate-800 text-sm">
              <thead className="bg-slate-900">
                <tr>
                  <th className="px-3 py-2 text-left font-semibold text-slate-300">
                    Time
                  </th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-300">
                    Actor
                  </th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-300">
                    Role
                  </th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-300">
                    Action
                  </th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-300">
                    Target
                  </th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-300">
                    Details
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {rows.map((row) => (
                  <tr key={row.id.toString()}>
                    <td className="whitespace-nowrap px-3 py-2 text-slate-300">
                      {row.createdAt.toLocaleString()}
                    </td>
                    <td
                      className="max-w-[160px] truncate px-3 py-2 text-slate-100"
                      title={row.actor.fullName}
                    >
                      {row.actor.fullName}
                    </td>
                    <td className="px-3 py-2 text-slate-300">
                      {row.actorRole}
                    </td>
                    <td className="px-3 py-2 font-mono text-xs text-slate-200">
                      {row.action}
                    </td>
                    <td
                      className="max-w-[160px] truncate px-3 py-2 text-slate-300"
                      title={row.targetLabel || undefined}
                    >
                      {row.targetLabel || "—"}
                    </td>
                    <td className="max-w-xs px-3 py-2">
                      <div className="max-h-32 overflow-y-auto whitespace-pre-wrap break-all font-mono text-xs text-slate-400">
                        {formatDetails(row.details)}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <PaginationControls page={page} totalPages={totalPages} />
        </>
      )}
    </div>
  );
}
