import { NextRequest, NextResponse } from "next/server";

import { decrypt } from "@/app/lib/session";

// Next.js 16 renamed `middleware.ts` -> `proxy.ts`. This is an OPTIMISTIC,
// UX-only redirect: it decodes the session cookie and nothing else — no DB
// call, because this runs on every request including prefetches. The
// authoritative check (isActive/role re-read from Postgres, D-02) lives in
// app/lib/dal.ts's verifySession(), called from every Server Action, Route
// Handler, and page. Never treat this file as the source of truth.

const publicRoutes = ["/login"];

export default async function proxy(req: NextRequest) {
  const isPublic = publicRoutes.includes(req.nextUrl.pathname);
  const cookie = req.cookies.get("session")?.value;
  const session = await decrypt(cookie);

  if (!isPublic && !session?.userId) {
    return NextResponse.redirect(new URL("/login", req.nextUrl));
  }

  if (isPublic && session?.userId) {
    return NextResponse.redirect(new URL("/dashboard", req.nextUrl));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|.*\\.png$).*)"],
};
