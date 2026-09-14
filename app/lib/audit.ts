import "server-only";

import type { Prisma, Role } from "@prisma/client";

export type AuditLogEntry = {
  actorId: string;
  actorRole: Role;
  /**
   * Action code, e.g. "USER_CREATED", "USER_ROLE_CHANGED",
   * "USER_DEACTIVATED", "USER_REACTIVATED", "USER_PASSWORD_RESET" (D-10).
   * Stays a plain string (validated by an app-level Zod union at the
   * caller), never a native Postgres enum — see RESEARCH.md Alternatives
   * Considered: extensible without a schema migration per new action code.
   */
  action: string;
  targetType: string;
  targetId: string;
  /** Readable snapshot of the target at the time of the action. */
  targetLabel: string;
  /**
   * Arbitrary JSON details for the entry. MUST NEVER contain a password or
   * password hash (D-03) — callers are responsible for excluding those
   * fields before passing details here.
   */
  details?: Prisma.InputJsonValue;
};

// D-12: log writes happen inside the SAME DB transaction as the mutation
// they describe — always takes a Prisma.TransactionClient, never the bare
// `prisma` client, so a mutation without its log entry is impossible.
//
// No callers exist yet in Phase 1 Plan 01-01 — Plan 01-02/01-03's
// createUser/deactivateUser/changeRole/resetPassword Server Actions are the
// first consumers. This file exists now so every future mutation shares one
// import path.
export async function writeAuditLog(
  tx: Prisma.TransactionClient,
  entry: AuditLogEntry,
): Promise<void> {
  await tx.auditLog.create({ data: entry });
}
