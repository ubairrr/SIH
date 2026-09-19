import type { Role } from "@prisma/client";

// STUB — RED phase. Real implementation lands in the GREEN commit.
export function assertDocumentOwner(_role: Role, _uploaderRole: Role): void {
  throw new Error("not implemented");
}

export function assertCaseNotClosedForDocs(_stage: string): void {
  throw new Error("not implemented");
}

export function assertNotAlreadyDeleted(_deletedAt: Date | null): void {
  throw new Error("not implemented");
}

export function assertAllowedTypeForCategory(
  _allowedMimes: string[],
  _expectedLabel: string,
  _detectedMime: string | null,
): void {
  throw new Error("not implemented");
}
