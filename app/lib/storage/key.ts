import { randomUUID } from "node:crypto";

// CR-01/CR-02/CR-03 remediation: storage keys must always have the exact
// shape the server generates (cases/{caseId}/{documentId}/v{n}-{uuid}) —
// never an opaque client-controlled string. This module is the single place
// that builds and validates that shape, so requestUpload, the local-disk
// upload-staging route, and finalizeUpload all agree on what a legitimate
// key looks like.
const UUID_SOURCE = "[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}";
const KEY_SHAPE_PATTERN = new RegExp(`^cases/${UUID_SOURCE}/${UUID_SOURCE}/v\\d+-${UUID_SOURCE}$`);

// D-01: server-generated storage key for a signed/staged upload target.
// `documentId` is only used to shape the path (never trusted to already
// exist here — callers must verify existence/ownership themselves before
// calling this); when absent, a fresh random document segment is minted so
// a brand-new document's v1 key is still unguessable.
export function buildStorageKey(
  caseId: string,
  documentId: string | null,
  versionNumber: number,
): string {
  const documentSegment = documentId ?? randomUUID();
  return `cases/${caseId}/${documentSegment}/v${versionNumber}-${randomUUID()}`;
}

// CR-01: format gate applied BEFORE any filesystem/storage operation touches
// a client-supplied key (e.g. the local-disk upload-staging PUT route) — a
// key containing `..` or any other shape never matches this pattern.
export function isValidStorageKeyShape(key: string): boolean {
  return KEY_SHAPE_PATTERN.test(key);
}

// CR-02/CR-03: strict check that a storageKey actually belongs to the case
// (and, for a new version, the exact document) the caller claims to be
// acting on — so finalizeUpload can never be pointed at an arbitrary
// already-staged key from another case/document/user.
export function isStorageKeyForTarget(
  key: string,
  caseId: string,
  documentId: string | null,
): boolean {
  if (!isValidStorageKeyShape(key)) return false;
  const casePrefix = `cases/${caseId}/`;
  if (!key.startsWith(casePrefix)) return false;
  if (documentId) {
    return key.startsWith(`${casePrefix}${documentId}/`);
  }
  return true;
}
