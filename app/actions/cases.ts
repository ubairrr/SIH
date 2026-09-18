"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";

import { authorize } from "@/app/lib/authorize";
import { prisma } from "@/app/lib/prisma";
import { writeAuditLog } from "@/app/lib/audit";
import {
  registerFirSchema,
  advanceStageSchema,
  closeCaseSchema,
  reopenCaseSchema,
} from "@/app/lib/validation/case";
import {
  assertForwardOneStep,
  assertStageOwner,
  assertNotClosed,
  assertReopenAllowed,
  nextStageOf,
} from "@/app/lib/case-guards";
import type { MutationResult } from "@/app/actions/users";

export type CreateCaseState =
  | {
      error?: string;
      fieldErrors?: Partial<
        Record<keyof typeof registerFirSchema.shape, string>
      >;
      success?: boolean;
      caseId?: string;
    }
  | undefined;

// D-14/D-15/D-11: registerFir mirrors createUser's transaction+P2002 pattern.
// The Case row, its initial FIR_REGISTERED StageHistory row, and the
// CASE_REGISTERED AuditLog row are all written inside one prisma.$transaction
// — an unlogged case registration is structurally impossible.
export async function registerFir(
  _prevState: CreateCaseState,
  formData: FormData,
): Promise<CreateCaseState> {
  const officer = await authorize({ role: ["POLICE", "ADMIN"] });

  const parsed = registerFirSchema.safeParse({
    firNumber: formData.get("firNumber"),
    title: formData.get("title"),
    offenceSections: formData.get("offenceSections"),
    incidentDate: formData.get("incidentDate"),
    policeStation: formData.get("policeStation"),
    complainant: formData.get("complainant"),
    accused: formData.get("accused"),
    description: formData.get("description"),
  });

  if (!parsed.success) {
    return {
      error:
        "Couldn't save the case — check your connection and try again.",
    };
  }

  let caseId: string | undefined;

  try {
    await prisma.$transaction(async (tx) => {
      const createdCase = await tx.case.create({
        data: {
          ...parsed.data,
          registeredById: officer.id,
        },
      });
      caseId = createdCase.id;

      await tx.stageHistory.create({
        data: {
          caseId: createdCase.id,
          fromStage: null,
          toStage: "FIR_REGISTERED",
          actorId: officer.id,
          actorRole: officer.role,
          remark: null,
        },
      });

      await writeAuditLog(tx, {
        actorId: officer.id,
        actorRole: officer.role,
        action: "CASE_REGISTERED",
        targetType: "Case",
        targetId: createdCase.id,
        targetLabel: createdCase.firNumber,
        details: { title: createdCase.title, stage: "FIR_REGISTERED" },
      });
    });
  } catch (err) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2002"
    ) {
      const message = `FIR number ${parsed.data.firNumber} is already registered — enter a unique FIR number.`;
      return {
        error: message,
        fieldErrors: { firNumber: message },
      };
    }
    throw err;
  }

  revalidatePath("/dashboard");
  return { success: true, caseId };
}

// D-06/D-11/D-12: advanceStage re-fetches the case's CURRENT stage inside the
// transaction (never a client-supplied stage) before calling any guard —
// only the department that owns that stage (or Admin) can move it, and only
// forward by one step.
export async function advanceStage(
  caseId: string,
  remark?: string,
): Promise<MutationResult> {
  const actor = await authorize();

  const parsed = advanceStageSchema.safeParse({ caseId, remark });
  if (!parsed.success) {
    return { error: "Invalid request." };
  }

  try {
    await prisma.$transaction(async (tx) => {
      const current = await tx.case.findUniqueOrThrow({
        where: { id: parsed.data.caseId },
      });
      const nextStage = nextStageOf(current.stage);

      assertNotClosed(current.stage);
      assertStageOwner(actor.role, current.stage);
      if (!nextStage) {
        throw new Error("This case has no further stage to advance to.");
      }
      assertForwardOneStep(current.stage, nextStage);

      const updated = await tx.case.update({
        where: { id: current.id },
        data: { stage: nextStage },
      });

      await tx.stageHistory.create({
        data: {
          caseId: current.id,
          fromStage: current.stage,
          toStage: nextStage,
          actorId: actor.id,
          actorRole: actor.role,
          remark: parsed.data.remark ?? null,
        },
      });

      await writeAuditLog(tx, {
        actorId: actor.id,
        actorRole: actor.role,
        action: "STAGE_ADVANCED",
        targetType: "Case",
        targetId: updated.id,
        targetLabel: updated.firNumber,
        details: {
          fromStage: current.stage,
          toStage: nextStage,
          remark: parsed.data.remark ?? null,
        },
      });
    });
  } catch (err) {
    if (err instanceof Error) {
      return { error: err.message };
    }
    throw err;
  }

  revalidatePath("/dashboard");
  revalidatePath(`/cases/${caseId}`);
  return { success: true };
}

