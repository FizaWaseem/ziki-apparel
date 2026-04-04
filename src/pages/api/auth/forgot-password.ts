import { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import crypto from 'crypto'
import { sendEmail } from '@/lib/emailService'

const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address')
})

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    const validation = forgotPasswordSchema.safeParse(req.body)
    if (!validation.success) {
      return res.status(400).json({ 
        message: 'Invalid input',
        errors: validation.error.issues
      })
    }

    const { email } = validation.data

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { email }
    })

    // Always return success message for security (don't reveal if email exists)
    if (!user) {
      return res.status(200).json({ 
        message: 'If an account exists with this email, a password reset link has been sent.' 
      })
    }

    // Delete any existing reset tokens for this email
    await prisma.passwordResetToken.deleteMany({
      where: { email }
    })

    // Generate reset token
    const token = crypto.randomBytes(32).toString('hex')
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

    // Save reset token
    await prisma.passwordResetToken.create({
      data: {
        email,
        token,
        expires: expiresAt
      }
    })

    // Send email with reset link
    const resetUrl = `${process.env.NEXTAUTH_URL}/auth/reset-password?token=${token}`
    
    try {
      await sendEmail({
        to: email,
        subject: 'Reset Your Password - Ziki Apparel',
        html: `
          <h2>Reset Your Password</h2>
          <p>You requested a password reset. Click the link below to reset your password:</p>
          <a href="${resetUrl}" style="background-color: #1f2937; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; display: inline-block;">
            Reset Password
          </a>
          <p>Or copy this link: ${resetUrl}</p>
          <p>This link will expire in 24 hours.</p>
          <p>If you didn&apos;t request this, please ignore this email.</p>
        `
      })
    } catch (emailError) {
      console.error('Failed to send email:', emailError)
      // Continue anyway - don't fail the API request
    }

    return res.status(200).json({ 
      message: 'If an account exists with this email, a password reset link has been sent.' 
    })
  } catch (error) {
    console.error('Error in forgot password:', error)
    return res.status(500).json({ message: 'Internal server error' })
  }
}
