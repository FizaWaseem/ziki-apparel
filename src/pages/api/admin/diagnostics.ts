import { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'

/**
 * ADMIN DIAGNOSTIC ENDPOINT
 * Shows database contents for debugging
 * 
 * Usage: GET /api/admin/diagnostics
 * Header: X-Admin-Secret: <INIT_SECRET>
 */

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    if (req.method !== 'GET') {
        return res.status(405).json({ message: 'Method not allowed' })
    }

    try {
        // Verify admin secret
        const initSecret = process.env.INIT_SECRET
        const providedSecret = req.headers['x-admin-secret']

        if (!initSecret || providedSecret !== initSecret) {
            return res.status(401).json({ message: 'Unauthorized' })
        }

        // Get database statistics
        const productCount = await prisma.product.count()
        const categoryCount = await prisma.category.count()
        const userCount = await prisma.user.count()
        const variantCount = await prisma.productVariant.count()
        const imageCount = await prisma.productImage.count()

        // Get all products with details
        const products = await prisma.product.findMany({
            select: {
                id: true,
                name: true,
                slug: true,
                status: true,
                price: true,
                categoryId: true,
                featured: true,
                _count: {
                    select: {
                        images: true,
                        variants: true,
                        reviews: true
                    }
                }
            },
            orderBy: { createdAt: 'asc' }
        })

        // Get all categories
        const categories = await prisma.category.findMany({
            select: {
                id: true,
                name: true,
                slug: true,
                _count: {
                    select: { products: true }
                }
            }
        })

        // Get sample product with full details
        const sampleProduct = products.length > 0
            ? await prisma.product.findUnique({
                where: { id: products[0].id },
                include: {
                    images: { select: { id: true, url: true, position: true } },
                    variants: { select: { id: true, size: true, color: true, stock: true, price: true }, take: 3 },
                    category: { select: { name: true, slug: true } }
                }
            })
            : null

        return res.status(200).json({
            environment: process.env.NODE_ENV,
            database: {
                stats: {
                    products: productCount,
                    categories: categoryCount,
                    variants: variantCount,
                    images: imageCount,
                    users: userCount
                },
                products,
                categories,
                sampleProduct: sampleProduct ? {
                    id: sampleProduct.id,
                    name: sampleProduct.name,
                    slug: sampleProduct.slug,
                    status: sampleProduct.status,
                    category: sampleProduct.category?.name,
                    imageCount: sampleProduct.images.length,
                    images: sampleProduct.images,
                    variantCount: sampleProduct.variants.length,
                    variants: sampleProduct.variants
                } : null
            }
        })

    } catch (error) {
        console.error('❌ Diagnostics error:', error)
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'

        return res.status(500).json({
            message: 'Diagnostics failed',
            error: errorMessage,
            stack: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.stack : '') : undefined
        })
    }
}
