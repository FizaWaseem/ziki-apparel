import { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Add CORS headers for cross-origin requests
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

  if (req.method === 'GET') {
    try {
      console.log('📌 Categories API: Fetching from database...')

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

      const categories = await prisma.category.findMany({
        include: {
          _count: {
            select: {
              products: {
                where: {
                  status: 'ACTIVE'
                }
              }
            }
          }
        },
        orderBy: { name: 'asc' }
      })

      console.log(`✅ Categories API: Successfully fetched ${categories.length} categories`)
      res.status(200).json(categories)

    } catch (error) {
      console.error('❌ Categories API error:', error)
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

      // Return error details for debugging
      res.status(statusCode).json({
        message: 'Internal server error',
        error: errorMessage,
        type: error?.constructor?.name || 'Unknown'
      })
    }
  } else {
    res.status(405).json({ message: 'Method not allowed' })
  }
}