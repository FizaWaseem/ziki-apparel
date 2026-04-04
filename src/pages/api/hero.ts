import { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    // Fetch only active hero slides, ordered by position
    const heroSlides = await prisma.heroSlide.findMany({
      where: { active: true },
      orderBy: { position: 'asc' },
    })

    // If no hero slides exist, return empty array (will use fallback in frontend)
    res.status(200).json(heroSlides)
  } catch (error) {
    console.error('Error fetching hero slides:', error)
    // Return empty array on error instead of error response
    // This prevents homepage from breaking
    res.status(200).json([])
  }
}
