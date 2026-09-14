import { authorize } from "@/app/lib/authorize";

// Stub for Plan 01-03 (system-wide audit log viewer, D-14). Exists in Plan
// 01-01 solely to prove the server-side role gate — see admin/users/page.tsx.
export default async function AdminLogPage() {
  await authorize({ role: "ADMIN" });

  return (
    <div>
      <h1 className="text-lg font-semibold text-white">Change Log</h1>
      <p className="mt-4 text-slate-400">
        The system-wide audit log viewer arrives in a later plan.
      </p>
    </div>
  );
}
