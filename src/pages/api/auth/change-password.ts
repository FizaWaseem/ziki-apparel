import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { authOptions } from './[...nextauth]'
import { z } from 'zod'

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
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
    const session = await getServerSession(req, res, authOptions)
    
    if (!session?.user?.id) {
      return res.status(401).json({ message: 'Not authenticated' })
    }

    // Validate input
    const validation = changePasswordSchema.safeParse(req.body)
    if (!validation.success) {
      return res.status(400).json({ 
        message: 'Invalid input',
        errors: validation.error.issues
      })
    }

    const { currentPassword, newPassword } = validation.data

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: session.user.id }
    })

    if (!user || !user.password) {
      return res.status(400).json({ message: 'User not found or has no password set' })
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password)
    if (!isPasswordValid) {
      return res.status(400).json({ message: 'Current password is incorrect' })
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 12)

    // Update password
    await prisma.user.update({
      where: { id: session.user.id },
      data: { password: hashedPassword }
    })

    return res.status(200).json({ message: 'Password changed successfully' })
  } catch (error) {
    console.error('Error changing password:', error)
    return res.status(500).json({ message: 'Internal server error' })
  }
}
