import { PrismaClient } from '@prisma/client'

declare const globalThis: {
  prisma?: PrismaClient
}

// Validate DATABASE_URL before creating client
const dbUrl = process.env.DATABASE_URL
const directUrl = process.env.DIRECT_URL

if (!dbUrl) {
  console.error('❌ DATABASE_URL environment variable is not set!')
  console.error(`Environment: ${process.env.NODE_ENV || 'unknown'}`)
  console.error('Vercel: Check Project Settings → Environment Variables')
  console.error('Local: Add DATABASE_URL to .env.local')
  console.error('Supabase: Get connection string from Database Settings')
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
        ? ['error', 'warn', 'query']
        : ['error'],
  })

// ✅ CORRECT: Cache ONLY in production
if (process.env.NODE_ENV === 'production') {
  globalThis.prisma = prisma
}

// NOTE:
// Avoid calling prisma.$connect() at module-import time on serverless (e.g. Vercel).
// It can cause cold-start failures and makes NextAuth return 500 during auth flows
// if the connection test fails.
//
// Prisma will connect lazily when the first query runs.

// Handle graceful shutdown (safe best-effort)
// On Vercel serverless, disconnecting is usually unnecessary; leaving it in place
// but only as best-effort helps avoid abrupt crashes.
const handleShutdown = async () => {
  try {
    console.log('🛑 Closing database connection...')
    await prisma.$disconnect()
    console.log('✅ Database connection closed')
  } catch (e) {
    // ignore
  }
}

if (process.env.NODE_ENV !== 'production') {
  process.on('SIGINT', async () => {
    await handleShutdown()
    process.exit(0)
  })

  process.on('SIGTERM', async () => {
    await handleShutdown()
    process.exit(0)
  })
}
