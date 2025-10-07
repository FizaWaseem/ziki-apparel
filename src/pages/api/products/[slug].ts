import { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { slug } = req.query

  if (req.method === 'GET') {
    try {
      const product = await prisma.product.findUnique({
        where: {
          slug: slug as string,
          status: 'ACTIVE'
        },
        include: {
          category: true,
          images: {
            orderBy: { position: 'asc' }
          },
          variants: {
            orderBy: { size: 'asc' }
          },
          reviews: {
            include: {
              user: {
                select: {
                  name: true,
                  email: true
                }
              }
            },
            orderBy: { createdAt: 'desc' }
          },
          _count: {
            select: { reviews: true }
          }
        }
      })

      if (!product) {
        return res.status(404).json({ message: 'Product not found' })
      }

      // Calculate average rating
      const avgRating = product.reviews.length > 0
        ? product.reviews.reduce((sum: number, review: { rating: number }) => sum + review.rating, 0) / product.reviews.length
        : 0

      res.status(200).json({
        ...product,
        avgRating: Math.round(avgRating * 10) / 10
      })

    } catch (error) {
      console.error('Product API error:', error)
      res.status(500).json({ message: 'Internal server error' })
    }
  } else {
    res.status(405).json({ message: 'Method not allowed' })
  }
}