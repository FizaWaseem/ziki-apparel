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
    const [totalOrders, totalProducts, totalCustomers, recentOrdersRaw, revenue] = await Promise.all([
      // Total orders count
      prisma.order.count(),
      
      // Total products count
      prisma.product.count(),
      
      // Total customers count
      prisma.user.count({
        where: { role: 'CUSTOMER' }
      }),
      
      // Recent orders (fetch base order fields first to avoid required relation crashes)
      prisma.order.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          userId: true,
          total: true,
          status: true,
          createdAt: true,
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

    const userIds = Array.from(new Set(recentOrdersRaw.map((order) => order.userId).filter(Boolean)));
    const users = userIds.length > 0
      ? await prisma.user.findMany({
          where: { id: { in: userIds } },
          select: {
            id: true,
            name: true,
            email: true,
          },
        })
      : [];

    const usersById = new Map(users.map((user) => [user.id, user]));

    const dashboardStats = {
      totalOrders,
      totalRevenue: revenue._sum.total || 0,
      totalProducts,
      totalCustomers,
      recentOrders: recentOrdersRaw.map(order => {
        const customer = usersById.get(order.userId);
        return {
        id: order.id,
        customerName: customer?.name || 'Unknown',
        customerEmail: customer?.email || 'N/A',
        total: order.total,
        status: order.status,
        createdAt: order.createdAt.toISOString(),
      }}),
    };

    return res.status(200).json(dashboardStats);
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}