import { test } from "node:test";
import assert from "node:assert/strict";

import {
  assertDocumentOwner,
  assertCaseNotClosedForDocs,
  assertNotAlreadyDeleted,
  assertAllowedTypeForCategory,
} from "./document-guards";

// assertDocumentOwner

test("assertDocumentOwner does not throw when role matches uploaderRole", () => {
  assert.doesNotThrow(() => assertDocumentOwner("POLICE", "POLICE"));
});

test("assertDocumentOwner does not throw for Admin regardless of uploaderRole", () => {
  assert.doesNotThrow(() => assertDocumentOwner("ADMIN", "FORENSICS"));
});

test("assertDocumentOwner throws when role does not match uploaderRole", () => {
  assert.throws(
    () => assertDocumentOwner("PROSECUTION", "POLICE"),
    /Only Police \(the uploading department\) or Admin can change this document\./,
  );
});

// assertCaseNotClosedForDocs

test("assertCaseNotClosedForDocs does not throw for an open stage", () => {
  assert.doesNotThrow(() => assertCaseNotClosedForDocs("IN_COURT"));
});

test("assertCaseNotClosedForDocs throws for CLOSED_JUDGMENT", () => {
  assert.throws(
    () => assertCaseNotClosedForDocs("CLOSED_JUDGMENT"),
    /This case is closed and no documents can be added, versioned, edited, or deleted\./,
  );
});

// assertNotAlreadyDeleted

test("assertNotAlreadyDeleted does not throw when deletedAt is null", () => {
  assert.doesNotThrow(() => assertNotAlreadyDeleted(null));
});

test("assertNotAlreadyDeleted throws when deletedAt is a Date", () => {
  assert.throws(
    () => assertNotAlreadyDeleted(new Date()),
    /This document has already been deleted\./,
  );
});

// assertAllowedTypeForCategory

test("assertAllowedTypeForCategory does not throw when detectedMime is in the allow-list", () => {
  assert.doesNotThrow(() =>
    assertAllowedTypeForCategory(["application/pdf"], "FIR", "application/pdf"),
  );
});

test("assertAllowedTypeForCategory throws when detectedMime is not in the allow-list", () => {
  assert.throws(
    () => assertAllowedTypeForCategory(["application/pdf"], "FIR", "image/png"),
    /File content is not a valid FIR \(detected: image\/png\)\./,
  );
});

test("assertAllowedTypeForCategory throws when detectedMime is null", () => {
  assert.throws(
    () => assertAllowedTypeForCategory(["application/pdf"], "FIR", null),
    /File content is not a valid FIR \(detected: unknown\)\./,
  );
});
