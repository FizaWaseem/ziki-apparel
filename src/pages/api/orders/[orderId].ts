import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../auth/[...nextauth]'
import { prisma } from '@/lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions)

  if (!session?.user?.id) {
    return res.status(401).json({ message: 'Unauthorized' })
  }

  const { orderId } = req.query
  const userId = session.user.id

  if (req.method === 'GET') {
    try {
      const order = await prisma.order.findFirst({
        where: { 
          id: orderId as string,
          userId, // Ensure user can only access their own orders
        },
        include: {
          items: {
            include: {
              product: {
                include: {
                  images: {
                    orderBy: { position: 'asc' },
                    take: 1,
                  },
                  category: true,
                },
              },
              variant: true,
            },
          },
        },
      })

      if (!order) {
        return res.status(404).json({ message: 'Order not found' })
      }

      return res.status(200).json(order)
    } catch (error) {
      console.error('Error fetching order:', error)
      return res.status(500).json({ message: 'Internal server error' })
    }
  }

  return res.status(405).json({ message: 'Method not allowed' })
}