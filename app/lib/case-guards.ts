import type { Role, Stage } from "@prisma/client";

import { ROLE_LABELS, STAGE_LABELS } from "./role-display";

// D-06: stages move forward one step at a time, in this fixed order.
export const STAGE_ORDER: Stage[] = [
  "FIR_REGISTERED",
  "UNDER_INVESTIGATION",
  "CHARGE_SHEET_FILED",
  "IN_COURT",
  "CLOSED_JUDGMENT",
];

// D-06: only the department that owns the current stage moves it forward.
export const STAGE_OWNER: Record<Stage, Role> = {
  FIR_REGISTERED: "POLICE",
  UNDER_INVESTIGATION: "POLICE",
  CHARGE_SHEET_FILED: "PROSECUTION",
  IN_COURT: "COURT",
  CLOSED_JUDGMENT: "COURT",
};

// Pure, side-effect-free guard functions with no Prisma/Next imports — run
// under plain node:test with no Next.js request context. Server Actions in
// app/actions/cases.ts call these with a live, in-transaction re-fetch of
// the case's current stage, never a stale client-supplied one.

export function nextStageOf(current: Stage): Stage | null {
  const index = STAGE_ORDER.indexOf(current);
  if (index === -1 || index === STAGE_ORDER.length - 1) {
    return null;
  }
  return STAGE_ORDER[index + 1];
}

/**
 * Rejects any stage move that isn't exactly one step forward in
 * STAGE_ORDER — no skipping, no moving backward (reopen is a separate,
 * explicitly-allowed exception handled by assertReopenAllowed).
 */
export function assertForwardOneStep(current: Stage, next: Stage): void {
  if (nextStageOf(current) !== next) {
    throw new Error("Cases can only move forward one stage at a time.");
  }
}

/**
 * Use this instead of assertForwardOneStep in advanceStage. Rejects the same
 * illegal moves as assertForwardOneStep AND additionally rejects any attempt
 * to advance a case to CLOSED_JUDGMENT via advanceStage — that transition
 * requires a verdict and must go through closeCase.
 *
 * The `requestedNext` argument must be chosen by the caller independently of
 * current.stage (i.e. it must NOT be derived by calling nextStageOf(current)
 * at the same call site) to avoid the tautological-guard failure mode.
 */
export function assertAdvanceNotClose(
  current: { stage: Stage },
  requestedNext: Stage | null,
): void {
  if (requestedNext === "CLOSED_JUDGMENT") {
    throw new Error(
      "Use closeCase() to reach CLOSED_JUDGMENT — advanceStage cannot skip the verdict requirement.",
    );
  }
  // Delegates forward-one-step validation to the canonical guard.
  assertForwardOneStep(current.stage, requestedNext as Stage);
}

/**
 * Rejects a stage move attempted by a role other than the department that
 * owns the current stage (Admin can always act, D-04).
 */
export function assertStageOwner(role: Role, current: Stage): void {
  const owner = STAGE_OWNER[current];
  if (role !== owner && role !== "ADMIN") {
    throw new Error(
      `Only ${ROLE_LABELS[owner]} can move a case out of ${STAGE_LABELS[current]}.`,
    );
  }
}

/**
 * Rejects any edit or stage move on a closed case (D-08/D-12) — the only
 * exception is reopenCase, which calls assertReopenAllowed instead.
 */
export function assertNotClosed(stage: Stage): void {
  if (stage === "CLOSED_JUDGMENT") {
    throw new Error("This case is closed and can no longer be edited.");
  }
}

/**
 * Only Court (or Admin) can reopen a closed case, and only a closed case
 * can be reopened.
 */
export function assertReopenAllowed(role: Role, stage: Stage): void {
  if (stage !== "CLOSED_JUDGMENT" || (role !== "COURT" && role !== "ADMIN")) {
    throw new Error("Only Court can reopen a closed case.");
  }
}
