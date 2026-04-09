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
      console.log('📌 Products API: Processing request...')
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
        searchConditions.push({ featured: true })
      }

      if (category) {
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
          select: {
            id: true,
            name: true,
            slug: true,
            description: true,
            price: true,
            comparePrice: true,
            featured: true,
            status: true,
            category: {
              select: { id: true, name: true, slug: true }
            },
            images: {
              select: { id: true, url: true, alt: true, position: true },
              orderBy: { position: 'asc' },
              take: 2 // Only get first 2 images for list view
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
        data: products,
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

      // Return error details for debugging (remove after fixing)
      res.status(500).json({
        message: 'Internal server error',
        error: errorMessage,
        stack: errorStack?.split('\n').slice(0, 3).join('\n')
      })
    }
  } else {
    res.status(405).json({ message: 'Method not allowed' })
  }
}