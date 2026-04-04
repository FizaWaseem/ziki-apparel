import { NextApiRequest, NextApiResponse } from 'next'

// Simple in-memory rate limiter (for single instance)
// For production with multiple instances, use Redis
const requestCounts = new Map<string, { count: number; resetTime: number }>()

export const RATE_LIMITS = {
  DEFAULT: { requests: 100, windowMs: 15 * 60 * 1000 }, // 100 requests per 15 minutes
  STRICT: { requests: 10, windowMs: 15 * 60 * 1000 }, // 10 requests per 15 minutes
  AUTH: { requests: 5, windowMs: 15 * 60 * 1000 }, // 5 requests per 15 minutes (login attempts)
}

export function getRateLimitKey(req: NextApiRequest, prefix: string = ''): string {
  const ip = (req.headers['x-forwarded-for'] ?? req.headers['x-real-ip'] ?? 'unknown') as string
  const cleanIp = Array.isArray(ip) ? ip[0] : ip.split(',')[0].trim()
  return `${prefix}:${cleanIp}`
}

export function checkRateLimit(
  key: string,
  limit: { requests: number; windowMs: number }
): { allowed: boolean; remaining: number; resetTime: number } {
  const now = Date.now()
  const record = requestCounts.get(key)

  if (!record || now > record.resetTime) {
    // Create new rate limit window
    requestCounts.set(key, {
      count: 1,
      resetTime: now + limit.windowMs,
    })
    return {
      allowed: true,
      remaining: limit.requests - 1,
      resetTime: now + limit.windowMs,
    }
  }

  if (record.count >= limit.requests) {
    return {
      allowed: false,
      remaining: 0,
      resetTime: record.resetTime,
    }
  }

  record.count++
  return {
    allowed: true,
    remaining: limit.requests - record.count,
    resetTime: record.resetTime,
  }
}

export function rateLimitMiddleware(
  req: NextApiRequest,
  res: NextApiResponse,
  limit: { requests: number; windowMs: number }
): boolean {
  const key = getRateLimitKey(req)
  const result = checkRateLimit(key, limit)

  // Set rate limit headers
  res.setHeader('X-RateLimit-Limit', limit.requests)
  res.setHeader('X-RateLimit-Remaining', result.remaining)
  res.setHeader('X-RateLimit-Reset', new Date(result.resetTime).toISOString())

  if (!result.allowed) {
    res.status(429).json({
      message: 'Too many requests, please try again later',
      resetTime: new Date(result.resetTime).toISOString(),
    })
    return false
  }

  return true
}
