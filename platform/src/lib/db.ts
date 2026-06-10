import { PrismaClient } from "@prisma/client";

// Singleton Prisma client. In dev, hot-reload would otherwise spawn a new client
// (and a new connection pool) on every edit and exhaust Postgres connections.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
