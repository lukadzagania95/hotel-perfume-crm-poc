import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

const existingPrisma = globalForPrisma.prisma as (PrismaClient & {
  incomingEmail?: unknown;
}) | undefined;

export const prisma =
  existingPrisma?.incomingEmail
    ? existingPrisma
    : new PrismaClient({
        log: ["error", "warn"],
      });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
