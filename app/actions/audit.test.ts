import { test } from "node:test";
import assert from "node:assert/strict";

import { summarizeTamperResult } from "../lib/audit-guards";

test("summarizeTamperResult: tamperSucceeded is false when both UPDATE and DELETE threw", () => {
  assert.equal(
    summarizeTamperResult({ updateThrew: true, deleteThrew: true })
      .tamperSucceeded,
    false,
  );
});

test("summarizeTamperResult: tamperSucceeded is true when UPDATE did not throw", () => {
  assert.equal(
    summarizeTamperResult({ updateThrew: false, deleteThrew: true })
      .tamperSucceeded,
    true,
  );
});

test("summarizeTamperResult: tamperSucceeded is true when DELETE did not throw", () => {
  assert.equal(
    summarizeTamperResult({ updateThrew: true, deleteThrew: false })
      .tamperSucceeded,
    true,
  );
});

test("summarizeTamperResult: tamperSucceeded is true when neither threw (both unexpectedly succeeded)", () => {
  assert.equal(
    summarizeTamperResult({ updateThrew: false, deleteThrew: false })
      .tamperSucceeded,
    true,
  );
});
