import { RateLimiter } from 'limiter'
import Redis, { Redis as RedisType } from 'ioredis'
import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'

// Define a type for the Redis client methods we use
interface MinimalRedisClient {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, mode: string, duration: number): Promise<unknown>;
}

// Initialize Redis client (only if not provided in constructor)
let redis: MinimalRedisClient;

interface RateLimitConfig {
  tokensPerInterval: number
  interval: number | 'second' | 'sec' | 'minute' | 'min' | 'hour' | 'hr' | 'day'
}

const defaultConfig: RateLimitConfig = {
  tokensPerInterval: 100,  // 100 requests
  interval: 'hour'       // per hour
}

export class RateLimitManager {
  private limiters: Map<string, RateLimiter> = new Map()
  private redisClient: MinimalRedisClient

  constructor(
    private config: RateLimitConfig = defaultConfig,
    redisInstance?: MinimalRedisClient // Optional Redis client for testing
  ) {
    if (redisInstance) {
      this.redisClient = redisInstance
    } else {
      // Ensure redis is initialized only once globally if not provided
      if (!redis) {
        redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379')
      }
      this.redisClient = redis
    }
  }

  private getLimiterKey(identifier: string): string {
    return `rate-limit:${identifier}`
  }

  private async getLimiter(identifier: string): Promise<RateLimiter> {
    const key = this.getLimiterKey(identifier)
    let limiter = this.limiters.get(key)

    if (!limiter) {
      // Try to get existing state from Redis
      const tokens = await this.redisClient.get(key)
      
      limiter = new RateLimiter({
        tokensPerInterval: this.config.tokensPerInterval,
        interval: this.config.interval
      })

      if (tokens) {
        limiter.tryRemoveTokens(parseInt(tokens, 10))
      }

      this.limiters.set(key, limiter)
    }

    return limiter
  }

  async isRateLimited(identifier: string): Promise<boolean> {
    const limiter = await this.getLimiter(identifier)
    return !limiter.tryRemoveTokens(1)
  }

  async saveState(identifier: string): Promise<void> {
    const key = this.getLimiterKey(identifier)
    const limiter = this.limiters.get(key)
    
    if (limiter) {
      await this.redisClient.set(key, limiter.getTokensRemaining().toString(), 'EX', 3600)
    }
  }
}

// Middleware creator for rate limiting
export function createRateLimitMiddleware(config?: RateLimitConfig) {
  const manager = new RateLimitManager(config)

  return async function rateLimitMiddleware(
    req: NextRequest
  ): Promise<NextResponse | null> {
    // Get identifier from X-Forwarded-For or fallback to a default
    const forwardedFor = req.headers.get('x-forwarded-for')
    const identifier = req.headers.get('x-api-key') || 
                      forwardedFor?.split(',')[0] || 
                      'anonymous'
    
    // Check rate limit
    const isLimited = await manager.isRateLimited(identifier)
    
    if (isLimited) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429 }
      )
    }

    // Save state to Redis
    await manager.saveState(identifier)
    
    return null
  }
} 