import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL!;

  // PrismaPg handles both local and serverless (Neon) connections
  // via the standard PostgreSQL connection string
  const adapter = new PrismaPg({ connectionString });

  return new PrismaClient({ adapter });
}

/**
 * Lazy Prisma client — only instantiated on first access.
 * Prevents build-time errors when DATABASE_URL isn't available
 * (e.g., Vercel build phase with SKIP_ENV_VALIDATION).
 */
export function getPrisma(): PrismaClient {
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = createPrismaClient();
  }
  return globalForPrisma.prisma;
}

// Keep backward-compatible named export via getter
export const prisma = new Proxy({} as PrismaClient, {
  get(_, prop) {
    return (getPrisma() as unknown as Record<string | symbol, unknown>)[prop];
  },
});
