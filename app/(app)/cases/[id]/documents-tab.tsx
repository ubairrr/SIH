import Link from "next/link";
import type { Document as PrismaDocument, DocumentVersion } from "@prisma/client";

import { prisma } from "@/app/lib/prisma";
import { TYPE_LABELS } from "@/app/lib/file-magic";
import { UploadTrigger } from "./upload-trigger";

// Neutral category/type badge — never accent-colored, per 03-UI-SPEC.md's
// Component Inventory ("Category/type badge").
const BADGE_CLASSES =
  "rounded-full border border-slate-300 bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700";

type DocumentRow = PrismaDocument & {
  versions: DocumentVersion[];
  uploadedBy: { fullName: string };
};

function latestVersionOf(versions: DocumentVersion[]): DocumentVersion | undefined {
  return versions.reduce<DocumentVersion | undefined>((latest, current) => {
    if (!latest || current.versionNumber > latest.versionNumber) return current;
    return latest;
  }, undefined);
}

// UI Considerations zero-one-many resolution (E3): a single-version document
// shows plain "v1"; n>1 shows "v{n} ({n} versions) — View history" linking
// to the full-page viewer (03-05), whose version history list lives below
// the metadata card on that same page.
function VersionCell({
  caseId,
  documentId,
  versions,
}: {
  caseId: string;
  documentId: string;
  versions: DocumentVersion[];
}) {
  const count = versions.length;
  if (count <= 1) {
    return <span className="text-slate-700">v1</span>;
  }
  return (
    <Link
      href={`/cases/${caseId}/documents/${documentId}`}
      className="text-slate-700 underline hover:text-slate-900"
    >
      v{count} ({count} versions) — View history
    </Link>
  );
}

// D-10: `deletedAt: null` is load-bearing — a soft-deleted document must
// never appear in this list (T-03-13).
export async function DocumentsTab({
  caseId,
  isClosed,
}: {
  caseId: string;
  isClosed: boolean;
}) {
  const documents = (await prisma.document.findMany({
    where: { caseId, kind: "DOCUMENT", deletedAt: null },
    include: { versions: true, uploadedBy: { select: { fullName: true } } },
    orderBy: { createdAt: "desc" },
  })) as DocumentRow[];

  return (
    <div>
      <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Documents
        </h2>
        {!isClosed && (
          <UploadTrigger caseId={caseId} kind="DOCUMENT" label="Upload document" />
        )}
      </div>

      {documents.length === 0 ? (
        <div className="mt-4 rounded-lg border border-slate-200 bg-white p-8 text-center">
          <p className="text-slate-900">No documents yet.</p>
          <p className="mt-1 text-sm text-slate-500">Upload a document to get started.</p>
        </div>
      ) : (
        <div className="mt-4 overflow-x-auto rounded-lg border border-slate-200">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-3 py-2 text-left font-semibold text-slate-700">
                  Category
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
                <th className="px-3 py-2 text-left font-semibold text-slate-700">
                  Version
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {documents.map((doc) => {
                const latest = latestVersionOf(doc.versions);
                const filename = latest?.originalFilename ?? doc.title;
                return (
                  <tr key={doc.id}>
                    <td className="px-3 py-2">
                      <span className={BADGE_CLASSES}>
                        {TYPE_LABELS[doc.category ?? ""] ?? doc.category}
                      </span>
                    </td>
                    <td className="max-w-[220px] px-3 py-2">
                      <Link
                        href={`/cases/${caseId}/documents/${doc.id}`}
                        title={filename}
                        className="block truncate text-slate-800 underline hover:text-slate-900"
                      >
                        {filename}
                      </Link>
                    </td>
                    <td className="px-3 py-2 text-slate-700">
                      {doc.uploadedBy.fullName}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2 text-slate-700">
                      {doc.createdAt.toLocaleDateString()}
                    </td>
                    <td className="px-3 py-2">
                      <VersionCell
                        caseId={caseId}
                        documentId={doc.id}
                        versions={doc.versions}
                      />
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
