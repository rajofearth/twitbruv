import Redis from 'ioredis'

export interface FixedWindowLimit {
  windowMs: number
  max: number
}

export interface RateLimiterConfig {
  redis: Redis
  prefix?: string
}

export class RateLimiter {
  private redis: Redis
  private prefix: string

  constructor(config: RateLimiterConfig) {
    this.redis = config.redis
    this.prefix = config.prefix ?? 'rl'
  }

  /** Fixed-window limiter. Returns true when the action is allowed. */
  async check(key: string, limit: FixedWindowLimit): Promise<{ allowed: boolean; remaining: number; resetAt: number }> {
    const bucketMs = limit.windowMs
    const bucket = Math.floor(Date.now() / bucketMs)
    const redisKey = `${this.prefix}:${key}:${bucket}`
    const count = await this.redis.incr(redisKey)
    if (count === 1) {
      await this.redis.pexpire(redisKey, bucketMs + 50)
    }
    return {
      allowed: count <= limit.max,
      remaining: Math.max(0, limit.max - count),
      resetAt: (bucket + 1) * bucketMs,
    }
  }
}

export function createRedisClient(url: string) {
  return new Redis(url, { lazyConnect: false })
}
