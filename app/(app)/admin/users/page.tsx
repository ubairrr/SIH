import { authorize } from "@/app/lib/authorize";

// Stub for Plan 01-02 (Admin user management). Exists in Plan 01-01 solely
// to prove the server-side role gate: authorize({ role: "ADMIN" }) below
// redirects any non-Admin requester to /dashboard, not just hides a nav
// link (AUTH-03, D-16).
export default async function AdminUsersPage() {
  await authorize({ role: "ADMIN" });

  return (
    <div>
      <h1 className="text-lg font-semibold text-white">Users</h1>
      <p className="mt-4 text-slate-400">
        User management arrives in the next plan.
      </p>
    </div>
  );
}
