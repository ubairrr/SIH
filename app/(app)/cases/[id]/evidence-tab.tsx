import Link from "next/link";
import type { Document as PrismaDocument, DocumentVersion } from "@prisma/client";

import { prisma } from "@/app/lib/prisma";
import { TYPE_LABELS } from "@/app/lib/file-magic";
import { UploadTrigger } from "./upload-trigger";

// Same neutral badge class as DocumentsTab's Category badge.
const BADGE_CLASSES =
  "rounded-full border border-slate-300 bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700";

type EvidenceRow = PrismaDocument & {
  versions: DocumentVersion[];
  uploadedBy: { fullName: string };
};

function latestVersionOf(versions: DocumentVersion[]): DocumentVersion | undefined {
  return versions.reduce<DocumentVersion | undefined>((latest, current) => {
    if (!latest || current.versionNumber > latest.versionNumber) return current;
    return latest;
  }, undefined);
}

// D-10: `deletedAt: null` is load-bearing — a soft-deleted evidence item
// must never appear in this list (T-03-13). No Version column here, per
// 03-UI-SPEC.md's Component Inventory (Evidence columns: Type, Filename,
// Uploaded By, Date — Documents alone gets the Version column).
export async function EvidenceTab({
  caseId,
  isClosed,
}: {
  caseId: string;
  isClosed: boolean;
}) {
  const evidence = (await prisma.document.findMany({
    where: { caseId, kind: "EVIDENCE", deletedAt: null },
    include: { versions: true, uploadedBy: { select: { fullName: true } } },
    orderBy: { createdAt: "desc" },
  })) as EvidenceRow[];

  return (
    <div>
      <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Evidence
        </h2>
        {!isClosed && (
          <UploadTrigger caseId={caseId} kind="EVIDENCE" label="Upload evidence" />
        )}
      </div>

      {evidence.length === 0 ? (
        <div className="mt-4 rounded-lg border border-slate-200 bg-white p-8 text-center">
          <p className="text-slate-900">No evidence yet.</p>
          <p className="mt-1 text-sm text-slate-500">
            Upload a photo, video, audio, or forensic data file to get started.
          </p>
        </div>
      ) : (
        <div className="mt-4 overflow-x-auto rounded-lg border border-slate-200">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-3 py-2 text-left font-semibold text-slate-700">
                  Type
                </th>
                <th className="px-3 py-2 text-left font-semibold text-slate-700">
                  Filename
                </th>
                <th className="px-3 py-2 text-left font-semibold text-slate-700">
                  Uploaded By
                </th>
                <th className="px-3 py-2 text-left font-semibold text-slate-700">
                  Date
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {evidence.map((item) => {
                const latest = latestVersionOf(item.versions);
                const filename = latest?.originalFilename ?? item.title;
                return (
                  <tr key={item.id}>
                    <td className="px-3 py-2">
                      <span className={BADGE_CLASSES}>
                        {TYPE_LABELS[item.evidenceType ?? ""] ?? item.evidenceType}
                      </span>
                    </td>
                    <td className="max-w-[220px] px-3 py-2">
                      <Link
                        href={`/cases/${caseId}/documents/${item.id}`}
                        title={filename}
                        className="block truncate text-slate-800 underline hover:text-slate-900"
                      >
                        {filename}
                      </Link>
                    </td>
                    <td className="px-3 py-2 text-slate-700">
                      {item.uploadedBy.fullName}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2 text-slate-700">
                      {item.createdAt.toLocaleDateString()}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
