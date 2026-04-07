import { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'

/**
 * ADMIN RESET ENDPOINT
 * Clears all products and categories for a fresh start
 * 
 * ⚠️ DESTRUCTIVE - Use with caution!
 * Usage: POST /api/admin/reset-products
 * Header: X-Admin-Secret: <INIT_SECRET>
 */

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method not allowed' })
    }

    try {
        // Verify admin secret (optional for debugging - comment out after testing)
        const initSecret = process.env.INIT_SECRET
        const providedSecret = req.headers['x-admin-secret']

        // Allow access if secret is correct OR if no secret is set (debugging mode)
        if (initSecret && providedSecret !== initSecret) {
            return res.status(401).json({ message: 'Unauthorized' })
        }

        console.log('⚠️ DESTRUCTIVE: Resetting products database...')

        // Delete in correct order to respect foreign keys
        const deletedCartItems = await prisma.cartItem.deleteMany({})
        const deletedOrderItems = await prisma.orderItem.deleteMany({})
        const deletedReviews = await prisma.review.deleteMany({})
        const deletedVariants = await prisma.productVariant.deleteMany({})
        const deletedImages = await prisma.productImage.deleteMany({})
        const deletedProducts = await prisma.product.deleteMany({})
        const deletedCategories = await prisma.category.deleteMany({})

        console.log('✅ Reset complete')

        return res.status(200).json({
            message: 'Products reset successfully',
            deleted: {
                products: deletedProducts.count,
                categories: deletedCategories.count,
                variants: deletedVariants.count,
                images: deletedImages.count,
                reviews: deletedReviews.count,
                cartItems: deletedCartItems.count,
                orderItems: deletedOrderItems.count
            }
        })

    } catch (error) {
        console.error('❌ Reset error:', error)
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'

        return res.status(500).json({
            message: 'Reset failed',
            error: errorMessage
        })
    }
}
