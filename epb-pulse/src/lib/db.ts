import { PrismaClient } from '@/generated/prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

// Helper for raw SQL queries (used by LLM-generated queries)
export async function executeRawQuery<T>(sql: string): Promise<T[]> {
  const result = await prisma.$queryRawUnsafe<T[]>(sql)
  return result
}
