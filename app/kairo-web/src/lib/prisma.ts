import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool as NeonPool, neonConfig } from "@neondatabase/serverless";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL!;

  // Use Neon serverless pool on Vercel, regular pg adapter locally
  const isServerless = !!process.env.VERCEL;
  const pool = isServerless ? new NeonPool({ connectionString }) : undefined;

  const adapter = pool
    ? new PrismaPg({ pool })
    : new PrismaPg({ connectionString });

  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
