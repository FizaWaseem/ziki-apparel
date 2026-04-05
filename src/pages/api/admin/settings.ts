import { getServerSession } from 'next-auth/next'
import { NextApiRequest, NextApiResponse } from 'next'
import { authOptions } from '../auth/[...nextauth]'
import { prisma } from '@/lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions)

  if (!session || session.user.role !== 'ADMIN') {
    return res.status(401).json({ message: 'Unauthorized' })
  }

  if (req.method === 'GET') {
    try {
      const user = await prisma.user.findUnique({
        where: { email: session.user.email! },
        select: {
          id: true,
          name: true,
          email: true,
          role: true
        }
      })

      if (!user) {
        return res.status(404).json({ message: 'User not found' })
      }

      return res.status(200).json(user)
    } catch (error) {
      console.error('Error fetching admin settings:', error)
      return res.status(500).json({ message: 'Failed to fetch settings' })
    }
  }

  if (req.method === 'PUT') {
    try {
      const { name } = req.body

      if (!name || name.trim() === '') {
        return res.status(400).json({ message: 'Name is required' })
      }

      const user = await prisma.user.update({
        where: { email: session.user.email! },
        data: {
          name: name.trim()
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true
        }
      })

      return res.status(200).json({ 
        message: 'Settings updated successfully',
        user 
      })
    } catch (error) {
      console.error('Error updating admin settings:', error)
      return res.status(500).json({ message: 'Failed to update settings' })
    }
  }

  return res.status(405).json({ message: 'Method not allowed' })
}
