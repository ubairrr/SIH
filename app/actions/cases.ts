"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";

import { authorize } from "@/app/lib/authorize";
import { prisma } from "@/app/lib/prisma";
import { writeAuditLog } from "@/app/lib/audit";
import { registerFirSchema } from "@/app/lib/validation/case";

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
