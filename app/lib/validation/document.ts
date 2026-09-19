import { z } from "zod";

import { ALLOWED_MIME_BY_TYPE, TYPE_LABELS } from "../file-magic";

// D-05/D-03: fixed lists mirroring the DocumentKind/DocumentCategory/
// EvidenceType Prisma enums exactly.
export const documentKindEnum = z.enum(["DOCUMENT", "EVIDENCE"]);

export const documentCategoryEnum = z.enum([
  "FIR",
  "WITNESS_STATEMENT",
  "INVESTIGATION_RECORD",
  "CHARGE_SHEET",
  "COURT_FILING",
  "FORENSIC_REPORT",
  "LEGAL_NOTICE",
  "JUDGMENT",
]);

export const evidenceTypeEnum = z.enum([
  "PHOTO",
  "VIDEO_CCTV",
  "AUDIO",
  "FORENSIC_DATA",
]);

// Task 1 checkpoint (2026-09-19): confirmed Supabase project is on the FREE
// tier — 50 MB global upload cap. Per Task 1's decision rule, video and ZIP
// are lowered to 45 MB (headroom below the 50 MB platform ceiling); PDF/
// image/audio stay at D-02's original numbers (already well under 50 MB).
// Compared in whole bytes (limitMB * 1024 * 1024), inclusive <=, never a
// rounded/truncated MB comparison.
export const SIZE_LIMIT_MB_BY_TYPE = {
  pdf: 20,
  image: 10,
  audio: 25,
  video: 45,
  zip: 45,
} as const;

export type SizeLimitFileType = keyof typeof SIZE_LIMIT_MB_BY_TYPE;

export function sizeLimitBytes(fileType: SizeLimitFileType): number {
  return SIZE_LIMIT_MB_BY_TYPE[fileType] * 1024 * 1024;
}

export function mimeToSizeLimitType(mime: string): SizeLimitFileType | null {
  if (mime === "application/pdf") return "pdf";
  if (mime.startsWith("image/")) return "image";
  if (mime.startsWith("audio/")) return "audio";
  if (mime.startsWith("video/")) return "video";
  if (mime === "application/zip" || mime === "application/x-zip-compressed") return "zip";
  return null;
}

// D-01: requestUploadSchema's declared size/mime are client-supplied and are
// advisory only for fast UX feedback — never authoritative. 03-02's
// finalizeUpload re-reads real bytes from storage and never trusts these
// fields (T-03-03).
export const requestUploadSchema = z
  .object({
    caseId: z.string().min(1),
    // 03-02: present only when requesting a signed target for a NEW VERSION
    // of an existing document — used purely to shape the storage key path
    // (cases/{caseId}/{documentId}/v{n}-{uuid}), never to skip finalizeUpload's
    // authoritative re-fetch of the existing document's own category/type.
    documentId: z.string().uuid().optional(),
    kind: documentKindEnum,
    category: documentCategoryEnum.optional(),
    evidenceType: evidenceTypeEnum.optional(),
    declaredSize: z.number().int().positive(),
    declaredMime: z.string().min(1),
    title: z.string().min(1, "Title is required").max(200),
    description: z.string().max(2000).optional(),
  })
  .refine(
    (value) =>
      (value.kind === "DOCUMENT" && value.category != null && value.evidenceType == null) ||
      (value.kind === "EVIDENCE" && value.evidenceType != null && value.category == null),
    {
      message: "Exactly one of category/evidenceType must be set, matching kind",
      path: ["kind"],
    },
  )
  .refine(
    (value) => {
      const limitType = mimeToSizeLimitType(value.declaredMime);
      if (!limitType) return false;
      return value.declaredSize <= sizeLimitBytes(limitType);
    },
    {
      message: "Declared size exceeds this file type's size limit",
      path: ["declaredSize"],
    },
  );

export type RequestUploadInput = z.infer<typeof requestUploadSchema>;

