import { test } from "node:test";
import assert from "node:assert/strict";

import { isEexistError } from "./fs-errors";

test("isEexistError returns true for {code:'EEXIST'}", () => {
  assert.equal(isEexistError({ code: "EEXIST" }), true);
});

test("isEexistError returns false for {code:'ENOENT'}", () => {
  assert.equal(isEexistError({ code: "ENOENT" }), false);
});

test("isEexistError returns false for null", () => {
  assert.equal(isEexistError(null), false);
});

test("isEexistError returns false for undefined", () => {
  assert.equal(isEexistError(undefined), false);
});

test("isEexistError returns false for a bare string", () => {
  assert.equal(isEexistError("EEXIST"), false);
});

test("isEexistError returns true for a constructed Error with code EEXIST", () => {
  const err = Object.assign(new Error("x"), { code: "EEXIST" });
  assert.equal(isEexistError(err), true);
});

test("isEexistError returns false for a plain object with no code", () => {
  assert.equal(isEexistError({}), false);
});
