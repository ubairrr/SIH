"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

// E7 zero-one-many: hidden entirely when there is <=1 page (caller already
// skips rendering this when totalPages <= 1, this is a defensive second
// check). E7 loading backstop: buttons disable while navigation is in
// flight via useTransition's isPending.
export function PaginationControls({
  page,
  totalPages,
}: {
  page: number;
  totalPages: number;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  if (totalPages <= 1) {
    return null;
  }

  function goTo(nextPage: number) {
    startTransition(() => {
      router.push(`/admin/log?page=${nextPage}`);
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
