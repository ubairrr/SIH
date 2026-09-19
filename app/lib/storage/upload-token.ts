import { SignJWT, jwtVerify } from "jose";

// T-03-07-01/T-03-07-04: short-lived, purpose-bound upload-session credential
// binding an exact storage key + case + document + user together. Distinct
// JWT audience ("casevault:upload-session") from app/lib/session.ts's login
// session JWTs (which set no audience) so one token kind can never be
// replayed as the other. No "server-only" import — this module must stay
// plain-Node testable (see app/lib/storage/upload-token.test.ts) and is also
// imported by the local-mode stage Route Handler.

export type UploadTokenClaims = {
  key: string;
  caseId: string;
  documentId: string | null;
  userId: string;
};

const UPLOAD_TOKEN_AUDIENCE = "casevault:upload-session";

// D-01: no new env var — reuses SESSION_SECRET, the app's existing
// session-signing secret. The optional `secret` param is what makes this
// module testable without touching process.env.
function resolveSecret(secret?: string): Uint8Array {
  const resolved = secret ?? process.env.SESSION_SECRET;
  if (!resolved) {
    throw new Error("SESSION_SECRET environment variable is not set");
  }
  return new TextEncoder().encode(resolved);
}

export async function signUploadToken(
  claims: UploadTokenClaims,
  secret?: string,
): Promise<string> {
  const encodedKey = resolveSecret(secret);
  return new SignJWT({
    key: claims.key,
    caseId: claims.caseId,
    documentId: claims.documentId,
    userId: claims.userId,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("15m")
    .setAudience(UPLOAD_TOKEN_AUDIENCE)
    .sign(encodedKey);
}

export async function verifyUploadToken(
  token: string,
  secret?: string,
): Promise<UploadTokenClaims | null> {
  try {
    const encodedKey = resolveSecret(secret);
    const { payload } = await jwtVerify(token, encodedKey, {
      algorithms: ["HS256"],
      audience: UPLOAD_TOKEN_AUDIENCE,
    });

    if (
      typeof payload.key !== "string" ||
      typeof payload.caseId !== "string" ||
      typeof payload.userId !== "string" ||
      !(typeof payload.documentId === "string" || payload.documentId === null)
    ) {
      return null;
    }

    return {
      key: payload.key,
      caseId: payload.caseId,
      documentId: payload.documentId,
      userId: payload.userId,
    };
  } catch {
    return null;
  }
}
