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

  if (req.method === 'GET') {
    try {
      console.log('📌 Products API: Processing request...', { 
        featured: req.query.featured,
        limit: req.query.limit,
        env: process.env.NODE_ENV
      })

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

      const {
        page = '1',
        limit = '12',
        category,
        search,
        minPrice,
        maxPrice,
        sort = 'createdAt',
        order = 'desc',
        featured
      } = req.query

      const skip = (parseInt(page as string) - 1) * parseInt(limit as string)
      const take = parseInt(limit as string)

      // Build where clause with proper typing
      const searchConditions: Prisma.ProductWhereInput[] = []

      // Add featured filter if specified
      if (featured === 'true') {
        console.log('🔍 Filtering for featured products')
        searchConditions.push({ featured: true })
      }

      if (category) {
        console.log('🔍 Filtering by category:', category)
        searchConditions.push({
          category: {
            slug: category as string
          }
        })
      }

      if (search) {
        searchConditions.push({
          OR: [
            { name: { contains: search as string, mode: 'insensitive' as Prisma.QueryMode } },
            { description: { contains: search as string, mode: 'insensitive' as Prisma.QueryMode } }
          ]
        })
      }

      if (minPrice || maxPrice) {
        const priceCondition: Prisma.FloatFilter = {}
        if (minPrice) priceCondition.gte = parseFloat(minPrice as string)
        if (maxPrice) priceCondition.lte = parseFloat(maxPrice as string)
        searchConditions.push({ price: priceCondition })
      }

      const finalWhere: Prisma.ProductWhereInput = searchConditions.length > 0
        ? { AND: [...searchConditions, { status: 'ACTIVE' }] }
        : { status: 'ACTIVE' }

      console.log('📋 Query conditions:', JSON.stringify(finalWhere, null, 2))

      // Build orderBy clause
      const orderBy =
        sort === 'price' ? { price: order as 'asc' | 'desc' } :
          sort === 'name' ? { name: order as 'asc' | 'desc' } :
            { createdAt: order as 'asc' | 'desc' }

      console.log('📊 Products API: Fetching products...')

      // Simplified query - avoid timeout issues
      const [products, totalCount] = await Promise.all([
        prisma.product.findMany({
          where: finalWhere,
          include: {
            category: {
              select: { id: true, name: true, slug: true }
            },
            images: {
              orderBy: { position: 'asc' },
              take: 2  // Only get first 2 images for list view
            },
            _count: {
              select: { reviews: true, variants: true }
            }
          },
          orderBy,
          skip,
          take,
        }),
        prisma.product.count({ where: finalWhere })
      ])

      const totalPages = Math.ceil(totalCount / take)

      console.log(`✅ Products API: Successfully fetched ${products.length} products (${totalCount} total, page ${page}/${totalPages})`)
      res.status(200).json({
        products: products.map(p => ({
          id: p.id,
          name: p.name,
          slug: p.slug,
          description: p.description,
          price: p.price,
          comparePrice: p.comparePrice,
          featured: p.featured,
          status: p.status,
          category: p.category,
          images: p.images,
          _count: p._count
        })),
        pagination: {
          page: parseInt(page as string),
          limit: take,
          totalCount,
          totalPages,
          hasNextPage: parseInt(page as string) < totalPages,
          hasPrevPage: parseInt(page as string) > 1
        }
      })

    } catch (error) {
      console.error('❌ Products API error:', error)
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