import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { sendOrderStatusUpdateEmail } from '../../../../lib/emailService';

const updateOrderSchema = z.object({
  status: z.enum(['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED']),
  trackingNumber: z.string().optional(),
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);
  
  if (!session?.user) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const { orderId } = req.query;

  if (typeof orderId !== 'string') {
    return res.status(400).json({ message: 'Invalid order ID' });
  }

  if (req.method === 'GET') {
    try {
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: {
          items: {
            include: {
              product: {
                include: {
                  images: {
                    orderBy: { position: 'asc' },
                    take: 1,
                  },
                },
              },
              variant: true,
            },
          },
        },
      });

      if (!order) {
        return res.status(404).json({ message: 'Order not found' });
      }

      // Only allow users to view their own orders (unless admin)
      if (order.userId !== session.user.id && session.user.role !== 'admin') {
        return res.status(403).json({ message: 'Access denied' });
      }

      return res.status(200).json(order);
    } catch (error) {
      console.error('Error fetching order:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  }

  if (req.method === 'PATCH') {
    try {
      // Only allow admins to update order status
      if (session.user.role !== 'admin') {
        return res.status(403).json({ message: 'Admin access required' });
      }

      const validation = updateOrderSchema.safeParse(req.body);
      
      if (!validation.success) {
        return res.status(400).json({ 
          message: 'Invalid update data',
          errors: validation.error.issues 
        });
      }

      const { status, trackingNumber } = validation.data;

      // Get the current order
      const currentOrder = await prisma.order.findUnique({
        where: { id: orderId },
        include: {
          user: true,
        },
      });

      if (!currentOrder) {
        return res.status(404).json({ message: 'Order not found' });
      }

      // Update the order
      const updatedOrder = await prisma.order.update({
        where: { id: orderId },
        data: {
          status,
          ...(trackingNumber && { trackingNumber }),
          updatedAt: new Date(),
        },
        include: {
          items: {
            include: {
              product: true,
              variant: true,
            },
          },
          user: true,
        },
      });

      // Send status update email if status changed
      if (currentOrder.status !== status) {
        try {
          const emailOrderData = {
            id: updatedOrder.id,
            total: updatedOrder.total,
            status: updatedOrder.status,
            paymentMethod: updatedOrder.paymentMethod,
            shippingAddress: updatedOrder.shippingAddress,
            createdAt: updatedOrder.createdAt,
          };

          await sendOrderStatusUpdateEmail(
            updatedOrder.user.email, 
            emailOrderData, 
            status.toLowerCase()
          );
        } catch (emailError) {
          console.error('Error sending status update email:', emailError);
          // Don't fail the update if email fails
        }
      }

      return res.status(200).json(updatedOrder);
    } catch (error) {
      console.error('Error updating order:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  }

  return res.status(405).json({ message: 'Method not allowed' });
}