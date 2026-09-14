import { z } from "zod";

// D-06: the five fixed roles. Shared across all user-mutation schemas below.
export const roleEnum = z.enum([
  "POLICE",
  "FORENSICS",
  "PROSECUTION",
  "COURT",
  "ADMIN",
]);

// Shared between the client Create User form (react-hook-form + zodResolver)
// and createUser's Server Action (authoritative re-validation) — never trust
// client validation alone (D-06 fields: fullName, username, role,
// designation, unit, badgeId; Admin sets the initial password per D-03).
export const createUserSchema = z.object({
  fullName: z.string().min(1, "Full name is required").max(100),
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(50),
  role: roleEnum,
  designation: z.string().min(1, "Designation is required").max(100),
  unit: z.string().min(1, "Unit is required").max(100),
  badgeId: z.string().min(1, "Badge ID is required").max(50),
  initialPassword: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(100),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;

// D-07: Admin changes a user's role; logged with old -> new in details.
export const changeRoleSchema = z.object({
  userId: z.string().min(1),
  newRole: roleEnum,
});

export type ChangeRoleInput = z.infer<typeof changeRoleSchema>;

// D-03: Admin resets a user's password later; the log entry for this action
// must never contain the plaintext password or its hash (enforced in the
// Server Action, not this schema).
export const resetPasswordSchema = z.object({
  userId: z.string().min(1),
  newPassword: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(100),
});

export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
