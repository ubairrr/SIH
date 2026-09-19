import { notFound } from "next/navigation";
import type { DocumentVersion } from "@prisma/client";

import { authorize } from "@/app/lib/authorize";
import { prisma } from "@/app/lib/prisma";
import { TYPE_LABELS } from "@/app/lib/file-magic";
import { getDocumentLogPage } from "@/app/actions/document-log";
import { PaginationControls } from "@/app/(app)/admin/log/pagination-controls";
import { BUTTON_CLASSES } from "../../case-detail-client";
import { DocumentMetadataCard } from "../../document-metadata-card";
import { VersionHistoryList } from "../../version-history-list";
import {
  DocumentActions,
  MediaPreview,
  type MediaKind,
} from "./document-viewer-client";

const LOG_PAGE_SIZE = 25;

function formatDetails(details: unknown): string {
  if (details === null || details === undefined) {
    return "—";
  }
  return JSON.stringify(details, null, 2);
}

function mediaKindOf(mimeType: string): MediaKind | "zip" | null {
  if (mimeType === "application/pdf") return "pdf";
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType.startsWith("video/")) return "video";
  if (mimeType.startsWith("audio/")) return "audio";
  if (
    mimeType === "application/zip" ||
    mimeType === "application/x-zip-compressed"
  ) {
    return "zip";
  }
  return null;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// D-15: the full-page viewer. Server Component following page.tsx's
