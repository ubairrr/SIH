import "server-only";

import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { decrypt } from "@/app/lib/session";
import { prisma } from "@/app/lib/prisma";

// D-02: the DAL is the AUTHORITATIVE check. isActive and role are re-read
// from Postgres on every authenticated server request (page render, Server
// Action, Route Handler) — the JWT payload is never trusted for either
// field. cache() de-dupes this to one DB read per request/render pass.
export const verifySession = cache(async () => {
  const cookieStore = await cookies();
  const cookie = cookieStore.get("session")?.value;
  const payload = await decrypt(cookie);

  if (!payload?.userId) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: {
      id: true,
      fullName: true,
      username: true,
      role: true,
      unit: true,
      isActive: true,
    },
  });

  if (!user || !user.isActive) {
    redirect("/login");
  }

  return user;
});
