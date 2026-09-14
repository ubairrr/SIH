"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { Prisma, type Role } from "@prisma/client";

import { authorize } from "@/app/lib/authorize";
import { prisma } from "@/app/lib/prisma";
import { writeAuditLog } from "@/app/lib/audit";
import {
  createUserSchema,
  changeRoleSchema,
  resetPasswordSchema,
} from "@/app/lib/validation/user";
import {
  assertNotSelfTarget,
  assertNotLastActiveAdmin,
} from "@/app/lib/user-guards";

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

export type MutationResult = { error?: string; success?: boolean };

// D-07/D-09: role changes are logged old -> new, and are rejected server-side
// (independent of the UI) when they would self-target the acting admin or
// demote the last remaining active Admin. activeAdminCount is read via
// tx.user.count() INSIDE this same transaction — never a stale
// pre-transaction count — so two concurrent role-change attempts can't both
// pass a count read from before either committed.
export async function changeRole(
  userId: string,
  newRole: Role,
): Promise<MutationResult> {
  const admin = await authorize({ role: "ADMIN" });

  const parsed = changeRoleSchema.safeParse({ userId, newRole });
  if (!parsed.success) {
    return { error: "Invalid request." };
  }

  try {
    await prisma.$transaction(async (tx) => {
      const target = await tx.user.findUniqueOrThrow({
        where: { id: parsed.data.userId },
      });
      const activeAdminCount = await tx.user.count({
        where: { role: "ADMIN", isActive: true },
      });

      assertNotSelfTarget(admin.id, target.id);
      assertNotLastActiveAdmin({
        targetRole: target.role,
        targetIsActive: target.isActive,
        activeAdminCount,
        removesAdminStatus:
          target.role === "ADMIN" && parsed.data.newRole !== "ADMIN",
      });

      const updated = await tx.user.update({
        where: { id: target.id },
        data: { role: parsed.data.newRole },
      });

      await writeAuditLog(tx, {
        actorId: admin.id,
        actorRole: admin.role,
        action: "USER_ROLE_CHANGED",
        targetType: "User",
        targetId: updated.id,
        targetLabel: updated.fullName,
        details: { oldRole: target.role, newRole: updated.role },
      });
    });
  } catch (err) {
    if (err instanceof Error) {
      return { error: err.message };
    }
    throw err;
  }

  revalidatePath("/admin/users");
  return { success: true };
}

// D-03: resetting a password never writes the plaintext password or its
// bcrypt hash into the audit log — the details object below is a bare `{}`
// literal with no reference to newPassword or passwordHash anywhere in it.
export async function resetPassword(
  userId: string,
  newPassword: string,
): Promise<MutationResult> {
  const admin = await authorize({ role: "ADMIN" });

  const parsed = resetPasswordSchema.safeParse({ userId, newPassword });
  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Invalid password.",
    };
  }

  try {
    await prisma.$transaction(async (tx) => {
      const passwordHash = await bcrypt.hash(parsed.data.newPassword, 10);
      const target = await tx.user.update({
        where: { id: parsed.data.userId },
        data: { passwordHash },
      });

      await writeAuditLog(tx, {
        actorId: admin.id,
        actorRole: admin.role,
        action: "USER_PASSWORD_RESET",
        targetType: "User",
        targetId: target.id,
        targetLabel: target.fullName,
        details: {},
      });
    });
  } catch {
    return {
      error: "Couldn't reset the password — check your connection and try again.",
    };
  }

  revalidatePath("/admin/users");
  return { success: true };
}

// D-08/D-09: deactivation is rejected server-side against self-target and
// the last active Admin, same live in-transaction count read as changeRole.
export async function deactivateUser(userId: string): Promise<MutationResult> {
  const admin = await authorize({ role: "ADMIN" });

  try {
    await prisma.$transaction(async (tx) => {
      const target = await tx.user.findUniqueOrThrow({ where: { id: userId } });
      const activeAdminCount = await tx.user.count({
        where: { role: "ADMIN", isActive: true },
      });

      assertNotSelfTarget(admin.id, target.id);
      assertNotLastActiveAdmin({
        targetRole: target.role,
        targetIsActive: target.isActive,
        activeAdminCount,
        removesAdminStatus: true,
      });

      const updated = await tx.user.update({
        where: { id: target.id },
        data: { isActive: false },
      });

      await writeAuditLog(tx, {
        actorId: admin.id,
        actorRole: admin.role,
        action: "USER_DEACTIVATED",
        targetType: "User",
        targetId: updated.id,
        targetLabel: updated.fullName,
        details: {},
      });
    });
  } catch (err) {
    if (err instanceof Error) {
      return { error: err.message };
    }
    throw err;
  }

  revalidatePath("/admin/users");
  return { success: true };
}

// D-08: reactivation only ever increases the active-Admin count, so D-09
// cannot be violated by it — no guard call needed.
export async function reactivateUser(userId: string): Promise<MutationResult> {
  const admin = await authorize({ role: "ADMIN" });

  try {
    await prisma.$transaction(async (tx) => {
      const updated = await tx.user.update({
        where: { id: userId },
        data: { isActive: true },
      });

      await writeAuditLog(tx, {
        actorId: admin.id,
        actorRole: admin.role,
        action: "USER_REACTIVATED",
        targetType: "User",
        targetId: updated.id,
        targetLabel: updated.fullName,
        details: {},
      });
    });
  } catch {
    return {
      error: "Couldn't reactivate the user — check your connection and try again.",
    };
  }

  revalidatePath("/admin/users");
  return { success: true };
}
