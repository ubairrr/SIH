import { test } from "node:test";
import assert from "node:assert/strict";

import {
  assertForwardOneStep,
  assertStageOwner,
  assertNotClosed,
  assertReopenAllowed,
} from "./case-guards";

test("assertForwardOneStep does not throw for the one legal forward step", () => {
  assert.doesNotThrow(() =>
    assertForwardOneStep("FIR_REGISTERED", "UNDER_INVESTIGATION"),
  );
});

test("assertForwardOneStep throws when skipping a stage", () => {
  assert.throws(() =>
    assertForwardOneStep("FIR_REGISTERED", "CHARGE_SHEET_FILED"),
  );
});

test("assertForwardOneStep throws when moving backward", () => {
  assert.throws(() =>
    assertForwardOneStep("UNDER_INVESTIGATION", "FIR_REGISTERED"),
  );
});

test("assertStageOwner does not throw when role matches the stage owner", () => {
  assert.doesNotThrow(() => assertStageOwner("POLICE", "FIR_REGISTERED"));
});

test("assertStageOwner does not throw for Admin regardless of stage", () => {
  assert.doesNotThrow(() => assertStageOwner("ADMIN", "IN_COURT"));
});

test("assertStageOwner throws when role does not own the stage", () => {
  assert.throws(() => assertStageOwner("PROSECUTION", "FIR_REGISTERED"));
});

test("assertNotClosed does not throw for an open stage", () => {
  assert.doesNotThrow(() => assertNotClosed("IN_COURT"));
});

test("assertNotClosed throws for a closed case", () => {
  assert.throws(() => assertNotClosed("CLOSED_JUDGMENT"));
});

test("assertReopenAllowed does not throw for Court reopening a closed case", () => {
  assert.doesNotThrow(() =>
    assertReopenAllowed("COURT", "CLOSED_JUDGMENT"),
  );
});

test("assertReopenAllowed does not throw for Admin reopening a closed case", () => {
  assert.doesNotThrow(() =>
    assertReopenAllowed("ADMIN", "CLOSED_JUDGMENT"),
  );
});

test("assertReopenAllowed throws for a department role", () => {
  assert.throws(() => assertReopenAllowed("POLICE", "CLOSED_JUDGMENT"));
});

test("assertReopenAllowed throws when the case is not closed", () => {
  assert.throws(() => assertReopenAllowed("COURT", "IN_COURT"));
});
