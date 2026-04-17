import { createClient } from '@supabase/supabase-js'

// Initialize Supabase Storage client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ Missing Supabase environment variables')
    console.error('Add these to Vercel Environment Variables:')
    console.error('- NEXT_PUBLIC_SUPABASE_URL')
    console.error('- NEXT_PUBLIC_SUPABASE_ANON_KEY')
}

export const supabase = createClient(
    supabaseUrl || '',
    supabaseAnonKey || ''
)

// Bucket name for product images
export const PRODUCT_IMAGES_BUCKET = 'product-images'
