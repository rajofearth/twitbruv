import type { MiddlewareHandler } from 'hono'
import type { AppContext } from '../lib/context.ts'

export type HonoEnv = {
  Variables: {
    ctx: AppContext
    session: { user: { id: string; email: string }; session: { id: string } } | null
  }
}

export function sessionMiddleware(ctx: AppContext): MiddlewareHandler<HonoEnv> {
  return async (c, next) => {
    c.set('ctx', ctx)
    try {
      const session = await ctx.auth.api.getSession({ headers: c.req.raw.headers })
      c.set('session', session as HonoEnv['Variables']['session'])
    } catch {
      c.set('session', null)
    }
    await next()
  }
}

export function requireAuth(): MiddlewareHandler<HonoEnv> {
  return async (c, next) => {
    const session = c.get('session')
    if (!session) return c.json({ error: 'unauthorized' }, 401)
    await next()
  }
}
