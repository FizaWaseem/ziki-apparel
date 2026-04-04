import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]'
import { stripe } from '@/lib/stripe'
import { z } from 'zod'

const confirmPaymentSchema = z.object({
  paymentIntentId: z.string(),
})

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    const session = await getServerSession(req, res, authOptions)
    if (!session) {
      return res.status(401).json({ message: 'Unauthorized' })
    }

    const { paymentIntentId } = confirmPaymentSchema.parse(req.body)

    // Retrieve payment intent from Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId)

    // Verify the payment belongs to the current user
    if (paymentIntent.metadata.userId !== session.user.id) {
      return res.status(403).json({ message: 'Forbidden' })
    }

    res.status(200).json({
      status: paymentIntent.status,
      paymentIntent: {
        id: paymentIntent.id,
        amount: paymentIntent.amount / 100, // Convert back from cents
        currency: paymentIntent.currency,
        status: paymentIntent.status,
        metadata: paymentIntent.metadata,
      }
    })

  } catch (error) {
    console.error('Confirm payment error:', error)
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        message: 'Validation error', 
        errors: error.issues 
      })
    }
    
    res.status(500).json({ message: 'Failed to confirm payment' })
  }
}