"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";

import { authorize } from "@/app/lib/authorize";
import { prisma } from "@/app/lib/prisma";
import { writeAuditLog } from "@/app/lib/audit";
import { createUserSchema } from "@/app/lib/validation/user";

export type CreateUserState =
  | {
      error?: string;
      fieldErrors?: Partial<Record<keyof typeof createUserSchema.shape, string>>;
      success?: boolean;
    }
  | undefined;

// LOG-01/D-12: createUser is the first real write path in the app and the
// first real consumer of writeAuditLog() — the mutation (tx.user.create) and
// its AuditLog row share one prisma.$transaction, so a user row without its
// USER_CREATED log entry is structurally impossible.
export async function createUser(
  _prevState: CreateUserState,
  formData: FormData,
): Promise<CreateUserState> {
  const admin = await authorize({ role: "ADMIN" });

  const parsed = createUserSchema.safeParse({
    fullName: formData.get("fullName"),
    username: formData.get("username"),
    role: formData.get("role"),
    designation: formData.get("designation"),
    unit: formData.get("unit"),
    badgeId: formData.get("badgeId"),
    initialPassword: formData.get("initialPassword"),
  });

  if (!parsed.success) {
    return {
      error: "Couldn't save the user — check your connection and try again.",
    };
  }

  const { initialPassword, ...userFields } = parsed.data;

  try {
    await prisma.$transaction(async (tx) => {
      const passwordHash = await bcrypt.hash(initialPassword, 10);
      const user = await tx.user.create({
        data: { ...userFields, passwordHash },
      });
      await writeAuditLog(tx, {
        actorId: admin.id,
        actorRole: admin.role,
        action: "USER_CREATED",
        targetType: "User",
        targetId: user.id,
        targetLabel: user.fullName,
        details: {
          role: user.role,
          designation: user.designation,
          unit: user.unit,
        },
      });
    });
  } catch (err) {
    // Handles both the pre-check race and true concurrent createUser calls
    // with the same username — the DB's unique constraint is the actual
    // authority, this only translates its P2002 into user-facing copy.
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2002"
    ) {
      return {
        error: "Username is already taken",
        fieldErrors: { username: "Username is already taken" },
      };
    }
    throw err;
  }

  revalidatePath("/admin/users");
  return { success: true };
}
