import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Validate DATABASE_URL before creating client
if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL environment variable is not set!')
  console.error('Please set DATABASE_URL in your .env.local or Vercel environment variables.')
  throw new Error('DATABASE_URL is required')
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

// Test connection on startup
prisma.$connect()
  .then(() => {
    console.log('✅ Database connection established')
  })
  .catch((err) => {
    console.error('❌ Failed to connect to database:', err.message)
  })

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