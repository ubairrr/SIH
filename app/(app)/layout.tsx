import Link from "next/link";

import { verifySession } from "@/app/lib/dal";
import { logout } from "@/app/actions/auth";
import {
  ROLE_BADGE_CLASSES,
  ROLE_LABELS,
  navLinksForRole,
} from "@/app/lib/role-display";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await verifySession();
  const navLinks = navLinksForRole(user.role);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="flex items-center justify-between border-b border-slate-800 bg-slate-900 px-6 py-4">
        <div className="flex items-center gap-4">
          <div>
            <p className="text-sm font-semibold tracking-wide text-white">
              CaseVault — Secure Case Records
            </p>
            <p className="text-xs text-slate-400">
              {user.role === "ADMIN"
                ? ROLE_LABELS.ADMIN
                : `${ROLE_LABELS[user.role]} — ${user.unit}`}
            </p>
          </div>
          <span
            className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${ROLE_BADGE_CLASSES[user.role]}`}
          >
            {ROLE_LABELS[user.role]}
          </span>
        </div>

        <nav className="flex items-center gap-4">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm text-slate-300 transition hover:text-white"
            >
              {link.label}
            </Link>
          ))}
          <form action={logout}>
            <button
              type="submit"
              className="rounded-md border border-slate-700 px-3 py-1.5 text-sm text-slate-200 transition hover:bg-slate-800"
            >
              Logout
            </button>
          </form>
        </nav>
      </header>
      <main className="px-6 py-8">{children}</main>
    </div>
  );
}
