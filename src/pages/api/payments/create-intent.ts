import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]'
import { stripe } from '@/lib/stripe'
import { z } from 'zod'
import { rateLimitMiddleware, RATE_LIMITS } from '@/lib/rateLimit'

const createPaymentIntentSchema = z.object({
  amount: z.number().min(1, 'Amount must be greater than 0'),
  currency: z.string().default('usd'),
  metadata: z.object({
    orderId: z.string().optional(),
    customerEmail: z.string().email().optional(),
  }).optional(),
})

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Rate limiting for payment operations
  if (!rateLimitMiddleware(req, res, RATE_LIMITS.STRICT)) {
    return
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    const session = await getServerSession(req, res, authOptions)
    if (!session) {
      return res.status(401).json({ message: 'Unauthorized' })
    }

    const { amount, currency, metadata } = createPaymentIntentSchema.parse(req.body)

    // Create payment intent with Stripe
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency,
      metadata: {
        userId: session.user.id,
        ...metadata,
      },
      automatic_payment_methods: {
        enabled: true,
      },
    })

    res.status(200).json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    })

  } catch (error) {
    console.error('Create payment intent error:', error)
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        message: 'Validation error', 
        errors: error.issues 
      })
    }
    
    res.status(500).json({ message: 'Failed to create payment intent' })
  }
}