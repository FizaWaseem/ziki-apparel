import { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === 'GET') {
    try {
      const categories = await prisma.category.findMany({
        include: {
          _count: {
            select: {
              products: {
                where: {
                  status: 'ACTIVE'
                }
              }
            }
          }
        },
        orderBy: { name: 'asc' }
      })

      res.status(200).json(categories)

    } catch (error) {
      console.error('Categories API error:', error)
      res.status(500).json({ message: 'Internal server error' })
    }
  } else {
    res.status(405).json({ message: 'Method not allowed' })
  }
}