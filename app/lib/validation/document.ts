import { z } from "zod";

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

function mimeToSizeLimitType(mime: string): SizeLimitFileType | null {
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
    title: z.string().min(1, "Title is required").max(200),
    description: z.string().max(2000).optional(),
    changeNote: z.string().max(1000).optional(),
  })
  .refine(
    (value) =>
      value.documentId == null ||
      (value.changeNote != null && value.changeNote.trim().length > 0),
    {
      message: "A change note is required when adding a new version",
      path: ["changeNote"],
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
