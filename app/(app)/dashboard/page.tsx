import { redirect } from "next/navigation";

import { authorize } from "@/app/lib/authorize";

// D-16: per-role empty-state dashboard shell. Phase 2 fills this same page
// with real case data — do not restructure it later. Admin has no case
// queue of its own in Phase 1, so it lands on the Users page instead
// (Claude's discretion per 01-CONTEXT.md).
export default async function DashboardPage() {
  const user = await authorize();

  if (user.role === "ADMIN") {
    redirect("/admin/users");
  }

  return (
    <div>
      <h1 className="text-lg font-semibold text-white">Dashboard</h1>
      <p className="mt-4 text-slate-400">No cases at your stage yet.</p>
    </div>
  );
}
