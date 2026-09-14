import { PrismaClient } from "@prisma/client";

// Standard Next.js dev-mode singleton — avoids exhausting the Postgres
// connection pool from hot-reload creating a new PrismaClient per reload.
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
