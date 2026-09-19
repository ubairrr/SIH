// RED-phase stub — intentionally incomplete pending GREEN implementation.

export type UploadTokenClaims = {
  key: string;
  caseId: string;
  documentId: string | null;
  userId: string;
};

export async function signUploadToken(
  _claims: UploadTokenClaims,
  _secret?: string,
): Promise<string> {
  throw new Error("not implemented");
}

export async function verifyUploadToken(
  _token: string,
  _secret?: string,
): Promise<UploadTokenClaims | null> {
  return null;
}
