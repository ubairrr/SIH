"use server";

import { authorize } from "@/app/lib/authorize";
import { prisma } from "@/app/lib/prisma";
import { summarizeTamperResult } from "@/app/lib/audit-guards";

export type AuditLogRow = {
  id: bigint;
  actorRole: string;
  action: string;
  targetType: string;
  targetId: string;
  targetLabel: string;
  details: unknown;
  createdAt: Date;
  actor: { fullName: string };
};

// LOG-04/D-14: system-wide, newest-first, paginated audit log for Admin. No
// filter parameters accepted (filtering is v2 INTG-02). authorize() runs
// first so a non-Admin caller is redirected before any query executes.
export async function getAuditLogPage({
  page,
  pageSize,
}: {
  page: number;
  pageSize: number;
}): Promise<{ rows: AuditLogRow[]; total: number }> {
  await authorize({ role: "ADMIN" });

  const [rows, total] = await Promise.all([
    prisma.auditLog.findMany({
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: { actor: { select: { fullName: true } } },
    }),
    prisma.auditLog.count(),
  ]);

  return { rows, total };
}

export type TamperTestResult = {
  ranAgainstRow: bigint | null;
  updateError?: string;
  deleteError?: string;
  rowUnchanged?: boolean;
  tamperSucceeded?: boolean;
};

function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

// LOG-02/D-13: attempts one hard-coded UPDATE and one hard-coded DELETE
// against the most recent real AuditLog row and surfaces Postgres's
// verbatim rejection for both. Statement text is always a literal — only
// the internally-selected row id (bigint, never client input) varies, via
// $executeRaw tagged-template parameterization (never string
// concatenation), so this can never become an arbitrary-SQL endpoint
// (T-03-02).
export async function testTamperProtection(): Promise<TamperTestResult> {
  await authorize({ role: "ADMIN" });

  const row = await prisma.auditLog.findFirst({ orderBy: { id: "desc" } });
  if (!row) {
    return { ranAgainstRow: null };
  }

  let updateThrew = false;
  let updateError: string | undefined;
  try {
    await prisma.$executeRaw`UPDATE "AuditLog" SET action = 'TAMPER_TEST' WHERE id = ${row.id}`;
  } catch (err) {
    updateThrew = true;
    updateError = errorMessage(err);
  }

  let deleteThrew = false;
  let deleteError: string | undefined;
  try {
    await prisma.$executeRaw`DELETE FROM "AuditLog" WHERE id = ${row.id}`;
  } catch (err) {
    deleteThrew = true;
    deleteError = errorMessage(err);
  }

  const after = await prisma.auditLog.findUnique({ where: { id: row.id } });
  const rowUnchanged =
    after !== null &&
    after.actorId === row.actorId &&
    after.actorRole === row.actorRole &&
    after.action === row.action &&
    after.targetType === row.targetType &&
    after.targetId === row.targetId &&
    after.targetLabel === row.targetLabel &&
    JSON.stringify(after.details) === JSON.stringify(row.details) &&
    after.createdAt.getTime() === row.createdAt.getTime();

  const { tamperSucceeded } = summarizeTamperResult({
    updateThrew,
    deleteThrew,
  });

  if (!tamperSucceeded) {
    return {
      ranAgainstRow: row.id,
      updateError,
      deleteError,
      rowUnchanged: true,
    };
  }

  // Unexpected success — the row was actually mutated or deleted. Kept as a
  // distinct branch from the success-rejection path above (never silently
  // folded into it) so the demo can surface an honest failure state.
  return {
    ranAgainstRow: row.id,
    updateError,
    deleteError,
    rowUnchanged,
    tamperSucceeded: true,
  };
}
