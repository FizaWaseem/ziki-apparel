import { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    const { limit = '6' } = req.query

    // FIXED: Use select instead of include for efficiency
    // Get popular products based on multiple factors
    const popularProducts = await prisma.product.findMany({
      where: {
        status: 'ACTIVE'
      },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        price: true,
        comparePrice: true,
        featured: true,
        category: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        },
        images: {
          select: {
            id: true,
            url: true,
            alt: true,
            position: true
          },
          orderBy: { position: 'asc' as const },
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
        { featured: 'desc' as const },
        // Products with more reviews
        { reviews: { _count: 'desc' as const } },
        // Products with more orders
        { orderItems: { _count: 'desc' as const } },
        // Recently created
        { createdAt: 'desc' as const }
      ],
      take: parseInt(limit as string)
    })

    // FIXED: Fetch all reviews in ONE query instead of N+1
    const reviewData = await prisma.review.groupBy({
      by: ['productId'],
      where: {
        productId: {
          in: popularProducts.map(p => p.id)
        }
      },
      _avg: {
        rating: true
      }
    })

    // Create a map for quick lookup
    const ratingMap = new Map(
      reviewData.map(r => [r.productId, r._avg.rating ?? 0])
    )

    // Add ratings and popularity score
    const productsWithRating = popularProducts.map((product) => {
      const avgRating = ratingMap.get(product.id) ?? 0
      
      return {
        ...product,
        avgRating: Math.round(avgRating * 10) / 10,
        popularityScore:
          product._count.reviews * 3 +
          product._count.orderItems * 5 +
          product._count.cartItems * 1
      }
    })

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