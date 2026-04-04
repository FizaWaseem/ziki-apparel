import { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { z } from 'zod'

const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  newPassword: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string().min(6, 'Password must be at least 6 characters'),
}).refine(data => data.newPassword === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword']
})

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    const validation = resetPasswordSchema.safeParse(req.body)
    if (!validation.success) {
      return res.status(400).json({ 
        message: 'Invalid input',
        errors: validation.error.issues
      })
    }

    const { token, newPassword } = validation.data

    // Find reset token
    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token }
    })

    if (!resetToken) {
      return res.status(400).json({ message: 'Invalid or expired reset link' })
    }

    // Check if token is expired
    if (resetToken.expires < new Date()) {
      // Delete expired token
      await prisma.passwordResetToken.delete({
        where: { token }
      })
      return res.status(400).json({ message: 'Reset link has expired' })
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: resetToken.email }
    })

    if (!user) {
      return res.status(400).json({ message: 'User not found' })
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 12)

    // Update password and delete reset token
    await Promise.all([
      prisma.user.update({
        where: { id: user.id },
        data: { password: hashedPassword }
      }),
      prisma.passwordResetToken.delete({
        where: { token }
      })
    ])

    return res.status(200).json({ message: 'Password reset successfully' })
  } catch (error) {
    console.error('Error resetting password:', error)
    return res.status(500).json({ message: 'Internal server error' })
  }
}
