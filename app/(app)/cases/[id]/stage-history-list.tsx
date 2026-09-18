import type { Role, Stage } from "@prisma/client";

import { ROLE_LABELS, STAGE_LABELS } from "@/app/lib/role-display";

export type StageHistoryRow = {
  id: string;
  toStage: Stage;
  actorRole: Role;
  remark: string | null;
  createdAt: Date;
  actor: { fullName: string };
};

function formatDateTime(date: Date): string {
  return date.toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

// 02-UI-SPEC.md "Stage history list": divide-y rows, stage name bold left,
// actor/role/date on the right, and a conditional remark line — E6 "partial"
// never renders an empty remark line, and reopen rows show the reopening
// reason as the remark (reopenCase writes it into StageHistory.remark, same
// column as every other move).
export function StageHistoryList({ rows }: { rows: StageHistoryRow[] }) {
  return (
    <div className="divide-y divide-slate-200">
      {rows.map((row) => (
        <div key={row.id} className="py-3 first:pt-0 last:pb-0">
          <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
            <p className="text-sm font-semibold text-slate-900">
              {STAGE_LABELS[row.toStage]}
            </p>
            <p className="text-xs text-slate-500">
              {row.actor.fullName} · {ROLE_LABELS[row.actorRole]} ·{" "}
              {formatDateTime(row.createdAt)}
            </p>
          </div>
          {row.remark && (
            <p className="mt-1 break-words text-sm text-slate-600">
              {row.remark}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}
