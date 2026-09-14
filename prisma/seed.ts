import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

import { DEMO_ACCOUNTS, DEMO_PASSWORD } from "../app/lib/demo-accounts";

const prisma = new PrismaClient();

// D-18: exactly 5 accounts, one per role — the roster lives in
// app/lib/demo-accounts.ts, shared with the login page's Demo Accounts
// panel (D-17) so the two never drift apart.
async function main() {
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);

  for (const seedUser of DEMO_ACCOUNTS) {
    await prisma.user.upsert({
      where: { username: seedUser.username },
      update: {},
      create: { ...seedUser, passwordHash, isActive: true },
    });
  }

  console.log(`Seeded ${DEMO_ACCOUNTS.length} demo accounts (idempotent).`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
