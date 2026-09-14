"use server";

import { authorize } from "@/app/lib/authorize";
import { prisma } from "@/app/lib/prisma";

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
