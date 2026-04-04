import { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    const { slug: productId } = req.query

    if (!productId || typeof productId !== 'string') {
      return res.status(400).json({ message: 'Product ID is required' })
    }

    // Get the current product to understand its category
    const currentProduct = await prisma.product.findUnique({
      where: { id: productId },
      select: {
        id: true,
        categoryId: true,
        price: true
      }
    })

    if (!currentProduct) {
      return res.status(404).json({ message: 'Product not found' })
    }

    // Define price range (±30% of current product price)
    const minPrice = currentProduct.price * 0.7
    const maxPrice = currentProduct.price * 1.3

    // Get related products based on:
    // 1. Same category
    // 2. Similar price range
    // 3. Exclude current product
    const relatedProducts = await prisma.product.findMany({
      where: {
        AND: [
          { id: { not: productId } },
          { status: 'ACTIVE' },
          {
            OR: [
              // Same category
              { categoryId: currentProduct.categoryId },
              // Similar price range
              {
                price: {
                  gte: minPrice,
                  lte: maxPrice
                }
              }
            ]
          }
        ]
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
          select: { reviews: true }
        }
      },
      orderBy: [
        // Prioritize same category
        { categoryId: currentProduct.categoryId ? 'asc' : 'desc' },
        // Then by featured status
        { featured: 'desc' },
        // Then by review count
        { reviews: { _count: 'desc' } },
        // Finally by creation date
        { createdAt: 'desc' }
      ],
      take: 8
    })

    // If we don't have enough related products, get some popular/featured products
    if (relatedProducts.length < 4) {
      const additionalProducts = await prisma.product.findMany({
        where: {
          AND: [
            { id: { not: productId } },
            { status: 'ACTIVE' },
            { 
              id: { 
                notIn: relatedProducts.map(p => p.id) 
              } 
            }
          ]
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
            select: { reviews: true }
          }
        },
        orderBy: [
          { featured: 'desc' },
          { reviews: { _count: 'desc' } },
          { createdAt: 'desc' }
        ],
        take: 8 - relatedProducts.length
      })

      relatedProducts.push(...additionalProducts)
    }

    // Calculate average rating for each product (simplified - you might want to add this to your schema)
    const productsWithRating = await Promise.all(
      relatedProducts.map(async (product) => {
        const reviews = await prisma.review.findMany({
          where: { productId: product.id },
          select: { rating: true }
        })

        const avgRating = reviews.length > 0
          ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
          : 0

        return {
          ...product,
          avgRating: Math.round(avgRating * 10) / 10
        }
      })
    )

    res.status(200).json(productsWithRating)

  } catch (error) {
    console.error('Related products error:', error)
    res.status(500).json({ message: 'Failed to get related products' })
  }
}