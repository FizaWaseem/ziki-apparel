import { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'

/**
 * DATABASE CHECK ENDPOINT
 * Comprehensive inspection of database state
 * No auth required for debugging
 */

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    if (req.method !== 'GET') {
        return res.status(405).json({ message: 'Method not allowed' })
    }

    try {
        console.log('🔍 Starting comprehensive database check...')

        // Get all counts
        const counts = {
            users: await prisma.user.count(),
            categories: await prisma.category.count(),
            products: await prisma.product.count(),
            productImages: await prisma.productImage.count(),
            productVariants: await prisma.productVariant.count(),
            cartItems: await prisma.cartItem.count(),
            reviews: await prisma.review.count(),
            orders: await prisma.order.count()
        }

        // Get products with status breakdown
        const productsByStatus = await prisma.product.groupBy({
            by: ['status'],
            _count: true
        })

        // Get all products with basic info
        const allProducts = await prisma.product.findMany({
            select: {
                id: true,
                name: true,
                slug: true,
                status: true,
                categoryId: true,
                price: true,
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

        // Note: With proper foreign key constraints, orphaned records
        // shouldn't exist. No need to check for them.

        // Get detailed product info (first product as example)
        let sampleProduct = null
        if (allProducts.length > 0) {
            const productId = allProducts[0].id
            sampleProduct = await prisma.product.findUnique({
                where: { id: productId },
                include: {
                    category: true,
                    images: { select: { id: true, url: true, position: true } },
                    variants: { select: { id: true, size: true, color: true, stock: true, price: true } },
                    _count: { select: { reviews: true } }
                }
            })
        }

        const report = {
            timestamp: new Date().toISOString(),
            environment: process.env.NODE_ENV,
            database: {
                counts,
                productsByStatus,
                totalActiveProducts: productsByStatus.find(p => p.status === 'ACTIVE')?._count ?? 0
            },
            DataIntegrity: {
                allProducts,
                sampleProduct,
                potentialIssues: {
                    missingImages: allProducts.filter(p => p._count.images === 0).length,
                    missingVariants: allProducts.filter(p => p._count.variants === 0).length
                }
            },
            recommendations: generateRecommendations(counts, productsByStatus, allProducts)
        }

        return res.status(200).json(report)

    } catch (error) {
        console.error('❌ Database check error:', error)
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'

        return res.status(500).json({
            message: 'Database check failed',
            error: errorMessage
        })
    }
}

function generateRecommendations(
    counts: Record<string, number>,
    statuses: Array<{ status: string; _count: number }>,
    products: Array<{ _count: { images: number; variants: number } }>
): string[] {
    const recs: string[] = []

    if (counts.products === 0) {
        recs.push('⚠️ NO PRODUCTS - Run db-seed-v2 to initialize')
    }

    if (counts.categories === 0) {
        recs.push('⚠️ NO CATEGORIES - Run db-seed-v2 to initialize')
    }

    const active = statuses.find(s => s.status === 'ACTIVE')?._count ?? 0
    const draft = statuses.find(s => s.status === 'DRAFT')?._count ?? 0
    const archived = statuses.find(s => s.status === 'ARCHIVED')?._count ?? 0

    if (counts.products > 0 && active === 0) {
        recs.push(`⚠️ NO ACTIVE PRODUCTS - Have ${draft} draft, ${archived} archived (${counts.products} total)`)
    }

    const noImages = products.filter((p) => p._count?.images === 0).length
    if (noImages > 0) {
        recs.push(`⚠️ ${noImages} PRODUCTS WITHOUT IMAGES`)
    }

    const noVariants = products.filter((p) => p._count?.variants === 0).length
    if (noVariants > 0) {
        recs.push(`⚠️ ${noVariants} PRODUCTS WITHOUT VARIANTS`)
    }

    if (recs.length === 0) {
        recs.push('✅ Database looks healthy')
    }

    return recs
}
