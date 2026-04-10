import { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Add CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true')
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT')
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  )

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.status(200).end()
    return
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    console.log('📌 Hero API: Fetching slides from database...')

    // Verify database connection
    try {
      await prisma.$queryRaw`SELECT 1`
      console.log('✅ DB Connection OK')
    } catch (connErr) {
      console.error('❌ DB Connection Failed:', connErr)
      return res.status(503).json({
        message: 'Database unavailable',
        error: 'Connection failed'
      })
    }

    // Fetch only active hero slides, ordered by position
    const heroSlides = await prisma.heroSlide.findMany({
      where: { active: true },
      orderBy: { position: 'asc' },
    })

    console.log(`✅ Hero API: Found ${heroSlides.length} active slides`)
    // If no hero slides exist, return empty array (will use fallback in frontend)
    res.status(200).json(heroSlides)
  } catch (error) {
    console.error('❌ Error fetching hero slides:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    const errorStack = error instanceof Error ? error.stack : ''
    console.error('Error details:', errorMessage)
    console.error('Stack:', errorStack)

    // Check error type
    let statusCode = 500
    if (error instanceof Prisma.PrismaClientRustPanicError) {
      statusCode = 503
      console.error('🚨 Prisma Rust Panic - likely database issue')
    } else if (error instanceof Prisma.PrismaClientValidationError) {
      statusCode = 400
      console.error('🚨 Validation error')
    }

    // Return error details instead of empty array to help diagnose
    res.status(statusCode).json({
      message: 'Internal server error',
      error: errorMessage,
      type: error?.constructor?.name || 'Unknown'
    })
  }
}