// D-07: closing (IN_COURT -> CLOSED_JUDGMENT) records a verdict from the
// fixed list plus a judgment summary, both persisted on the Case row and
// referenced in the STAGE_ADVANCED/CASE_CLOSED log details.
export async function closeCase(
  caseId: string,
  verdict: string,
  judgmentSummary: string,
): Promise<MutationResult> {
  const actor = await authorize();

  const parsed = closeCaseSchema.safeParse({ caseId, verdict, judgmentSummary });
  if (!parsed.success) {
    return { error: "Invalid request." };
  }

  try {
    await prisma.$transaction(async (tx) => {
      const current = await tx.case.findUniqueOrThrow({
        where: { id: parsed.data.caseId },
      });
      const nextStage = nextStageOf(current.stage);

      assertNotClosed(current.stage);
      assertStageOwner(actor.role, current.stage);
      if (!nextStage) {
        throw new Error("This case has no further stage to advance to.");
      }
      assertForwardOneStep(current.stage, nextStage);

      const updated = await tx.case.update({
        where: { id: current.id },
        data: {
          stage: nextStage,
          verdict: parsed.data.verdict,
          judgmentSummary: parsed.data.judgmentSummary,
        },
      });

      const remark = `Verdict: ${parsed.data.verdict} — ${parsed.data.judgmentSummary}`;

      await tx.stageHistory.create({
        data: {
          caseId: current.id,
          fromStage: current.stage,
          toStage: nextStage,
          actorId: actor.id,
          actorRole: actor.role,
          remark,
        },
      });

      await writeAuditLog(tx, {
        actorId: actor.id,
        actorRole: actor.role,
        action: "CASE_CLOSED",
        targetType: "Case",
        targetId: updated.id,
        targetLabel: updated.firNumber,
        details: { fromStage: current.stage, toStage: nextStage, remark },
      });
    });
  } catch (err) {
    if (err instanceof Error) {
      return { error: err.message };
    }
    throw err;
  }

  revalidatePath("/dashboard");
  revalidatePath(`/cases/${caseId}`);
  return { success: true };
}

// D-08: Court (or Admin) can reopen a closed case (CLOSED_JUDGMENT ->
// IN_COURT) with a required reason. This is a logged action.
export async function reopenCase(
  caseId: string,
  reason: string,
): Promise<MutationResult> {
  const actor = await authorize();

  const parsed = reopenCaseSchema.safeParse({ caseId, reason });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid request." };
  }

  try {
    await prisma.$transaction(async (tx) => {
      const current = await tx.case.findUniqueOrThrow({
        where: { id: parsed.data.caseId },
      });

      assertReopenAllowed(actor.role, current.stage);

      const updated = await tx.case.update({
        where: { id: current.id },
        data: { stage: "IN_COURT" },
      });

      await tx.stageHistory.create({
        data: {
          caseId: current.id,
          fromStage: current.stage,
          toStage: "IN_COURT",
          actorId: actor.id,
          actorRole: actor.role,
          remark: parsed.data.reason,
        },
      });

      await writeAuditLog(tx, {
        actorId: actor.id,
        actorRole: actor.role,
        action: "CASE_REOPENED",
        targetType: "Case",
        targetId: updated.id,
        targetLabel: updated.firNumber,
        details: {
          fromStage: current.stage,
          toStage: "IN_COURT",
          remark: parsed.data.reason,
        },
      });
    });
  } catch (err) {
    if (err instanceof Error) {
      return { error: err.message };
    }
    throw err;
  }

  revalidatePath("/dashboard");
  revalidatePath(`/cases/${caseId}`);
  return { success: true };
}
