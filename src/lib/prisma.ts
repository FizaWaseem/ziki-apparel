import { PrismaClient } from '@prisma/client'

declare const globalThis: {
  prisma?: PrismaClient
}

// Validate DATABASE_URL before creating client
if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL environment variable is not set!')
  console.error('Please set DATABASE_URL in your .env.local or Vercel environment variables.')
  throw new Error('DATABASE_URL is required')
}

/**
 * Prisma Client Singleton Pattern
 * 
 * ⚠️ CRITICAL FOR PRODUCTION:
 * - MUST cache the instance in PRODUCTION to prevent connection pool exhaustion
 * - Each new PrismaClient instance in serverless creates new DB connections
 * - Vercel limits concurrent connections; without caching all are exhausted
 * - Development can use hot reload (acceptable), production MUST reuse instance
 * 
 * ✅ The condition MUST be: if (NODE_ENV === 'production') cache it
 * ❌ If condition was !== 'production', it inverts logic and breaks production
 */
export const prisma: PrismaClient =
  globalThis.prisma ||
  new PrismaClient({
    log:
      process.env.NODE_ENV === 'development'
        ? ['error', 'warn']
        : ['error'],
  })

// ✅ CORRECT: Cache ONLY in production
if (process.env.NODE_ENV === 'production') {
  globalThis.prisma = prisma
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