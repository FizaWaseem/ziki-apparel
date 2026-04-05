import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../auth/[...nextauth]'
import { prisma } from '@/lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions)

  const { orderId } = req.query

  if (req.method === 'GET') {
    try {
      // Allow guests to view their order by orderId (no session required)
      // For authenticated users, they can only see their own orders
      const order = await prisma.order.findFirst({
        where: { 
          id: orderId as string,
          ...(session?.user?.id && { userId: session.user.id }) // If authenticated, ensure user owns order
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