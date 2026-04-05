import { NextApiRequest, NextApiResponse } from 'next'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { rateLimitMiddleware, RATE_LIMITS } from '@/lib/rateLimit'

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Rate limiting for registration attempts
  if (!rateLimitMiddleware(req, res, RATE_LIMITS.AUTH)) {
    return
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    const { name, email, password } = registerSchema.parse(req.body)

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'This email is already registered. Please sign in or use a different email.',
        type: 'email_exists',
        code: 'USER_EXISTS'
      })
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Create user
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
      },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
      }
    })

    res.status(201).json({
      success: true,
      message: 'Account created successfully! Please sign in.',
      type: 'success',
      user
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      const fieldErrors: { [key: string]: string } = {}
      error.issues.forEach(issue => {
        const field = issue.path[0] as string
        if (field === 'email') {
          fieldErrors[field] = 'Please enter a valid email address'
        } else if (field === 'password') {
          fieldErrors[field] = 'Password must be at least 6 characters'
        } else if (field === 'name') {
          fieldErrors[field] = 'Name must be at least 2 characters'
        } else {
          fieldErrors[field] = issue.message
        }
      })
      
      return res.status(400).json({
        success: false,
        message: 'Please fix the errors below',
        type: 'validation_error',
        errors: fieldErrors
      })
    }

    console.error('Registration error:', error)
    res.status(500).json({
      success: false,
      message: 'An error occurred during registration. Please try again.',
      type: 'server_error'
    })
  }
}