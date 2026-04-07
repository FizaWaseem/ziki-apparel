import { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'

/**
 * DATABASE CLEAN ENDPOINT
 * Completely wipes all product-related data for a fresh start
 * Keeps user accounts and orders for reference
 * 
 * ⚠️ DESTRUCTIVE - Use with caution!
 * No auth required for emergency cleanup
 */

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    console.log('🧹 DESTRUCTIVE: Cleaning database...')

    // Delete in correct order to respect foreign keys
    console.log('  | Deleting cart items...')
    const deletedCartItems = await prisma.cartItem.deleteMany({})

    console.log('  | Deleting order items...')
    const deletedOrderItems = await prisma.orderItem.deleteMany({})

    console.log('  | Deleting reviews...')
    const deletedReviews = await prisma.review.deleteMany({})

    console.log('  | Deleting product variants...')
    const deletedVariants = await prisma.productVariant.deleteMany({})

    console.log('  | Deleting product images...')
    const deletedImages = await prisma.productImage.deleteMany({})

    console.log('  | Deleting products...')
    const deletedProducts = await prisma.product.deleteMany({})

    console.log('  | Deleting categories...')
    const deletedCategories = await prisma.category.deleteMany({})

    console.log('✅ Database cleaned')

    return res.status(200).json({
      message: 'Database cleaned successfully',
      deleted: {
        products: deletedProducts.count,
        categories: deletedCategories.count,
        variants: deletedVariants.count,
        images: deletedImages.count,
        reviews: deletedReviews.count,
        cartItems: deletedCartItems.count,
        orderItems: deletedOrderItems.count
      },
      nextStep: 'POST to /api/admin/db-seed-v2 to initialize with fresh data'
    })

  } catch (error) {
    console.error('❌ Clean error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'

    return res.status(500).json({
      message: 'Clean failed',
      error: errorMessage
    })
  }
}
