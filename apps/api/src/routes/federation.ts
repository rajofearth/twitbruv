import { Hono } from 'hono'
import { eq, isNull, and } from '@workspace/db'
import { schema } from '@workspace/db'
import type { HonoEnv } from '../middleware/session.ts'
import { buildActor, ensureUserKeypair } from '../lib/federation.ts'

export const federationRoute = new Hono<HonoEnv>()

// Mounted at root so paths match the AP/webfinger spec exactly:
//   GET /.well-known/webfinger?resource=acct:user@host
//   GET /.well-known/nodeinfo
//   GET /nodeinfo/2.1
//   GET /users/:handle  (Accept: application/activity+json)
// Actual mounting happens in apps/api/src/index.ts so the path prefixes are right.

federationRoute.get('/.well-known/webfinger', async (c) => {
  const { db, env } = c.get('ctx')
  const resource = c.req.query('resource')
  if (!resource) return c.json({ error: 'missing_resource' }, 400)

  // Accept: acct:handle@host (the standard) or just acct:handle.
  const match = resource.match(/^acct:([^@]+)(?:@(.+))?$/)
  if (!match) return c.json({ error: 'bad_resource' }, 400)
  const handle = match[1]!
  const host = match[2]
  const baseHost = new URL(env.BETTER_AUTH_URL).host
  if (host && host !== baseHost) return c.json({ error: 'wrong_host' }, 404)

  const [user] = await db
    .select()
    .from(schema.users)
    .where(and(eq(schema.users.handle, handle), isNull(schema.users.deletedAt)))
    .limit(1)
  if (!user) return c.json({ error: 'not_found' }, 404)

  const actorUrl = `${env.BETTER_AUTH_URL}/users/${handle}`
  c.header('Content-Type', 'application/jrd+json')
  return c.body(
    JSON.stringify({
      subject: `acct:${handle}@${baseHost}`,
      aliases: [actorUrl],
      links: [
        { rel: 'self', type: 'application/activity+json', href: actorUrl },
        { rel: 'http://webfinger.net/rel/profile-page', type: 'text/html', href: `${env.PUBLIC_WEB_URL}/${handle}` },
      ],
    }),
  )
})

// Discovery hub for instance metadata.
federationRoute.get('/.well-known/nodeinfo', async (c) => {
  const { env } = c.get('ctx')
  return c.json({
    links: [
      { rel: 'http://nodeinfo.diaspora.software/ns/schema/2.1', href: `${env.BETTER_AUTH_URL}/nodeinfo/2.1` },
    ],
  })
})

federationRoute.get('/nodeinfo/2.1', async (c) => {
  const { env } = c.get('ctx')
  return c.json({
    version: '2.1',
    software: { name: env.APP_NAME.toLowerCase(), version: '0.1.0', repository: 'https://github.com/twitbruv/twitbruv' },
    protocols: ['activitypub'],
    services: { inbound: [], outbound: [] },
    openRegistrations: true,
    usage: { users: { total: 0 }, localPosts: 0, localComments: 0 },
    metadata: { nodeName: env.APP_NAME, nodeDescription: 'Open-source social platform' },
  })
})

// Content-negotiated actor endpoint. Browsers (HTML Accept) get redirected to the web profile;
// federation clients (activity+json Accept) get the AS2 actor object.
federationRoute.get('/users/:handle', async (c) => {
  const { db, env } = c.get('ctx')
  const handle = c.req.param('handle')
  const [user] = await db
    .select()
    .from(schema.users)
    .where(and(eq(schema.users.handle, handle), isNull(schema.users.deletedAt)))
    .limit(1)
  if (!user) return c.json({ error: 'not_found' }, 404)

  const accept = c.req.header('Accept') ?? ''
  const wantsAp =
    accept.includes('application/activity+json') || accept.includes('application/ld+json')
  if (!wantsAp) {
    // Bounce regular browsers to the public profile on the web app.
    return c.redirect(`${env.PUBLIC_WEB_URL}/${handle}`, 302)
  }

  const { publicKeyPem } = await ensureUserKeypair(db, user.id)
  const actor = buildActor({ baseUrl: env.BETTER_AUTH_URL, user, publicKeyPem })
  c.header('Content-Type', 'application/activity+json')
  return c.body(JSON.stringify(actor))
})
