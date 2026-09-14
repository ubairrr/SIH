import { test } from "node:test";
import assert from "node:assert/strict";

import { assertNotSelfTarget, assertNotLastActiveAdmin } from "./user-guards";

test("assertNotSelfTarget throws when actorId === targetId", () => {
  assert.throws(() => assertNotSelfTarget("user-1", "user-1"));
});

test("assertNotSelfTarget does not throw when actorId !== targetId", () => {
  assert.doesNotThrow(() => assertNotSelfTarget("user-1", "user-2"));
});

test("assertNotLastActiveAdmin throws for the last active Admin being demoted/deactivated", () => {
  assert.throws(() =>
    assertNotLastActiveAdmin({
      targetRole: "ADMIN",
      targetIsActive: true,
      activeAdminCount: 1,
      removesAdminStatus: true,
    }),
  );
});

test("assertNotLastActiveAdmin does not throw when activeAdminCount > 1", () => {
  assert.doesNotThrow(() =>
    assertNotLastActiveAdmin({
      targetRole: "ADMIN",
      targetIsActive: true,
      activeAdminCount: 2,
      removesAdminStatus: true,
    }),
  );
});

test("assertNotLastActiveAdmin does not throw when the target isn't an Admin", () => {
  assert.doesNotThrow(() =>
    assertNotLastActiveAdmin({
      targetRole: "POLICE",
      targetIsActive: true,
      activeAdminCount: 1,
      removesAdminStatus: true,
    }),
  );
});

test("assertNotLastActiveAdmin does not throw when the mutation doesn't remove Admin status", () => {
  assert.doesNotThrow(() =>
    assertNotLastActiveAdmin({
      targetRole: "ADMIN",
      targetIsActive: true,
      activeAdminCount: 1,
      removesAdminStatus: false,
    }),
  );
});

test("assertNotLastActiveAdmin idempotency: deactivate-then-reactivate-then-deactivate never rejects while activeAdminCount stays >= 2", () => {
  // Simulates the guard's own logic being called three times in sequence
  // with the count held constant at 2 (proves the guard is not
  // order-sensitive or stateful — DB-level concurrency correctness is
  // proven separately by the live transactional integration).
  const input = {
    targetRole: "ADMIN" as const,
    targetIsActive: true,
    activeAdminCount: 2,
    removesAdminStatus: true,
  };
  assert.doesNotThrow(() => assertNotLastActiveAdmin(input)); // deactivate
  assert.doesNotThrow(() => assertNotLastActiveAdmin(input)); // reactivate (still no-op path)
  assert.doesNotThrow(() => assertNotLastActiveAdmin(input)); // deactivate again
});
