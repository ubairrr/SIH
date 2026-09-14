import { authorize } from "@/app/lib/authorize";
import { prisma } from "@/app/lib/prisma";
import { AdminUsersPageClient } from "./users-page-client";

// AUTH-04/AUTH-05/LOG-01: Admin's full user-management surface. Data-fetch
// starts with authorize({ role: "ADMIN" }) — the real server-side gate;
// passwordHash is never selected, so it can never reach the client bundle.
export default async function AdminUsersPage() {
  const admin = await authorize({ role: "ADMIN" });

  const users = await prisma.user.findMany({
    orderBy: { fullName: "asc" },
    select: {
      id: true,
      fullName: true,
      username: true,
      role: true,
      designation: true,
      unit: true,
      badgeId: true,
      isActive: true,
    },
  });

  return <AdminUsersPageClient users={users} currentUserId={admin.id} />;
}
