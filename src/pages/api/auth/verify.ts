import { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  const { email, password } = req.body

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: 'Email and password are required',
      type: 'validation_error'
    })
  }

  try {
    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { email }
    })

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Email not registered. Please create an account first.',
        type: 'email_not_found',
        code: 'USER_NOT_FOUND'
      })
    }

    // Check if user has a password (must be registered user, not social login)
    if (!user.password) {
      return res.status(401).json({
        success: false,
        message: 'Please set a password to sign in. Use the "Forgot Password" option to create one.',
        type: 'no_password',
        code: 'NO_PASSWORD'
      })
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password)

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Incorrect password. Please try again.',
        type: 'invalid_password',
        code: 'INVALID_PASSWORD'
      })
    }

    // Success
    return res.status(200).json({
      success: true,
      message: 'Credentials verified',
      type: 'success',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    })
  } catch (error) {
    console.error('Auth verification error:', error)

    // Log full error details
    if (error instanceof Error) {
      console.error('Error name:', error.name)
      console.error('Error message:', error.message)
      console.error('Error stack:', error.stack)

      if (error.message.includes('prepared statement')) {
        console.error('❌ Database connection error - prepared statement conflict.')
        console.error('   → Restart the dev server: Kill the terminal and run `yarn run dev` again')
      }
      if (error.message.includes('ECONNREFUSED')) {
        console.error('❌ Database connection refused - Supabase may be down or DATABASE_URL is incorrect')
      }
      if (error.message.includes('permission denied')) {
        console.error('❌ Database permission denied - check Supabase credentials')
      }
    }

    return res.status(500).json({
      success: false,
      message: 'An error occurred during authentication. Please try again.',
      type: 'server_error',
      error: process.env.NODE_ENV === 'development' ? error instanceof Error ? error.message : String(error) : undefined
    })
  }
}
