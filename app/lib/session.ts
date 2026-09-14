import "server-only";

import { SignJWT, jwtVerify } from "jose";

// D-01: 8-hour, sliding session. Signed with jose (HS256) — edge+node
// compatible, this is the pattern documented in Next.js's own official
// Authentication guide. Never import this module from a client component.

export type SessionPayload = {
  userId: string;
};

const secretKey = process.env.SESSION_SECRET;
if (!secretKey) {
  throw new Error("SESSION_SECRET environment variable is not set");
}
const encodedKey = new TextEncoder().encode(secretKey);

export async function encrypt(payload: SessionPayload): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("8h")
    .sign(encodedKey);
}

export async function decrypt(
  session: string | undefined = "",
): Promise<SessionPayload | undefined> {
  try {
    const { payload } = await jwtVerify(session, encodedKey, {
      algorithms: ["HS256"],
    });
    if (typeof payload.userId !== "string") return undefined;
    return { userId: payload.userId };
  } catch {
    return undefined;
  }
}
