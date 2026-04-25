import { generateKeyPairSync } from 'node:crypto'
import { eq } from '@workspace/db'
import { schema, type Database } from '@workspace/db'

/**
 * Lazy keygen: ActivityPub actor JSON requires a public key. We generate per-user keypairs
 * on first need (rather than at signup) so existing local-only accounts get federation
 * lighting up automatically without a backfill migration.
 */
export async function ensureUserKeypair(
  db: Database,
  userId: string,
): Promise<{ publicKeyPem: string; privateKeyPem: string }> {
  const [user] = await db
    .select({
      apPublicKeyPem: schema.users.apPublicKeyPem,
      apPrivateKeyPem: schema.users.apPrivateKeyPem,
    })
    .from(schema.users)
    .where(eq(schema.users.id, userId))
    .limit(1)
  if (user?.apPublicKeyPem && user.apPrivateKeyPem) {
    return { publicKeyPem: user.apPublicKeyPem, privateKeyPem: user.apPrivateKeyPem }
  }
  const { publicKey, privateKey } = generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
  })
  await db
    .update(schema.users)
    .set({ apPublicKeyPem: publicKey, apPrivateKeyPem: privateKey })
    .where(eq(schema.users.id, userId))
  return { publicKeyPem: publicKey, privateKeyPem: privateKey }
}

/** Build the canonical ActivityStreams Actor object for a local user. */
export function buildActor(args: {
  baseUrl: string
  user: typeof schema.users.$inferSelect
  publicKeyPem: string
}) {
  const { baseUrl, user, publicKeyPem } = args
  if (!user.handle) throw new Error('actor_missing_handle')
  const id = `${baseUrl}/users/${user.handle}`
  return {
    '@context': [
      'https://www.w3.org/ns/activitystreams',
      'https://w3id.org/security/v1',
    ],
    id,
    type: 'Person',
    preferredUsername: user.handle,
    name: user.displayName ?? user.handle,
    summary: user.bio ?? '',
    inbox: `${id}/inbox`,
    outbox: `${id}/outbox`,
    followers: `${id}/followers`,
    following: `${id}/following`,
    url: id,
    manuallyApprovesFollowers: false,
    discoverable: true,
    publicKey: {
      id: `${id}#main-key`,
      owner: id,
      publicKeyPem,
    },
    icon: user.avatarUrl
      ? { type: 'Image', mediaType: 'image/jpeg', url: user.avatarUrl }
      : undefined,
    image: user.bannerUrl
      ? { type: 'Image', mediaType: 'image/jpeg', url: user.bannerUrl }
      : undefined,
  }
}

const ACTIVITY_JSON_TYPES = [
  'application/activity+json',
  'application/ld+json',
  'application/json',
]

/** True when the request wants ActivityPub JSON over HTML. */
export function wantsActivityJson(acceptHeader: string | undefined): boolean {
  if (!acceptHeader) return false
  return ACTIVITY_JSON_TYPES.some((t) => acceptHeader.toLowerCase().includes(t))
}
