import { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    try {
        // Test 1: Can we reach Prisma?
        console.log('🔍 Health Check: Testing Prisma connection...')

        // Test database connection with a simple query
        const users = await prisma.user.count()
        console.log('✅ Health Check: Database connection OK. User count:', users)

        return res.status(200).json({
            status: 'ok',
            database: 'connected',
            userCount: users,
            timestamp: new Date().toISOString()
        })
    } catch (error) {
        console.error('❌ Health Check Failed:', error)

        if (error instanceof Error) {
            console.error('Error details:')
            console.error('  Name:', error.name)
            console.error('  Message:', error.message)
            console.error('  Stack:', error.stack)

            return res.status(500).json({
                status: 'error',
                database: 'connection_failed',
                error: error.message,
                name: error.name
            })
        }

        return res.status(500).json({
            status: 'error',
            database: 'connection_failed',
            error: String(error)
        })
    }
}
