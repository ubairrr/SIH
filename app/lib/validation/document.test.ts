import { test } from "node:test";
import assert from "node:assert/strict";

import { precheckUploadFile, sizeLimitBytes } from "./document";

// D-14/upload-dialog.tsx's three client-side pre-check Behavior cases,
// extracted into a pure function per 03-04-PLAN.md's acceptance criteria
// (React Testing Library is not installed in this project) so they can be
// exercised via plain node:test instead of a rendered-component check.

test("precheckUploadFile rejects a disallowed declared mime with the D-04-style copy", () => {
  const result = precheckUploadFile(
    { type: "image/png", size: 1024 },
    "FIR",
  );
  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.match(
      result.message,
      /That file type isn't allowed for FIR\. Allowed: PDF\./,
    );
  }
});

test("precheckUploadFile rejects a declared size one byte over the category's limit", () => {
  const limit = sizeLimitBytes("pdf");
  const result = precheckUploadFile(
    { type: "application/pdf", size: limit + 1 },
    "FIR",
  );
  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.match(
      result.message,
      /That file is too large for FIR\. Maximum size: 20MB\./,
    );
  }
});

test("precheckUploadFile accepts a declared size exactly at the category's limit", () => {
  const limit = sizeLimitBytes("pdf");
  const result = precheckUploadFile(
    { type: "application/pdf", size: limit },
    "FIR",
  );
  assert.equal(result.ok, true);
});
