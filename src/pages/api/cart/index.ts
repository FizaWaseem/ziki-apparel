import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../auth/[...nextauth]'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

interface CartItemWithDetails {
  quantity: number
  variant?: { price?: number } | null
  product: { price: number }
}

const addToCartSchema = z.object({
  productId: z.string(),
  variantId: z.string().optional(),
  quantity: z.number().min(1),
})

const updateCartSchema = z.object({
  quantity: z.number().min(0),
})

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getServerSession(req, res, authOptions)

  if (!session?.user?.id) {
    return res.status(401).json({ message: 'Unauthorized' })
  }

  const userId = session.user.id

  if (req.method === 'GET') {
    try {
      const cartItems = await prisma.cartItem.findMany({
        where: { userId },
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
        orderBy: { createdAt: 'desc' },
      })

      // Calculate cart totals
      const subtotal = cartItems.reduce((total: number, item: CartItemWithDetails) => {
        const price = item.variant?.price || item.product.price
        return total + (price * item.quantity)
      }, 0)

      const tax = subtotal * 0.08 // 8% tax
      const shipping = subtotal > 100 ? 0 : 10 // Free shipping over $100
      const total = subtotal + tax + shipping

      res.status(200).json({
        items: cartItems,
        summary: {
          subtotal: Math.round(subtotal * 100) / 100,
          tax: Math.round(tax * 100) / 100,
          shipping: Math.round(shipping * 100) / 100,
          total: Math.round(total * 100) / 100,
          itemCount: cartItems.reduce((count: number, item: CartItemWithDetails) => count + item.quantity, 0),
        },
      })

    } catch (error) {
      console.error('Cart GET error:', error)
      res.status(500).json({ message: 'Internal server error' })
    }

  } else if (req.method === 'POST') {
    try {
      const { productId, variantId, quantity } = addToCartSchema.parse(req.body)

      // Check if product exists and is active
      const product = await prisma.product.findFirst({
        where: {
          id: productId,
          status: 'ACTIVE',
        },
        include: {
          variants: true,
        },
      })

      if (!product) {
        return res.status(404).json({ message: 'Product not found' })
      }

      // If variant is specified, check stock
      if (variantId) {
        const variant = product.variants.find((v: { id: string }) => v.id === variantId)
        if (!variant) {
          return res.status(404).json({ message: 'Product variant not found' })
        }
        if (variant.stock < quantity) {
          return res.status(400).json({ message: 'Insufficient stock' })
        }
      }

      // Check if item already exists in cart
      const existingCartItem = await prisma.cartItem.findUnique({
        where: {
          userId_productId_variantId: {
            userId,
            productId,
            variantId: variantId || null,
          },
        },
      })

      if (existingCartItem) {
        // Update quantity
        const newQuantity = existingCartItem.quantity + quantity
        
        // Check stock again for updated quantity
        if (variantId) {
          const variant = product.variants.find((v: { id: string; stock: number }) => v.id === variantId)
          if (variant && variant.stock < newQuantity) {
            return res.status(400).json({ message: 'Insufficient stock' })
          }
        }

        const updatedCartItem = await prisma.cartItem.update({
          where: { id: existingCartItem.id },
          data: { quantity: newQuantity },
          include: {
            product: {
              include: {
                images: { take: 1, orderBy: { position: 'asc' } },
              },
            },
            variant: true,
          },
        })

        res.status(200).json({
          message: 'Cart updated',
          item: updatedCartItem,
        })
      } else {
        // Create new cart item
        const cartItem = await prisma.cartItem.create({
          data: {
            userId,
            productId,
            variantId: variantId || null,
            quantity,
          },
          include: {
            product: {
              include: {
                images: { take: 1, orderBy: { position: 'asc' } },
              },
            },
            variant: true,
          },
        })

        res.status(201).json({
          message: 'Item added to cart',
          item: cartItem,
        })
      }

    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          message: 'Validation error',
          errors: error.issues,
        })
      }
      console.error('Cart POST error:', error)
      res.status(500).json({ message: 'Internal server error' })
    }

  } else if (req.method === 'PUT') {
    try {
      const { id } = req.query
      const { quantity } = updateCartSchema.parse(req.body)

      if (!id || typeof id !== 'string') {
        return res.status(400).json({ message: 'Cart item ID is required' })
      }

      const cartItem = await prisma.cartItem.findFirst({
        where: {
          id: id as string,
          userId,
        },
        include: {
          product: true,
          variant: true,
        },
      })

      if (!cartItem) {
        return res.status(404).json({ message: 'Cart item not found' })
      }

      if (quantity === 0) {
        // Remove item from cart
        await prisma.cartItem.delete({
          where: { id: cartItem.id },
        })

        res.status(200).json({ message: 'Item removed from cart' })
      } else {
        // Check stock
        if (cartItem.variant && cartItem.variant.stock < quantity) {
          return res.status(400).json({ message: 'Insufficient stock' })
        }

        // Update quantity
        const updatedCartItem = await prisma.cartItem.update({
          where: { id: cartItem.id },
          data: { quantity },
          include: {
            product: {
              include: {
                images: { take: 1, orderBy: { position: 'asc' } },
              },
            },
            variant: true,
          },
        })

        res.status(200).json({
          message: 'Cart updated',
          item: updatedCartItem,
        })
      }

    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          message: 'Validation error',
          errors: error.issues,
        })
      }
      console.error('Cart PUT error:', error)
      res.status(500).json({ message: 'Internal server error' })
    }

  } else if (req.method === 'DELETE') {
    try {
      const { id } = req.query

      if (!id || typeof id !== 'string') {
        return res.status(400).json({ message: 'Cart item ID is required' })
      }

      const cartItem = await prisma.cartItem.findFirst({
        where: {
          id: id as string,
          userId,
        },
      })

      if (!cartItem) {
        return res.status(404).json({ message: 'Cart item not found' })
      }

      await prisma.cartItem.delete({
        where: { id: cartItem.id },
      })

      res.status(200).json({ message: 'Item removed from cart' })

    } catch (error) {
      console.error('Cart DELETE error:', error)
      res.status(500).json({ message: 'Internal server error' })
    }

  } else {
    res.status(405).json({ message: 'Method not allowed' })
  }
}