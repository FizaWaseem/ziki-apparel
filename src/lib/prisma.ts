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

// Test connection on startup
prisma.$connect()
  .then(() => {
    console.log('✅ Database connection established')
    console.log(`📍 Connected to: ${dbUrl.split('@')[1]?.split(':')[0] || 'Supabase'}`)
    console.log(`🔒 Using: ${process.env.NODE_ENV === 'production' ? 'CONNECTION POOLER' : 'DIRECT CONNECTION'}`)
  })
  .catch((err) => {
    console.error('❌ Failed to connect to database:', err.message)
    console.error('🔍 Troubleshooting:')
    console.error('1. Check DATABASE_URL environment variable is set')
    console.error('2. Verify Supabase credentials are correct')
    console.error('3. Ensure firewall allows connection to aws-1-ap-southeast-1.pooler.supabase.com:6543')
    console.error('4. Check Supabase project is running (not paused)')
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