import type { Stage } from "@prisma/client";

import { STAGE_ORDER } from "@/app/lib/case-guards";
import { STAGE_LABELS } from "@/app/lib/role-display";

// 02-UI-SPEC.md "5-stage horizontal timeline": filled dot + solid connector
// for completed steps, a larger ringed dot for the current step, and a
// hollow dot + dashed connector for future steps. Wrapped in flex-wrap so it
// never causes horizontal page scroll on narrow viewports (E5).
export function StageTimeline({ currentStage }: { currentStage: Stage }) {
  const currentIndex = STAGE_ORDER.indexOf(currentStage);

  return (
    <div className="flex flex-wrap items-start gap-2">
      {STAGE_ORDER.map((stage, index) => {
        const isCompleted = index < currentIndex;
        const isCurrent = index === currentIndex;
        const connectorSolid = index < currentIndex;

        return (
          <div key={stage} className="flex items-center gap-2">
            <div className="flex w-20 flex-col items-center gap-1 text-center">
              {isCurrent ? (
                <span className="h-4 w-4 rounded-full border-2 border-blue-700 bg-blue-700 ring-4 ring-blue-100" />
              ) : isCompleted ? (
                <span className="h-3 w-3 rounded-full bg-blue-700" />
              ) : (
                <span className="h-3 w-3 rounded-full border-2 border-slate-300 bg-white" />
              )}
              <span
                className={
                  isCurrent
                    ? "text-xs font-semibold text-slate-900"
                    : isCompleted
                      ? "text-xs font-medium text-slate-700"
                      : "text-xs font-medium text-slate-400"
                }
              >
                {STAGE_LABELS[stage]}
              </span>
            </div>
            {index < STAGE_ORDER.length - 1 && (
              <span
                className={
                  connectorSolid
                    ? "h-0 w-10 border-t-2 border-slate-300"
                    : "h-0 w-10 border-t-2 border-dashed border-slate-300"
                }
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
