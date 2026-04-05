import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../auth/[...nextauth]'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { sendOrderConfirmationEmail, sendAdminNewOrderNotification } from '../../../lib/emailService'
import { rateLimitMiddleware, RATE_LIMITS } from '@/lib/rateLimit'
// Define ShippingAddress type to match the schema
type ShippingAddress = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
};

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
    type: z.enum(['cod', 'jazzcash', 'bank']),
    jazzCashTransactionId: z.string().optional(),
    jazzCashScreenshotPath: z.string().optional(),
    bankName: z.string().optional(),
    bankAccountNumber: z.string().optional(),
    bankAccountName: z.string().optional(),
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
  // Rate limiting for order operations
  if (!rateLimitMiddleware(req, res, RATE_LIMITS.DEFAULT)) {
    return
  }
  const session = await getServerSession(req, res, authOptions)

  // For GET requests, require authentication
  if (req.method === 'GET') {
    if (!session?.user?.id) {
      return res.status(401).json({ message: 'Unauthorized' })
    }

    const userId = session.user.id
    try {
      const { all } = req.query;

      // If 'all' parameter is present and user is admin, fetch all orders
      if (all === 'true' && session.user.role === 'ADMIN') {
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

      // Get or create user for guest checkout
      let userId: string
      if (session?.user?.id) {
        // Authenticated user
        userId = session.user.id
      } else {
        // Guest user - create a temporary guest account with email from shipping address
        const guestUser = await prisma.user.findUnique({
          where: { email: shippingAddress.email }
        })

        if (guestUser) {
          // Email already exists
          userId = guestUser.id
        } else {
          // Create a new guest user
          const newGuestUser = await prisma.user.create({
            data: {
              email: shippingAddress.email,
              name: `${shippingAddress.firstName} ${shippingAddress.lastName}`,
              role: 'CUSTOMER' // Guest users are treated as customers
            }
          })
          userId = newGuestUser.id
        }
      }

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
        // Determine payment status based on payment method
        let paymentStatus = 'PENDING'
        if (paymentMethod.type === 'jazzcash' || paymentMethod.type === 'bank') {
          paymentStatus = 'PROCESSING'
        }

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
            paymentStatus: paymentStatus,
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

        // Clear user's cart if authenticated
        if (session?.user?.id) {
          await tx.cartItem.deleteMany({
            where: { userId: session.user.id },
          })
        }

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
          const shipping: ShippingAddress = completeOrder.shippingAddress as ShippingAddress;
          const emailOrderData = {
            id: completeOrder.id,
            total: completeOrder.total,
            status: completeOrder.status,
            paymentMethod: completeOrder.paymentMethod ?? '',
            shippingAddress: {
              firstName: shipping.firstName,
              lastName: shipping.lastName,
              email: shipping.email,
              phone: shipping.phone,
              addressLine1: (shipping as unknown as { addressLine1?: string }).addressLine1 ?? shipping.address ?? '',
              addressLine2: (shipping as unknown as { addressLine2?: string }).addressLine2 ?? '',
              city: shipping.city,
              state: shipping.state,
              zipCode: shipping.zipCode,
              country: shipping.country,
            },
            createdAt: completeOrder.createdAt,
            items: completeOrder.items.map((item: {
              id: string;
              quantity: number;
              price: number;
              variant?: { size?: string | null } | null;
              product: { id: string; name: string; price: number };
            }) => ({
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

      // Send admin notification
      try {
        if (completeOrder) {
          const paymentDetails = {
            type: paymentMethod.type,
            ...(paymentMethod.type === 'jazzcash' && {
              transactionId: paymentMethod.jazzCashTransactionId,
            }),
            ...(paymentMethod.type === 'bank' && {
              bankName: paymentMethod.bankName,
              bankAccountNumber: paymentMethod.bankAccountNumber,
            }),
          };

          // Create properly typed admin order data
          const shipping = completeOrder.shippingAddress as unknown as ShippingAddress;
          const adminOrderData = {
            id: completeOrder.id,
            total: completeOrder.total,
            status: completeOrder.status,
            paymentMethod: completeOrder.paymentMethod ?? '',
            shippingAddress: {
              firstName: shipping.firstName,
              lastName: shipping.lastName,
              email: shipping.email,
              phone: shipping.phone,
              addressLine1: shipping.address ?? '',
              addressLine2: '',
              city: shipping.city,
              state: shipping.state,
              zipCode: shipping.zipCode,
              country: shipping.country,
            },
            createdAt: completeOrder.createdAt,
            items: (completeOrder.items ?? []).map(item => ({
              id: item.id,
              quantity: item.quantity,
              price: item.price,
              size: item.variant?.size || 'Standard',
              product: {
                id: item.product.id,
                name: item.product.name,
                price: item.product.price,
              },
            })),
          };

          interface PaymentDetails {
            type: string;
            transactionId?: string;
            bankName?: string;
            bankAccountNumber?: string;
          }

          const typedPaymentDetails: PaymentDetails = paymentDetails;

          await sendAdminNewOrderNotification(adminOrderData, typedPaymentDetails);
        }
      } catch (adminEmailError) {
        console.error('Error sending admin notification:', adminEmailError);
        // Don't fail the order creation if admin email fails
      }

      return res.status(201).json(completeOrder)
    } catch (error) {
      console.error('Error creating order:', error)
      return res.status(500).json({ message: 'Internal server error' })
    }
  }

  return res.status(405).json({ message: 'Method not allowed' })
}