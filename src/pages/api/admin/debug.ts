import { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'

/**
 * SIMPLE DEBUG ENDPOINT - No auth required
 * Quick test to verify API is working and database has data
 */

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    try {
        const productCount = await prisma.product.count()
        const categoryCount = await prisma.category.count()

        return res.status(200).json({
            ok: true,
            productCount,
            categoryCount,
            timestamp: new Date().toISOString()
        })
    } catch (error) {
        return res.status(500).json({
            ok: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        })
    }
}
