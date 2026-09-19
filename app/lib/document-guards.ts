import type { Role } from "@prisma/client";

import { ROLE_LABELS } from "./role-display";

// Pure, side-effect-free guard functions with no Prisma/Next imports — run
// under plain node:test with no Next.js request context. Server Actions in
// app/actions/documents.ts call these with a live, in-transaction re-fetch
// of the case/document's current state, never a stale client-supplied one.

/**
 * D-08: only the department that uploaded a document (its uploaderRole) or
 * Admin can change it — version it, edit its metadata, or delete it.
 */
export function assertDocumentOwner(role: Role, uploaderRole: Role): void {
  if (role !== uploaderRole && role !== "ADMIN") {
    throw new Error(
      `Only ${ROLE_LABELS[uploaderRole]} (the uploading department) or Admin can change this document.`,
    );
  }
}

/**
 * D-11: no document may be added, versioned, edited, or deleted once a case
 * reaches CLOSED_JUDGMENT.
 */
export function assertCaseNotClosedForDocs(stage: string): void {
  if (stage === "CLOSED_JUDGMENT") {
    throw new Error(
      "This case is closed and no documents can be added, versioned, edited, or deleted.",
    );
  }
}

/**
 * A document can only be soft-deleted once — re-running the delete on an
 * already-deleted document is rejected rather than writing a duplicate
 * DOCUMENT_DELETED log row.
 */
export function assertNotAlreadyDeleted(deletedAt: Date | null): void {
  if (deletedAt !== null) {
    throw new Error("This document has already been deleted.");
  }
}

/**
 * D-04/D-09: the uploaded bytes' magic-byte-detected mime type must be in
 * the allow-list for the document's category/evidenceType. Callers pass the
 * allowed mime list and the human-readable label (D-09: for a new version
 * this MUST be the existing document's own category/evidenceType, never a
 * client-supplied one).
 */
export function assertAllowedTypeForCategory(
  allowedMimes: string[],
  expectedLabel: string,
  detectedMime: string | null,
): void {
  if (!detectedMime || !allowedMimes.includes(detectedMime)) {
    throw new Error(
      `File content is not a valid ${expectedLabel} (detected: ${detectedMime ?? "unknown"}).`,
    );
  }
}
