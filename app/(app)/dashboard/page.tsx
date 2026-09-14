import { verifySession } from "@/app/lib/dal";

// Task 1 tracer scope: minimal proof the role-scoped shell renders after
// login. Task 2 replaces this body with the per-role empty-state dashboard
// (D-16) — this page is not restructured, only its contents change.
export default async function DashboardPage() {
  const user = await verifySession();

  return (
    <div>
      <h1 className="text-lg font-semibold text-white">
        Logged in as {user.role}
      </h1>
    </div>
  );
}
