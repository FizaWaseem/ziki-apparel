import { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === 'GET') {
    try {
      const {
        page = '1',
        limit = '12',
        category,
        search,
        minPrice,
        maxPrice,
        sort = 'createdAt',
        order = 'desc'
      } = req.query

      const skip = (parseInt(page as string) - 1) * parseInt(limit as string)
      const take = parseInt(limit as string)

      // Build where clause with proper typing
      const searchConditions: Prisma.ProductWhereInput[] = []

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
        ? { AND: searchConditions }
        : {}

      // Build orderBy clause
      const orderBy =
        sort === 'price' ? { price: order as 'asc' | 'desc' } :
          sort === 'name' ? { name: order as 'asc' | 'desc' } :
            { createdAt: order as 'asc' | 'desc' }

      const [products, totalCount] = await Promise.all([
        prisma.product.findMany({
          where: finalWhere,
          include: {
            category: true,
            images: {
              orderBy: { position: 'asc' }
            },
            variants: {
              orderBy: { size: 'asc' }
            },
            _count: {
              select: { reviews: true }
            }
          },
          orderBy,
          skip,
          take,
        }),
        prisma.product.count({ where: finalWhere })
      ])

      const totalPages = Math.ceil(totalCount / take)

      res.status(200).json({
        products,
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
      console.error('Products API error:', error)
      res.status(500).json({ message: 'Internal server error' })
    }
  } else {
    res.status(405).json({ message: 'Method not allowed' })
  }
}