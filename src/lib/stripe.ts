// This file should ONLY be imported on the server side
// Never import this in client components

import Stripe from 'stripe'

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not set in environment variables')
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-09-30.clover',
})

// Client-side publishable key - safe to expose
export const STRIPE_PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY

if (!STRIPE_PUBLISHABLE_KEY && typeof window !== 'undefined') {
  console.warn('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is not set in environment variables')
}