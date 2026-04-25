import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { secureHeaders } from 'hono/secure-headers'
import { sql } from '@workspace/db'
import { buildContext } from './lib/context.ts'
import { handleRateLimitError } from './lib/rate-limit.ts'
import { requireSameOrigin, sessionMiddleware, type HonoEnv } from './middleware/session.ts'
import { meRoute } from './routes/me.ts'
import { usersRoute } from './routes/users.ts'
import { postsRoute } from './routes/posts.ts'
import { feedRoute } from './routes/feed.ts'
import { hashtagsRoute } from './routes/hashtags.ts'
import { searchRoute } from './routes/search.ts'
import { createMediaRoute } from './routes/media.ts'
import { signedGetUrl } from '@workspace/media/s3'
import { articlesRoute } from './routes/articles.ts'
import { notificationsRoute } from './routes/notifications.ts'
import { analyticsRoute } from './routes/analytics.ts'
import { dmsRoute } from './routes/dms.ts'
import { invitesRoute } from './routes/invites.ts'
import { reportsRoute } from './routes/reports.ts'
import { federationRoute } from './routes/federation.ts'
import { adminRoute } from './routes/admin.ts'

const ctx = await buildContext()
const app = new Hono<HonoEnv>()

// Structured request log via pino. JSON in production, pretty in dev. Skip the noisy media
// proxy + healthcheck — every page paint hits those and they'd swamp logs.
app.use('*', async (c, next) => {
  const start = Date.now()
  await next()
  const path = c.req.path
  if (path === '/healthz' || path === '/readyz' || path.startsWith('/api/m/')) return
  ctx.log.info(
    { method: c.req.method, path, status: c.res.status, ms: Date.now() - start },
    'req',
  )
})
app.use(
  '*',
  secureHeaders({
    // CORP/COEP block legitimate cross-origin loads (the web app pulling images and JSON from
    // this API). Cross-origin access control is enforced by the CORS middleware below; turning
    // these off avoids browser-level blocks on `<img src="https://api.../api/m/...">`.
    crossOriginResourcePolicy: false,
    crossOriginEmbedderPolicy: false,
  }),
)
app.use(
  '*',
  cors({
    origin: ctx.env.AUTH_TRUSTED_ORIGINS,
    credentials: true,
    allowHeaders: ['Content-Type', 'Authorization'],
    allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    exposeHeaders: ['Set-Cookie'],
    maxAge: 86400,
  }),
)
app.use('*', sessionMiddleware(ctx))
app.use('*', requireSameOrigin(ctx.env.AUTH_TRUSTED_ORIGINS))

// Liveness: process is up. Kept cheap so Railway can hammer it.
app.get('/healthz', (c) => c.json({ ok: true }))

// Readiness: DB is reachable. Returns 503 if the ping fails so Railway can route around a
// half-broken instance instead of serving 500s to users.
app.get('/readyz', async (c) => {
  try {
    await ctx.db.execute(sql`SELECT 1`)
    return c.json({ ok: true })
  } catch (err) {
    ctx.log.error({ err: errMsg(err) }, 'readyz_db_ping_failed')
    return c.json({ ok: false, error: 'db_unreachable' }, 503)
  }
})

function errMsg(err: unknown): string {
  return err instanceof Error ? err.message : String(err)
}

// Mount better-auth (handles /api/auth/*). Apply IP-based rate limits on the most-abused
// flows (signup + signin) before delegating to better-auth — it doesn't enforce any.
app.on(['POST', 'GET'], '/api/auth/*', async (c) => {
  if (c.req.method === 'POST') {
    if (c.req.path.endsWith('/sign-up/email')) await ctx.rateLimit(c, 'auth.signup')
    else if (c.req.path.endsWith('/sign-in/email')) await ctx.rateLimit(c, 'auth.signin')
  }
  return ctx.auth.handler(c.req.raw)
})

app.route('/api/me', meRoute)
app.route('/api/users', usersRoute)
app.route('/api/posts', postsRoute)
app.route('/api/feed', feedRoute)
app.route('/api/hashtags', hashtagsRoute)
app.route('/api/search', searchRoute)
app.route('/api/media', createMediaRoute({ s3: ctx.s3, mediaEnv: ctx.mediaEnv, boss: ctx.boss }))

// Signing proxy: takes a stored object key on the path, mints a 1h signed URL, and 302s the
// browser to it. We cache the redirect for a few minutes so repeated `<img>` paints don't
// thrash signing. The signed URL itself stays valid past the cache so refreshes hit the same
// underlying object cheaply.
app.get('/api/m/*', async (c) => {
  // Recover the object key by stripping every leading occurrence of the route prefix. Belt
  // and suspenders for any path-doubling that happens upstream (proxies, custom domains).
  let key = c.req.path
  while (key.startsWith('/')) key = key.slice(1)
  while (key.startsWith('api/m/')) key = key.slice('api/m/'.length)
  key = decodeURIComponent(key)
  if (!key) return c.json({ error: 'missing_key' }, 400)
  if (key.includes('..')) return c.json({ error: 'bad_key' }, 400)

  const signed = await signedGetUrl({
    s3: ctx.s3,
    bucket: ctx.mediaEnv.S3_BUCKET,
    key,
    expiresInSeconds: 60 * 60,
  })
  // Signing is microseconds; keep the redirect cache short so a bad deploy doesn't poison
  // browser caches for ages, but long enough to skip re-signing during a single page paint.
  c.header('Cache-Control', 'public, max-age=30')
  return c.redirect(signed, 302)
})
app.route('/api/articles', articlesRoute)
app.route('/api/notifications', notificationsRoute)
app.route('/api/analytics', analyticsRoute)
app.route('/api/dms', dmsRoute)
app.route('/api/invites', invitesRoute)
app.route('/api/reports', reportsRoute)
// Federation surfaces are mounted at root, NOT under /api, because spec paths like
// /.well-known/webfinger and /users/:handle are absolute. This intentionally collides with
// the public profile URL on the web app; the actor route content-negotiates so browsers get
// 302'd back to the web profile.
app.route('/', federationRoute)
app.route('/api/admin', adminRoute)

app.notFound((c) => c.json({ error: 'not_found' }, 404))
app.onError((err, c) => {
  const rateLimited = handleRateLimitError(err, c)
  if (rateLimited) return rateLimited
  ctx.log.error({ err: err instanceof Error ? err.stack ?? err.message : err, path: c.req.path }, 'unhandled_error')
  return c.json({ error: 'internal_error', message: err.message }, 500)
})

const port = ctx.env.PORT
ctx.log.info({ port }, 'api_listening')
export default { port, fetch: app.fetch }
