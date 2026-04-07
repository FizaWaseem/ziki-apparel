import { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Add CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true')
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT')
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  )

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.status(200).end()
    return
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    console.log('📌 Hero API: Fetching slides from database...')
    // Fetch only active hero slides, ordered by position
    const heroSlides = await prisma.heroSlide.findMany({
      where: { active: true },
      orderBy: { position: 'asc' },
    })

    console.log(`✅ Hero API: Found ${heroSlides.length} active slides`)
    // If no hero slides exist, return empty array (will use fallback in frontend)
    res.status(200).json(heroSlides)
  } catch (error) {
    console.error('❌ Error fetching hero slides:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('Error details:', errorMessage)
    // Return empty array on error instead of error response
    // This prevents homepage from breaking
    res.status(200).json([])
  }
}