// authorize() -> prisma.findUnique -> notFound() shape, extended for
// Document instead of Case. `?version=` (T-03-15) picks which
// DocumentVersion populates the preview frame — validated against this
// document's own already-fetched `versions` array, falling back to the
// current version for any non-matching value, never a raw array-index
// crash.
export default async function DocumentViewerPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string; docId: string }>;
  searchParams: Promise<{ version?: string; page?: string }>;
}) {
  const { id: caseId, docId } = await params;
  const session = await authorize();
  const resolvedSearchParams = await searchParams;

  const document = await prisma.document.findUnique({
    where: { id: docId },
    include: {
      case: true,
      versions: { orderBy: { versionNumber: "desc" } },
      uploadedBy: { select: { fullName: true } },
    },
  });

  if (!document || document.caseId !== caseId) {
    notFound();
  }

  // D-10 (Claude's discretion, per 03-UI-SPEC.md): a soft-deleted document
  // renders this dedicated notice — not notFound() — because the record
  // still exists in the case's change log, matching the project's core
  // value statement and giving a demoable soft-delete moment instead of an
  // ambiguous 404. Reuses the Access Denied page's centered-card shell.
  if (document.deletedAt) {
    return (
      <div className="mx-auto mt-16 flex max-w-md flex-col items-center gap-4 rounded-lg border border-slate-200 bg-white p-8 text-center">
        <h1 className="text-xl font-semibold text-slate-900">
          Document deleted.
        </h1>
        <p className="break-words text-sm text-slate-600">
          This document was deleted and its history is preserved in the
          case&rsquo;s change log.
        </p>
      </div>
    );
  }

  const isClosed = document.case.stage === "CLOSED_JUDGMENT";
  // D-08: only the uploading department (matched by role) or Admin can
  // change a document — enforced server-side already (document-guards.ts,
  // 03-02). This is the visible-hiding layer on top of that boundary, per
  // T-03-14.
  const canEdit =
    session.role === document.uploadedByRole || session.role === "ADMIN";

  const requestedVersionNumber = Number(resolvedSearchParams.version);
  const selectedVersion: DocumentVersion =
    document.versions.find(
      (v) => v.versionNumber === requestedVersionNumber,
    ) ?? document.versions[0];

  const typeKey = (document.category ?? document.evidenceType) as string;
  const typeLabel = TYPE_LABELS[typeKey] ?? typeKey;

  // ACC-04: every preview/download src points at the file-serving Route
  // Handler built in 03-02 — never a Supabase URL.
  const previewUrl = `/api/files/${selectedVersion.id}`;
  const downloadUrl = `/api/files/${selectedVersion.id}?download=1`;
  const mediaKind = mediaKindOf(selectedVersion.mimeType);

  // LOG-03/D-19/D-21: per-document change log, reusing change-log-tab.tsx's
  // exact table markup and PaginationControls, scoped to this document via
  // getDocumentLogPage instead of getCaseLogPage.
  const requestedPage = Number(resolvedSearchParams.page);
  const logPage =
    Number.isFinite(requestedPage) && requestedPage >= 1
      ? Math.floor(requestedPage)
      : 1;
  const { rows: logRows, total: logTotal } = await getDocumentLogPage({
    documentId: document.id,
    page: logPage,
    pageSize: LOG_PAGE_SIZE,
  });
  const logTotalPages = Math.max(1, Math.ceil(logTotal / LOG_PAGE_SIZE));

  return (
    <div className="mx-auto max-w-3xl px-6 py-8">
      <p className="font-mono text-xs text-slate-500">
        {document.case.firNumber}
      </p>
      <h1 className="break-words text-lg font-semibold text-slate-900">
        {selectedVersion.originalFilename}
      </h1>
      <p className="mt-1 text-sm text-slate-600">
        {typeLabel} — uploaded by {document.uploadedBy.fullName},{" "}
        {document.createdAt.toLocaleDateString()}
      </p>

      {mediaKind === "zip" || mediaKind === null ? (
        // D-16: non-previewable card — no embed attempted.
        <div className="mt-6 rounded-lg border border-slate-300 bg-white p-8 text-center">
          <p className="break-words text-sm font-medium text-slate-900">
            {selectedVersion.originalFilename}
          </p>
          <dl className="mt-4 grid grid-cols-2 gap-4 text-left text-sm">
            <div>
              <dt className="text-xs uppercase text-slate-500">Name</dt>
              <dd className="break-words text-slate-900">
                {selectedVersion.originalFilename}
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase text-slate-500">Type</dt>
              <dd className="text-slate-900">{typeLabel}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase text-slate-500">Size</dt>
              <dd className="text-slate-900">
                {formatBytes(selectedVersion.sizeBytes)}
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase text-slate-500">Uploader</dt>
              <dd className="text-slate-900">
                {document.uploadedBy.fullName}
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase text-slate-500">Date</dt>
              <dd className="text-slate-900">
                {document.createdAt.toLocaleDateString()}
              </dd>
            </div>
          </dl>
          <a
            href={downloadUrl}
            download
            className={`mt-6 inline-block ${BUTTON_CLASSES}`}
          >
            Download
          </a>
        </div>
      ) : (
        <div className="mt-6 rounded-lg border border-slate-300 bg-slate-100 p-6">
          <MediaPreview
            kind={mediaKind}
            previewUrl={previewUrl}
            downloadUrl={downloadUrl}
          />
        </div>
      )}

      {canEdit && !isClosed && (
        <DocumentActions
          caseId={caseId}
          documentId={document.id}
          kind={document.kind}
          filename={selectedVersion.originalFilename}
          existingDocument={{
            id: document.id,
            category: document.category,
            evidenceType: document.evidenceType,
            title: document.title,
          }}
        />
      )}

      <DocumentMetadataCard
        documentId={document.id}
        title={document.title}
        description={document.description}
        typeLabel={typeLabel}
        isCategory={document.category !== null}
        canEdit={canEdit && !isClosed}
      />

      <VersionHistoryList
        caseId={caseId}
        documentId={document.id}
        versions={document.versions}
      />

      <div className="mt-8">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Change Log
        </h2>

        {logTotal === 0 ? (
          <div className="mt-3 rounded-lg border border-slate-200 bg-white p-8 text-center">
            <p className="text-slate-900">
              No changes recorded yet for this document.
            </p>
          </div>
        ) : (
          <>
            <div className="mt-3 overflow-x-auto rounded-lg border border-slate-200">
              <table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-3 py-2 text-left font-semibold text-slate-700">
                      Time
                    </th>
                    <th className="px-3 py-2 text-left font-semibold text-slate-700">
                      Actor
                    </th>
                    <th className="px-3 py-2 text-left font-semibold text-slate-700">
                      Role
                    </th>
                    <th className="px-3 py-2 text-left font-semibold text-slate-700">
                      Action
                    </th>
                    <th className="px-3 py-2 text-left font-semibold text-slate-700">
                      Target
                    </th>
                    <th className="px-3 py-2 text-left font-semibold text-slate-700">
                      Details
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {logRows.map((row) => (
                    <tr key={row.id.toString()}>
                      <td className="whitespace-nowrap px-3 py-2 text-slate-700">
                        {row.createdAt.toLocaleString()}
                      </td>
                      <td
                        className="max-w-[160px] truncate px-3 py-2 text-slate-900"
                        title={row.actor.fullName}
                      >
                        {row.actor.fullName}
                      </td>
                      <td className="px-3 py-2 text-slate-700">
                        {row.actorRole}
                      </td>
                      <td className="px-3 py-2 font-mono text-xs text-slate-700">
                        {row.action}
                      </td>
                      <td
                        className="max-w-[160px] truncate px-3 py-2 text-slate-700"
                        title={row.targetLabel || undefined}
                      >
                        {row.targetLabel || "—"}
                      </td>
                      <td className="max-w-xs px-3 py-2">
                        <div className="max-h-32 overflow-y-auto whitespace-pre-wrap break-all font-mono text-xs text-slate-500">
                          {formatDetails(row.details)}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <PaginationControls
              page={logPage}
              totalPages={logTotalPages}
              basePath={`/cases/${caseId}/documents/${document.id}?`}
            />
          </>
        )}
      </div>
    </div>
  );
}
