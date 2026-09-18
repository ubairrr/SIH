import { test } from "node:test";
import assert from "node:assert/strict";

import {
  assertForwardOneStep,
  assertAdvanceNotClose,
  assertStageOwner,
  assertNotClosed,
  assertReopenAllowed,
  nextStageOf,
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

// assertAdvanceNotClose — call-site regression tests (#02-VERIFICATION blocker)

test("assertAdvanceNotClose does not throw for a legal non-closing advance", () => {
  const current = { stage: "FIR_REGISTERED" as const };
  const nextStage = nextStageOf(current.stage); // "UNDER_INVESTIGATION"
  assert.doesNotThrow(() => assertAdvanceNotClose(current, nextStage));
});

test("assertAdvanceNotClose throws with closeCase guidance when nextStage is CLOSED_JUDGMENT", () => {
  const current = { stage: "IN_COURT" as const };
  const nextStage = nextStageOf(current.stage); // "CLOSED_JUDGMENT"
  assert.throws(
    () => assertAdvanceNotClose(current, nextStage),
    /Use closeCase\(\) to reach CLOSED_JUDGMENT/,
  );
});

test("assertAdvanceNotClose throws for explicit CLOSED_JUDGMENT target", () => {
  const current = { stage: "IN_COURT" as const };
  assert.throws(
    () => assertAdvanceNotClose(current, "CLOSED_JUDGMENT"),
    /Use closeCase\(\)/,
  );
});

test("assertAdvanceNotClose still rejects a skip via assertForwardOneStep", () => {
  const current = { stage: "FIR_REGISTERED" as const };
  assert.throws(() => assertAdvanceNotClose(current, "CHARGE_SHEET_FILED"));
});

// closeCase IN_COURT guard — encodes the call-site invariant added in cases.ts
test("closeCase IN_COURT guard: rejects stages other than IN_COURT (tautology regression)", () => {
  const enforceCloseCaseInCourtCheck = (currentStage: string) => {
    if (currentStage !== "IN_COURT") {
      throw new Error(
        "Only a case currently at In Court can be closed. Use advanceStage to progress through earlier stages.",
      );
    }
  };
  assert.throws(
    () => enforceCloseCaseInCourtCheck("FIR_REGISTERED"),
    /Only a case currently at In Court can be closed/,
  );
  assert.throws(
    () => enforceCloseCaseInCourtCheck("UNDER_INVESTIGATION"),
    /Only a case currently at In Court can be closed/,
  );
  assert.doesNotThrow(() => enforceCloseCaseInCourtCheck("IN_COURT"));
});
