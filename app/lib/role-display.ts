import type { Role } from "@prisma/client";

// D-15: per-role badge colors — Police blue, Forensics teal, Prosecution
// amber, Court maroon, Admin slate.
export const ROLE_BADGE_CLASSES: Record<Role, string> = {
  POLICE: "bg-blue-900/60 text-blue-200 border border-blue-700",
  FORENSICS: "bg-teal-900/60 text-teal-200 border border-teal-700",
  PROSECUTION: "bg-amber-900/60 text-amber-200 border border-amber-700",
  COURT: "bg-rose-950/60 text-rose-200 border border-rose-800",
  ADMIN: "bg-slate-700/60 text-slate-200 border border-slate-500",
};

export const ROLE_LABELS: Record<Role, string> = {
  POLICE: "Police",
  FORENSICS: "Forensics",
  PROSECUTION: "Prosecution",
  COURT: "Court",
  ADMIN: "Admin",
};

export type NavLink = { href: string; label: string };

// D-16: each role's nav contains only its own links. Admin gets Users + Log;
// each department role gets Dashboard. Phase 2 adds "Register FIR" for
// Police/Admin (D-12: only Police/Admin can register an FIR) — the Admin
// dashboard redirect removal is Plan 02-03's job, this only adds the nav
// entry.
export function navLinksForRole(role: Role): NavLink[] {
  if (role === "ADMIN") {
    return [
      { href: "/admin/users", label: "Users" },
      { href: "/admin/log", label: "Change Log" },
      { href: "/cases/new", label: "Register FIR" },
    ];
  }
  if (role === "POLICE") {
    return [
      { href: "/dashboard", label: "Dashboard" },
      { href: "/cases/new", label: "Register FIR" },
    ];
  }
  return [{ href: "/dashboard", label: "Dashboard" }];
}
