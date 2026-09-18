import Link from "next/link";

import { verifySession } from "@/app/lib/dal";
import { ROLE_LABELS } from "@/app/lib/role-display";

// D-13: a direct URL to a role-restricted page renders this explicit 403
// page instead of a silent redirect or a 404 — the point is to show judges
// the server refusing. Any authenticated user can reach this page; it is
// not itself role-gated.
export default async function AccessDeniedPage() {
  const user = await verifySession();

  return (
    <div className="mx-auto mt-16 flex max-w-md flex-col items-center gap-4 rounded-lg border border-red-200 bg-red-50 p-8 text-center">
      <h1 className="text-xl font-semibold text-red-800">Access denied.</h1>
      <p className="break-words text-sm text-red-800">
        Your role ({ROLE_LABELS[user.role]}) doesn&rsquo;t have access to
        this page.
      </p>
      <Link
        href="/dashboard"
        className="rounded-md bg-blue-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-600"
      >
        Go to Dashboard
      </Link>
    </div>
  );
}
