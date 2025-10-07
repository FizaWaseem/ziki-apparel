import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../auth/[...nextauth]'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { sendOrderConfirmationEmail } from '../../../lib/emailService'

const createOrderSchema = z.object({
  shippingAddress: z.object({
    firstName: z.string().min(1),
    lastName: z.string().min(1),
    email: z.string().email(),
    phone: z.string().min(1),
    address: z.string().min(1),
    city: z.string().min(1),
    state: z.string().min(1),
    zipCode: z.string().min(1),
    country: z.string().min(1),
  }),
  paymentMethod: z.object({
    type: z.enum(['card', 'cod']),
    cardNumber: z.string().optional(),
    expiryDate: z.string().optional(),
    cvv: z.string().optional(),
    cardholderName: z.string().optional(),
  }),
  items: z.array(z.object({
    productId: z.string(),
    variantId: z.string().optional(),
    quantity: z.number().min(1),
    price: z.number().min(0),
  })),
  summary: z.object({
    subtotal: z.number(),
    tax: z.number(),
    shipping: z.number(),
    total: z.number(),
    itemCount: z.number(),
  }),
})

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions)

  if (!session?.user?.id) {
    return res.status(401).json({ message: 'Unauthorized' })
  }

  const userId = session.user.id

  if (req.method === 'GET') {
    try {
      const { all } = req.query;
      
      // If 'all' parameter is present and user is admin, fetch all orders
      if (all === 'true' && session.user.role === 'admin') {
        const orders = await prisma.order.findMany({
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
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        });
        
        return res.status(200).json(orders);
      }
      
      // Otherwise, fetch only user's orders
      const orders = await prisma.order.findMany({
        where: { userId },
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
        orderBy: { createdAt: 'desc' },
      })

      return res.status(200).json(orders)
    } catch (error) {
      console.error('Error fetching orders:', error)
      return res.status(500).json({ message: 'Internal server error' })
    }
  }

  if (req.method === 'POST') {
    try {
      const validation = createOrderSchema.safeParse(req.body)
      
      if (!validation.success) {
        return res.status(400).json({ 
          message: 'Invalid order data',
          errors: validation.error.issues 
        })
      }

      const { shippingAddress, paymentMethod, items, summary } = validation.data

      // Check if all products and variants exist and have sufficient stock
      for (const item of items) {
        const product = await prisma.product.findUnique({
          where: { id: item.productId },
          include: {
            variants: item.variantId ? {
              where: { id: item.variantId }
            } : false
          }
        })

        if (!product) {
          return res.status(400).json({ 
            message: `Product not found: ${item.productId}` 
          })
        }

        if (item.variantId) {
          const variant = await prisma.productVariant.findUnique({
            where: { id: item.variantId }
          })

          if (!variant) {
            return res.status(400).json({ 
              message: `Product variant not found: ${item.variantId}` 
            })
          }

          if (variant.stock < item.quantity) {
            return res.status(400).json({ 
              message: `Insufficient stock for ${product.name} (${variant.size})` 
            })
          }
        }
      }

      // Create the order
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const order = await prisma.$transaction(async (tx: any) => {
        // Create order
        const newOrder = await tx.order.create({
          data: {
            userId,
            status: 'PENDING',
            total: summary.total,
            subtotal: summary.subtotal,
            tax: summary.tax,
            shipping: summary.shipping,
            shippingAddress: {
              firstName: shippingAddress.firstName,
              lastName: shippingAddress.lastName,
              email: shippingAddress.email,
              phone: shippingAddress.phone,
              address: shippingAddress.address,
              city: shippingAddress.city,
              state: shippingAddress.state,
              zipCode: shippingAddress.zipCode,
              country: shippingAddress.country,
            },
            paymentMethod: paymentMethod.type,
            paymentStatus: paymentMethod.type === 'cod' ? 'PENDING' : 'PROCESSING',
          },
        })

        // Create order items
        for (const item of items) {
          await tx.orderItem.create({
            data: {
              orderId: newOrder.id,
              productId: item.productId,
              variantId: item.variantId || null,
              quantity: item.quantity,
              price: item.price,
            },
          })

          // Update stock for variants
          if (item.variantId) {
            await tx.productVariant.update({
              where: { id: item.variantId },
              data: {
                stock: {
                  decrement: item.quantity,
                },
              },
            })
          }
        }

        // Clear user's cart
        await tx.cartItem.deleteMany({
          where: { userId },
        })

        return newOrder
      })

      // Fetch the complete order with items for response
      const completeOrder = await prisma.order.findUnique({
        where: { id: order.id },
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
      })

      // Send order confirmation email
      try {
        if (completeOrder) {
          // Transform the order data for email service
          const emailOrderData = {
            id: completeOrder.id,
            total: completeOrder.total,
            status: completeOrder.status,
            paymentMethod: completeOrder.paymentMethod,
            shippingAddress: completeOrder.shippingAddress,
            createdAt: completeOrder.createdAt,
            items: completeOrder.items.map((item: any) => ({
              id: item.id,
              quantity: item.quantity,
              price: item.price,
              size: item.variant?.size || 'Standard',
              product: {
                id: item.product.id,
                name: item.product.name,
                price: item.product.price,
              }
            }))
          };

          await sendOrderConfirmationEmail(shippingAddress.email, emailOrderData);
        }
      } catch (emailError) {
        console.error('Error sending order confirmation email:', emailError);
        // Don't fail the order creation if email fails
      }

      return res.status(201).json(completeOrder)
    } catch (error) {
      console.error('Error creating order:', error)
      return res.status(500).json({ message: 'Internal server error' })
    }
  }

  return res.status(405).json({ message: 'Method not allowed' })
}