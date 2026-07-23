import { prisma } from '@/lib/prisma'
import type { NextApiRequest, NextApiResponse } from 'next'
import bcrypt from 'bcryptjs'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { email, password } = req.body

    console.log(`[DEBUG] Auth test for email: ${email}`)

    // 1. Check if user exists
    const user = await prisma.user.findUnique({
      where: { email },
    })

    console.log(`[DEBUG] User found:`, user ? 'YES' : 'NO')

    if (!user) {
      return res.status(401).json({ error: 'User not found', email })
    }

    console.log(`[DEBUG] User password field:`, user.password ? 'SET' : 'NULL')

    if (!user.password) {
      return res.status(401).json({ error: 'User has no password' })
    }

    // 2. Test bcrypt comparison
    const isPasswordValid = await bcrypt.compare(password, user.password)
    console.log(`[DEBUG] Password match:`, isPasswordValid)

    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid password' })
    }

    // 3. All good
    return res.status(200).json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
    })
  } catch (error) {
    console.error('[DEBUG] Auth test error:', error)
    return res.status(500).json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : String(error),
    })
  }
}
