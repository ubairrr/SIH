import { test } from "node:test";
import assert from "node:assert/strict";

import { detectAndValidate } from "./file-magic";

// Minimal hand-crafted headers — enough bytes for file-type's magic-byte
// sniffer to identify the format without needing a real file on disk.
const MINIMAL_PDF_HEADER = Buffer.from("%PDF-1.4\n%\xE2\xE3\xCF\xD3\n", "binary");
const MINIMAL_PNG_HEADER = Buffer.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d,
  0x49, 0x48, 0x44, 0x52,
]);

test("detectAndValidate returns ok:true for a real PDF header checked against FIR", async () => {
  const result = await detectAndValidate(MINIMAL_PDF_HEADER, "FIR");
  assert.equal(result.ok, true);
  assert.equal(result.detectedMime, "application/pdf");
});

test("detectAndValidate returns ok:false for a PNG header checked against FIR (D-04 demo moment)", async () => {
  const result = await detectAndValidate(MINIMAL_PNG_HEADER, "FIR");
  assert.equal(result.ok, false);
  assert.equal(result.detectedMime, "image/png");
});

test("detectAndValidate returns ok:true for a PNG header checked against PHOTO", async () => {
  const result = await detectAndValidate(MINIMAL_PNG_HEADER, "PHOTO");
  assert.equal(result.ok, true);
  assert.equal(result.detectedMime, "image/png");
});
