import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../auth/[...nextauth]'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { rateLimitMiddleware, RATE_LIMITS } from '@/lib/rateLimit'

const updateHeroSlideSchema = z.object({
  type: z.enum(['image', 'video']).optional(),
  src: z.string().min(1).optional(),
  poster: z.string().optional(),
  title: z.string().min(1).optional(),
  subtitle: z.string().optional(),
  ctaText: z.string().optional(),
  ctaLink: z.string().optional(),
  position: z.number().int().optional(),
  active: z.boolean().optional(),
})

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Rate limiting
  if (!rateLimitMiddleware(req, res, RATE_LIMITS.DEFAULT)) {
    return
  }

  const session = await getServerSession(req, res, authOptions)

  // Check admin authorization
  if (!session?.user || session.user.role !== 'ADMIN') {
    return res
      .status(401)
      .json({ message: 'Unauthorized - Admin access required' })
  }

  const { id } = req.query

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ message: 'Invalid hero slide ID' })
  }

  try {
    // GET - Fetch single hero slide
    if (req.method === 'GET') {
      const heroSlide = await prisma.heroSlide.findUnique({
        where: { id },
      })

      if (!heroSlide) {
        return res.status(404).json({ message: 'Hero slide not found' })
      }

      return res.status(200).json(heroSlide)
    }

    // PUT - Update hero slide
    if (req.method === 'PUT') {
      const data = updateHeroSlideSchema.parse(req.body)

      // Verify hero slide exists
      const existing = await prisma.heroSlide.findUnique({
        where: { id },
      })

      if (!existing) {
        return res.status(404).json({ message: 'Hero slide not found' })
      }

      const updated = await prisma.heroSlide.update({
        where: { id },
        data,
      })

      return res.status(200).json({
        message: 'Hero slide updated successfully',
        heroSlide: updated,
      })
    }

    // DELETE - Remove hero slide
    if (req.method === 'DELETE') {
      const existing = await prisma.heroSlide.findUnique({
        where: { id },
      })

      if (!existing) {
        return res.status(404).json({ message: 'Hero slide not found' })
      }

      await prisma.heroSlide.delete({
        where: { id },
      })

      // Reorder remaining slides
      const remaining = await prisma.heroSlide.findMany({
        orderBy: { position: 'asc' },
      })

      await Promise.all(
        remaining.map((slide, index) =>
          prisma.heroSlide.update({
            where: { id: slide.id },
            data: { position: index },
          })
        )
      )

      return res.status(200).json({
        message: 'Hero slide deleted successfully',
      })
    }

    res.status(405).json({ message: 'Method not allowed' })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        message: 'Validation error',
        errors: error.issues,
      })
    }

    console.error('Hero slide error:', error)
    res.status(500).json({ message: 'Internal server error' })
  }
}
