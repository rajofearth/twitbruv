import { URL } from "node:url"

export function resolveRedisUrl(
  redisUrl: string,
  opts?: { password?: string | null; username?: string | null },
): string {
  const p = opts?.password?.trim()
  const user = opts?.username?.trim()
  if (!p && !user) return redisUrl
  let u: URL
  try {
    u = new URL(redisUrl)
  } catch {
    return redisUrl
  }
  if (user && !u.username) u.username = user
  if (p && !u.password) u.password = p
  return u.toString()
}
