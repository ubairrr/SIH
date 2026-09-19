"use server";

import { authorize } from "@/app/lib/authorize";
import { prisma } from "@/app/lib/prisma";
import type { AuditLogRow } from "@/app/actions/audit";

// D-20: everyone who can see the case can see its logs — no role
// restriction, unlike getAuditLogPage's ADMIN-only gate. authorize() still
// runs first so only an authenticated session can query.

// Rows whose `details` JSON contains this caseId, OR whose targetType/
// targetId directly identify the Case row itself (e.g. CASE_REGISTERED,
// STAGE_ADVANCED), unioned and re-sorted/re-paginated in application code
// since Prisma cannot express a cross-condition OR + paginate in one
// findMany when the two branches need different filters merged.
export async function getCaseLogPage({
  caseId,
  page,
  pageSize,
}: {
  caseId: string;
  page: number;
  pageSize: number;
}): Promise<{ rows: AuditLogRow[]; total: number }> {
  await authorize();

  const where = {
    OR: [
      { details: { path: ["caseId"], equals: caseId } },
      { targetType: "Case", targetId: caseId },
    ],
  };

  const [rows, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: { actor: { select: { fullName: true } } },
    }),
    prisma.auditLog.count({ where }),
  ]);

  return { rows, total };
}

export async function getDocumentLogPage({
  documentId,
  page,
  pageSize,
}: {
  documentId: string;
  page: number;
  pageSize: number;
}): Promise<{ rows: AuditLogRow[]; total: number }> {
  await authorize();

  const where = {
    targetType: "Document",
    targetId: documentId,
  };

  const [rows, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: { actor: { select: { fullName: true } } },
    }),
    prisma.auditLog.count({ where }),
  ]);

  return { rows, total };
}
