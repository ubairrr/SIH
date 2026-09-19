"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

// E7 zero-one-many: hidden entirely when there is <=1 page (caller already
// skips rendering this when totalPages <= 1, this is a defensive second
// check). E7 loading backstop: buttons disable while navigation is in
// flight via useTransition's isPending.
//
// 03-03: `basePath` generalizes the formerly-hardcoded `/admin/log?page=`
// prefix so this component is reusable by ChangeLogTab. It is the URL up to
// and including the query-string separator right before the "page=" key —
// the default `"/admin/log?"` reproduces the exact previous href
// (`/admin/log?page=${n}`) with no new required prop, so the existing Admin
// Log call site is unchanged. ChangeLogTab passes
// `basePath={`/cases/${caseId}?tab=change-log&`}` to land on
// `/cases/{id}?tab=change-log&page={n}`.
export function PaginationControls({
  page,
  totalPages,
  basePath = "/admin/log?",
}: {
  page: number;
  totalPages: number;
  basePath?: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  if (totalPages <= 1) {
    return null;
  }

  function goTo(nextPage: number) {
    startTransition(() => {
      router.push(`${basePath}page=${nextPage}`);
    });
  }

  return (
    <div className="mt-4 flex items-center justify-between text-sm text-slate-700">
      <button
        type="button"
        onClick={() => goTo(page - 1)}
        disabled={isPending || page <= 1}
        className="rounded-md border border-slate-300 px-3 py-1 transition hover:bg-slate-100 disabled:opacity-50"
      >
        ← Previous
      </button>
      <span>
        Page {page} of {totalPages}
      </span>
      <button
        type="button"
        onClick={() => goTo(page + 1)}
        disabled={isPending || page >= totalPages}
        className="rounded-md border border-slate-300 px-3 py-1 transition hover:bg-slate-100 disabled:opacity-50"
      >
        Next →
      </button>
    </div>
  );
}
