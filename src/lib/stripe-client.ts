// Client-side Stripe configuration
// This file only contains the publishable key - safe for browser

export const STRIPE_PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY

if (!STRIPE_PUBLISHABLE_KEY && typeof window !== 'undefined') {
    console.warn('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is not set in environment variables')
}
