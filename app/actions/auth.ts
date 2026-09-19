"use server";

import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { prisma } from "@/app/lib/prisma";
import { encrypt } from "@/app/lib/session";
import { loginSchema } from "@/app/lib/validation/auth";

export type LoginState = {
  error?: string;
} | undefined;

// D-04: unknown username and wrong password return the SAME generic message,
// checked identically with no early-return that would leak which one
// failed. isActive is checked only AFTER the password verifies, so a
// deactivated account's existence is never revealed to someone without the
// correct password.
//
// D-10: login/logout are explicitly excluded from the audit log — no
// writeAuditLog() call anywhere in this file.
export async function login(
  _prevState: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const parsed = loginSchema.safeParse({
    username: formData.get("username"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: "Invalid username or password" };
  }

  const { username, password } = parsed.data;

  const user = await prisma.user.findUnique({ where: { username } });

  // Compare against a fixed dummy hash when the user doesn't exist, so the
  // response time doesn't leak account existence via a short-circuit.
  const passwordHash =
    user?.passwordHash ??
    "$2a$10$CwTycUXWue0Thq9StjUM0uJ8x0fHb1nJTdiA6X.9kA9xW9a1zZ1Bq";
  const passwordMatches = await bcrypt.compare(password, passwordHash);

  if (!user || !passwordMatches) {
    return { error: "Invalid username or password" };
  }

  if (!user.isActive) {
    return { error: "Account deactivated — contact your administrator" };
  }

  const session = await encrypt({ userId: user.id });
  const cookieStore = await cookies();
  cookieStore.set("session", session, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  });

  redirect("/dashboard");
}

export async function logout() {
  const cookieStore = await cookies();
  cookieStore.delete("session");
  redirect("/login");
}
