import "server-only";

import { redirect } from "next/navigation";
import type { Role } from "@prisma/client";

import { verifySession } from "@/app/lib/dal";

type Session = Awaited<ReturnType<typeof verifySession>>;

type AuthorizeOptions = {
  /** Already-resolved session, if the caller already has one (avoids a
   * redundant verifySession() call). Omit to have authorize() resolve it. */
  session?: Session;
  /** Role(s) allowed to proceed. Omit to allow any authenticated user. */
  role?: Role | Role[];
  /** Optional label for the action being guarded, used only in error text. */
  action?: string;
};

// The single chokepoint every Server Action, Route Handler, and role-scoped
// page in this and every future phase must call first. proxy.ts is
// optimistic-UX-only (cookie decode, no DB call) and is never the
// authority — this function always re-reads the caller's CURRENT role from
// the database via verifySession() (never a cached/JWT value) before
// deciding.
//
// Phase 1 ships the role-only version. Phase 2 extends this with a
// case-stage dimension once the Case model exists — this signature is
// designed to grow an optional `stage` parameter without a rebuild.
export async function authorize(
  options: AuthorizeOptions = {},
): Promise<Session> {
  const currentSession = options.session ?? (await verifySession());

  if (options.role) {
    const allowedRoles = Array.isArray(options.role)
      ? options.role
      : [options.role];
    if (!allowedRoles.includes(currentSession.role)) {
      redirect("/dashboard");
    }
  }

  return currentSession;
}
