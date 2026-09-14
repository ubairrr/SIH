import type { Role } from "@prisma/client";

// D-09: pure, side-effect-free guard functions with no Prisma/Next imports —
// run under plain node:test with no Next.js request context. The Server
// Actions in app/actions/users.ts call these with a live, in-transaction
// prisma.user.count() read, never a stale pre-transaction count.

/**
 * Rejects an admin action that targets the acting admin's own account
 * (self-lockout guard).
 */
export function assertNotSelfTarget(actorId: string, targetId: string): void {
  if (actorId === targetId) {
    throw new Error("You cannot perform this action on your own account.");
  }
}

/**
 * Rejects a mutation that would remove Admin status from the last
 * remaining active Admin — covers both deactivating the last active Admin
 * and demoting the last active Admin to a non-Admin role.
 */
export function assertNotLastActiveAdmin(input: {
  targetRole: Role;
  targetIsActive: boolean;
  activeAdminCount: number;
  removesAdminStatus: boolean;
}): void {
  const { targetRole, targetIsActive, activeAdminCount, removesAdminStatus } =
    input;

  if (
    targetRole === "ADMIN" &&
    targetIsActive &&
    activeAdminCount <= 1 &&
    removesAdminStatus
  ) {
    throw new Error(
      "The last active Admin account cannot be deactivated or demoted.",
    );
  }
}
