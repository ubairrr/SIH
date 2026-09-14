import type { Role } from "@prisma/client";

// RED-phase stub — not yet implemented. See user-guards.test.ts's <behavior>
// contract; GREEN phase fills these in.
export function assertNotSelfTarget(_actorId: string, _targetId: string): void {
  throw new Error("not implemented");
}

export function assertNotLastActiveAdmin(_input: {
  targetRole: Role;
  targetIsActive: boolean;
  activeAdminCount: number;
  removesAdminStatus: boolean;
}): void {
  throw new Error("not implemented");
}
