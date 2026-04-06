import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === 'development'
        ? ['error', 'warn']  // Reduced logging to error/warn only
        : ['error'],
  })

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}

// Handle graceful shutdown
const handleShutdown = async () => {
  console.log('🛑 Closing database connection...')
  await prisma.$disconnect()
  console.log('✅ Database connection closed')
}

process.on('SIGINT', async () => {
  await handleShutdown()
  process.exit(0)
})

process.on('SIGTERM', async () => {
  await handleShutdown()
  process.exit(0)
})