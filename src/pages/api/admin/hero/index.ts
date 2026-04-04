import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../auth/[...nextauth]'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { rateLimitMiddleware, RATE_LIMITS } from '@/lib/rateLimit'

const heroSlideSchema = z.object({
  type: z.enum(['image', 'video']),
  src: z.string().min(1, 'Image/Video URL is required'),
  poster: z.string().optional(),
  title: z.string().min(1, 'Title is required'),
  subtitle: z.string().optional(),
  ctaText: z.string().default('Shop Now'),
  ctaLink: z.string().default('/products'),
  position: z.number().int().default(0),
  active: z.boolean().default(true),
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

  try {
    // GET - Fetch all hero slides
    if (req.method === 'GET') {
      const heroSlides = await prisma.heroSlide.findMany({
        orderBy: { position: 'asc' },
      })

      return res.status(200).json(heroSlides)
    }

    // POST - Create new hero slide
    if (req.method === 'POST') {
      const data = heroSlideSchema.parse(req.body)

      // Get the highest position
      const maxPosition = await prisma.heroSlide.findFirst({
        orderBy: { position: 'desc' },
        select: { position: true },
      })

      const newPosition = (maxPosition?.position ?? -1) + 1

      const heroSlide = await prisma.heroSlide.create({
        data: {
          ...data,
          position: newPosition,
        },
      })

      return res.status(201).json({
        message: 'Hero slide created successfully',
        heroSlide,
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
