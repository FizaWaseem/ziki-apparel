import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { prisma } from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);

  if (!session?.user || session.user.role !== 'ADMIN') {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Get dashboard statistics
    const [totalOrders, totalProducts, totalCustomers, orders, revenue] = await Promise.all([
      // Total orders count
      prisma.order.count(),
      
      // Total products count
      prisma.product.count(),
      
      // Total customers count
      prisma.user.count({
        where: { role: 'CUSTOMER' }
      }),
      
      // Recent orders
      prisma.order.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              name: true,
              email: true,
            },
          },
        },
      }),
      
      // Total revenue
      prisma.order.aggregate({
        _sum: {
          total: true,
        },
        where: {
          status: {
            in: ['DELIVERED', 'PROCESSING', 'SHIPPED']
          }
        }
      }),
    ]);

    const dashboardStats = {
      totalOrders,
      totalRevenue: revenue._sum.total || 0,
      totalProducts,
      totalCustomers,
      recentOrders: orders.map(order => ({
        id: order.id,
        customerName: order.user.name || 'Unknown',
        customerEmail: order.user.email,
        total: order.total,
        status: order.status,
        createdAt: order.createdAt.toISOString(),
      })),
    };

    return res.status(200).json(dashboardStats);
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}