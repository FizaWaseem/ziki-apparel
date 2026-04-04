import { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    const { q } = req.query
    
    if (!q || typeof q !== 'string' || q.length < 2) {
      return res.status(200).json([])
    }

    const query = q.trim()

    // Get product suggestions based on name and description
    const products = await prisma.product.findMany({
      where: {
        AND: [
          { status: 'ACTIVE' },
          {
            OR: [
              { name: { contains: query } },
              { description: { contains: query } }
            ]
          }
        ]
      },
      select: {
        id: true,
        name: true,
        slug: true,
        price: true,
        images: {
          select: {
            url: true,
            alt: true
          },
          orderBy: { position: 'asc' },
          take: 1
        },
        category: {
          select: {
            name: true
          }
        }
      },
      take: 8,
      orderBy: [
        { featured: 'desc' },
        { name: 'asc' }
      ]
    })

    // Get category suggestions
    const categories = await prisma.category.findMany({
      where: {
        name: { contains: query }
      },
      select: {
        id: true,
        name: true,
        slug: true
      },
      take: 3
    })

    // Suggestion type definition
    type Suggestion =
      | {
          type: 'product'
          id: string
          name: string
          slug: string
          price: number
          image?: string
          category?: string
          url: string
        }
      | {
          type: 'category'
          id: string
          name: string
          slug: string
          url: string
        }
      | {
          type: 'search'
          id: string
          name: string
          url: string
        }

    // Format suggestions
    const suggestions: Suggestion[] = [
      ...products.map(product => ({
        type: 'product' as const,
        id: product.id,
        name: product.name,
        slug: product.slug,
        price: product.price,
        image: product.images[0]?.url,
        category: product.category?.name,
        url: `/products/${product.slug}`
      })),
      ...categories.map(category => ({
        type: 'category' as const,
        id: category.id,
        name: category.name,
        slug: category.slug,
        url: `/products?category=${category.slug}`
      }))
    ]

    // Add search term suggestion
    if (suggestions.length > 0) {
      suggestions.unshift({
        type: 'search' as const,
        id: 'search',
        name: `Search for "${query}"`,
        url: `/products?search=${encodeURIComponent(query)}`
      })
    }

    res.status(200).json(suggestions)

  } catch (error) {
    console.error('Search suggestions error:', error)
    res.status(500).json({ message: 'Failed to get search suggestions' })
  }
}