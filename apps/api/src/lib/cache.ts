import Redis from 'ioredis'

export type Cache = ReturnType<typeof createCache>

/**
 * Thin JSON wrapper over ioredis. Scoped to the current process; safe to share across
 * requests (ioredis internally pools commands on one connection).
 */
export function createCache(url: string) {
  const redis = new Redis(url, {
    lazyConnect: false,
    maxRetriesPerRequest: 2,
    enableReadyCheck: true,
  })
  redis.on('error', (err) => console.error('redis:', err.message))

  async function get<T>(key: string): Promise<T | null> {
    try {
      const raw = await redis.get(key)
      return raw ? (JSON.parse(raw) as T) : null
    } catch {
      return null
    }
  }

  async function set(key: string, value: unknown, ttlSec: number) {
    try {
      await redis.set(key, JSON.stringify(value), 'EX', ttlSec)
    } catch {
      // cache writes are best-effort
    }
  }

  async function del(...keys: Array<string>) {
    if (keys.length === 0) return
    try {
      await redis.del(keys)
    } catch {
      /* noop */
    }
  }

  async function delByPrefix(prefix: string) {
    try {
      const stream = redis.scanStream({ match: `${prefix}*`, count: 200 })
      for await (const batch of stream as AsyncIterable<Array<string>>) {
        if (batch.length > 0) await redis.del(batch)
      }
    } catch {
      /* noop */
    }
  }

  return { get, set, del, delByPrefix, redis }
}