// D-07: every new version (documentId present) requires a non-empty
// changeNote — 03-02's finalizeUpload records it into the version row and
// the DOCUMENT_VERSION_ADDED log details. v1 has no documentId yet, so no
// change note is required there.
export const finalizeUploadSchema = z
  .object({
    caseId: z.string().min(1),
    documentId: z.string().min(1).nullable(),
    storageKey: z.string().min(1),
    // Required so DocumentVersion.originalFilename (a required DB column)
    // reflects the browser's actual File.name, never the document's title.
    // WR-04: capped at 255 chars — this value is later echoed back into the
    // Content-Disposition response header.
    originalFilename: z.string().min(1).max(255),
    title: z.string().min(1, "Title is required").max(200),
    description: z.string().max(2000).optional(),
    changeNote: z.string().max(1000).optional(),
    // Only meaningful (and required) when documentId is null — a new
    // document's category/evidenceType. For a new version, D-09 requires
    // finalizeUpload to validate against the EXISTING document's own
    // category/evidenceType, re-fetched server-side — these fields are
    // ignored in that path even if a client sends them.
    kind: documentKindEnum.optional(),
    category: documentCategoryEnum.optional(),
    evidenceType: evidenceTypeEnum.optional(),
  })
  .refine(
    (value) =>
      value.documentId == null ||
      (value.changeNote != null && value.changeNote.trim().length > 0),
    {
      message: "A change note is required when adding a new version",
      path: ["changeNote"],
    },
  )
  .refine(
    (value) =>
      value.documentId != null ||
      (value.kind === "DOCUMENT" && value.category != null && value.evidenceType == null) ||
      (value.kind === "EVIDENCE" && value.evidenceType != null && value.category == null),
    {
      message: "Exactly one of category/evidenceType must be set, matching kind, for a new upload",
      path: ["kind"],
    },
  );

export type FinalizeUploadInput = z.infer<typeof finalizeUploadSchema>;

export const updateDocumentMetadataSchema = z.object({
  documentId: z.string().min(1),
  title: z.string().min(1, "Title is required").max(200),
  description: z.string().max(2000).optional(),
});

export type UpdateDocumentMetadataInput = z.infer<typeof updateDocumentMetadataSchema>;

// Mirrors reopenCaseSchema's required-reason shape exactly.
export const softDeleteDocumentSchema = z.object({
  documentId: z.string().min(1),
  reason: z.string().min(1, "A reason is required").max(1000),
});

export type SoftDeleteDocumentInput = z.infer<typeof softDeleteDocumentSchema>;

export type ClientPrecheckResult = { ok: true } | { ok: false; message: string };

// Short, human-readable label per allowed mime — used only to render the
// Copywriting Contract's "Allowed: {list}." sentence; never used for
// detection logic (that stays magic-byte-based, server-side, in file-magic.ts).
const MIME_SHORT_LABELS: Record<string, string> = {
  "application/pdf": "PDF",
  "image/jpeg": "JPEG",
  "image/png": "PNG",
  "image/webp": "WEBP",
  "video/mp4": "MP4",
  "video/webm": "WEBM",
  "audio/mpeg": "MP3",
  "audio/wav": "WAV",
  "audio/x-wav": "WAV",
  "audio/mp4": "M4A",
  "application/zip": "ZIP",
  "application/x-zip-compressed": "ZIP",
};

function shortLabelsFor(mimes: string[]): string {
  return Array.from(new Set(mimes.map((mime) => MIME_SHORT_LABELS[mime] ?? mime))).join(", ");
}

// D-14/upload-dialog.tsx (03-04): client-side, advisory-only allow-list/size
// pre-check (T-03-12 — never authoritative; finalizeUpload's server-side
// magic-byte check is the real gate). Rejects a disallowed declared mime or
// an oversized declared size BEFORE any network call; a size exactly at the
// limit is accepted. Reuses file-magic.ts's ALLOWED_MIME_BY_TYPE/TYPE_LABELS
// and this file's own size-limit map — never re-derives either.
export function precheckUploadFile(
  file: { type: string; size: number },
  typeKey: string,
): ClientPrecheckResult {
  const label = TYPE_LABELS[typeKey] ?? typeKey;
  const allowedMimes = ALLOWED_MIME_BY_TYPE[typeKey] ?? [];

  if (!allowedMimes.includes(file.type)) {
    return {
      ok: false,
      message: `That file type isn't allowed for ${label}. Allowed: ${shortLabelsFor(allowedMimes)}.`,
    };
  }

  const limitType = mimeToSizeLimitType(file.type);
  if (limitType) {
    const limitBytes = sizeLimitBytes(limitType);
    if (file.size > limitBytes) {
      return {
        ok: false,
        message: `That file is too large for ${label}. Maximum size: ${SIZE_LIMIT_MB_BY_TYPE[limitType]}MB.`,
      };
    }
  }

  return { ok: true };
}
