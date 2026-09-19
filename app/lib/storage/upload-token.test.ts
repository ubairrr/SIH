import { test } from "node:test";
import assert from "node:assert/strict";
import { SignJWT } from "jose";

import { signUploadToken, verifyUploadToken, type UploadTokenClaims } from "./upload-token";

const SECRET = "test-secret-value-for-upload-token-tests";

function encodedSecret(secret: string) {
  return new TextEncoder().encode(secret);
}

test("verifyUploadToken(signUploadToken(claims)) round-trips to the same claims", async () => {
  const claims: UploadTokenClaims = {
    key: "cases/case-1/doc-1/v1-uuid",
    caseId: "case-1",
    documentId: "doc-1",
    userId: "user-1",
  };
  const token = await signUploadToken(claims, SECRET);
  const verified = await verifyUploadToken(token, SECRET);
  assert.deepEqual(verified, claims);
});

test("verifyUploadToken round-trips a null documentId", async () => {
  const claims: UploadTokenClaims = {
    key: "cases/case-1/doc-2/v1-uuid",
    caseId: "case-1",
    documentId: null,
    userId: "user-1",
  };
  const token = await signUploadToken(claims, SECRET);
  const verified = await verifyUploadToken(token, SECRET);
  assert.deepEqual(verified, claims);
});

test("verifyUploadToken resolves to null for a tampered signature", async () => {
  const claims: UploadTokenClaims = {
    key: "cases/case-1/doc-1/v1-uuid",
    caseId: "case-1",
    documentId: "doc-1",
    userId: "user-1",
  };
  const token = await signUploadToken(claims, SECRET);
  // Flip one character in the signature segment.
  const parts = token.split(".");
  const lastChar = parts[2].slice(-1);
  const flipped = lastChar === "A" ? "B" : "A";
  parts[2] = parts[2].slice(0, -1) + flipped;
  const tampered = parts.join(".");

  const verified = await verifyUploadToken(tampered, SECRET);
  assert.equal(verified, null);
});

test("verifyUploadToken resolves to null for an already-expired token", async () => {
  const pastTimestamp = Math.floor(Date.now() / 1000) - 30;
  const expired = await new SignJWT({
    key: "cases/case-1/doc-1/v1-uuid",
    caseId: "case-1",
    documentId: "doc-1",
    userId: "user-1",
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt(pastTimestamp - 900)
    .setExpirationTime(pastTimestamp)
    .setAudience("casevault:upload-session")
    .sign(encodedSecret(SECRET));

  const verified = await verifyUploadToken(expired, SECRET);
  assert.equal(verified, null);
});

test("verifyUploadToken resolves to null for a token with no audience set", async () => {
  const noAudience = await new SignJWT({
    key: "cases/case-1/doc-1/v1-uuid",
    caseId: "case-1",
    documentId: "doc-1",
    userId: "user-1",
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("15m")
    .sign(encodedSecret(SECRET));

  const verified = await verifyUploadToken(noAudience, SECRET);
  assert.equal(verified, null);
});

test("verifyUploadToken resolves to null for a token with a different audience", async () => {
  const wrongAudience = await new SignJWT({
    key: "cases/case-1/doc-1/v1-uuid",
    caseId: "case-1",
    documentId: "doc-1",
    userId: "user-1",
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("15m")
    .setAudience("something-else")
    .sign(encodedSecret(SECRET));

  const verified = await verifyUploadToken(wrongAudience, SECRET);
  assert.equal(verified, null);
});

test("verifyUploadToken resolves to null for a token signed with a different secret", async () => {
  const claims: UploadTokenClaims = {
    key: "cases/case-1/doc-1/v1-uuid",
    caseId: "case-1",
    documentId: "doc-1",
    userId: "user-1",
  };
  const token = await signUploadToken(claims, SECRET);
  const verified = await verifyUploadToken(token, "a-completely-different-secret");
  assert.equal(verified, null);
});

test("verifyUploadToken resolves to null for a well-formed but wrong-shape payload (documentId is a number)", async () => {
  const wrongShape = await new SignJWT({
    key: "cases/case-1/doc-1/v1-uuid",
    caseId: "case-1",
    documentId: 123,
    userId: "user-1",
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("15m")
    .setAudience("casevault:upload-session")
    .sign(encodedSecret(SECRET));

  const verified = await verifyUploadToken(wrongShape, SECRET);
  assert.equal(verified, null);
});

test("verifyUploadToken resolves to null for a well-formed but wrong-shape payload (userId missing)", async () => {
  const missingUserId = await new SignJWT({
    key: "cases/case-1/doc-1/v1-uuid",
    caseId: "case-1",
    documentId: "doc-1",
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("15m")
    .setAudience("casevault:upload-session")
    .sign(encodedSecret(SECRET));

  const verified = await verifyUploadToken(missingUserId, SECRET);
  assert.equal(verified, null);
});
