import { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    try {
        console.log('🔍 Health Check: Testing environment and database connection...')
        
        // Check environment
        const env = {
            nodeEnv: process.env.NODE_ENV || 'unknown',
            hasDbUrl: !!process.env.DATABASE_URL,
            hasDirectUrl: !!process.env.DIRECT_URL,
            dbHost: process.env.DATABASE_URL?.split('@')[1]?.split(':')[0] || 'unknown'
        }
        
        console.log('📋 Environment:', env)

        // Test database connection with a simple query
        console.log('📌 Health Check: Testing database query...')
        const users = await prisma.user.count()
        console.log('✅ Health Check: Database connection OK. User count:', users)

        return res.status(200).json({
            status: 'ok',
            database: 'connected',
            userCount: users,
            environment: env,
            timestamp: new Date().toISOString()
        })
    } catch (error) {
        console.error('❌ Health Check Failed:', error)

        if (error instanceof Error) {
            console.error('Error details:')
            console.error('  Name:', error.name)
            console.error('  Message:', error.message)
            console.error('  Stack:', error.stack?.split('\n').slice(0, 3).join('\n'))

            return res.status(500).json({
                status: 'error',
                database: 'connection_failed',
                error: error.message,
                name: error.name,
                troubleshooting: {
                    step1: 'Check DATABASE_URL is set in Vercel Environment Variables',
                    step2: 'Verify Supabase credentials are correct',
                    step3: 'Ensure firewall allows connection to Supabase',
                    step4: 'Check if Supabase project is paused'
                }
            })
        }

        return res.status(500).json({
            status: 'error',
            database: 'connection_failed',
            error: String(error)
        })
    }
}
