import { verifySession } from "@/app/lib/dal";
import { logout } from "@/app/actions/auth";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await verifySession();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="flex items-center justify-between border-b border-slate-800 bg-slate-900 px-6 py-4">
        <div>
          <p className="text-sm font-semibold tracking-wide text-white">
            CaseVault — Secure Case Records
          </p>
          <p className="text-xs text-slate-400">
            {user.role === "ADMIN" ? "Admin" : `${user.role} — ${user.unit}`}
          </p>
        </div>
        <form action={logout}>
          <button
            type="submit"
            className="rounded-md border border-slate-700 px-3 py-1.5 text-sm text-slate-200 transition hover:bg-slate-800"
          >
            Logout
          </button>
        </form>
      </header>
      <main className="px-6 py-8">{children}</main>
    </div>
  );
}
