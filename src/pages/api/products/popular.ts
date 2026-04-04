import { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    const { limit = '6' } = req.query

    // Get popular products based on multiple factors
    const popularProducts = await prisma.product.findMany({
      where: {
        status: 'ACTIVE'
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        },
        images: {
          orderBy: { position: 'asc' },
          take: 1
        },
        _count: {
          select: { 
            reviews: true,
            orderItems: true,
            cartItems: true
          }
        }
      },
      orderBy: [
        // Featured products first
        { featured: 'desc' },
        // Products with more reviews
        { reviews: { _count: 'desc' } },
        // Products with more orders
        { orderItems: { _count: 'desc' } },
        // Recently created
        { createdAt: 'desc' }
      ],
      take: parseInt(limit as string)
    }) as Array<
      Awaited<ReturnType<typeof prisma.product.findMany>>[number] & {
        _count: {
          reviews: number;
          orderItems: number;
          cartItems: number;
        }
      }
    >

    // Calculate average rating for each product
    const productsWithRating = await Promise.all(
      popularProducts.map(async (product) => {
        const reviews = await prisma.review.findMany({
          where: { productId: product.id },
          select: { rating: true }
        })

        const avgRating = reviews.length > 0
          ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
          : 0

        return {
          ...product,
          avgRating: Math.round(avgRating * 10) / 10,
          popularityScore:
            product._count.reviews * 3 +
            product._count.orderItems * 5 +
            product._count.cartItems * 1
        }
      })
    )

    // Sort by popularity score
    const sortedProducts = productsWithRating.sort((a, b) => 
      b.popularityScore - a.popularityScore || 
      (b.featured ? 1 : 0) - (a.featured ? 1 : 0)
    )

    res.status(200).json(sortedProducts)

  } catch (error) {
    console.error('Popular products error:', error)
    res.status(500).json({ message: 'Failed to get popular products' })
  }
}