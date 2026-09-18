import Link from "next/link";
import type { Case } from "@prisma/client";

import { STAGE_BADGE_CLASS, STAGE_LABELS } from "@/app/lib/role-display";

// E1/E2: null-safety helper matching users-page-client.tsx's Cell pattern —
// renders "—" for a null/empty optional value instead of a blank cell.
function Cell({ value }: { value: string | null | undefined }) {
  return (
    <span className="truncate" title={value ?? undefined}>
      {value && value.length > 0 ? value : "—"}
    </span>
  );
}

function CaseTable({ cases }: { cases: Case[] }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200">
      <table className="min-w-full divide-y divide-slate-200 text-sm">
        <thead className="bg-slate-50">
          <tr>
            <th className="px-3 py-2 text-left font-semibold text-slate-700">
              FIR Number
            </th>
            <th className="px-3 py-2 text-left font-semibold text-slate-700">
              Title
            </th>
            <th className="px-3 py-2 text-left font-semibold text-slate-700">
              Stage
            </th>
            <th className="px-3 py-2 text-left font-semibold text-slate-700">
              Incident Date
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200 bg-white">
          {cases.map((kase) => (
            <tr key={kase.id}>
              <td className="whitespace-nowrap px-3 py-2 font-mono text-xs text-slate-900">
                <Link
                  href={`/cases/${kase.id}`}
                  className="hover:underline"
                >
                  <Cell value={kase.firNumber} />
                </Link>
              </td>
              <td
                className="max-w-[240px] truncate px-3 py-2 text-slate-900"
                title={kase.title}
              >
                {kase.title}
              </td>
              <td className="px-3 py-2">
                <span className={STAGE_BADGE_CLASS}>
                  {STAGE_LABELS[kase.stage]}
                </span>
              </td>
              <td className="whitespace-nowrap px-3 py-2 text-slate-700">
                {kase.incidentDate.toLocaleDateString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// D-19/E1/E2: two-section dashboard renderer. Server Component — no
// interactivity, pure render of what page.tsx already fetched.
export function DashboardTables({
  atYourStage,
  allOtherCases,
}: {
  atYourStage: Case[];
  allOtherCases: Case[];
}) {
  return (
    <div>
      <section>
        <h2 className="mb-3 text-lg font-semibold text-slate-900">
          At your stage
        </h2>
        {atYourStage.length === 0 ? (
          <p className="text-sm text-slate-600">
            No cases at your stage yet.
          </p>
        ) : (
          <CaseTable cases={atYourStage} />
        )}
      </section>

      <section className="mt-8">
        <h2 className="mb-3 text-lg font-semibold text-slate-900">
          All other cases
        </h2>
        {allOtherCases.length === 0 ? (
          <div>
            <p className="text-sm font-semibold text-slate-900">
              No other cases yet.
            </p>
            <p className="mt-1 text-sm text-slate-600">
              Cases at other stages will appear here as they move through the
              lifecycle.
            </p>
          </div>
        ) : (
          <CaseTable cases={allOtherCases} />
        )}
      </section>
    </div>
  );
}
