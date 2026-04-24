import { index, jsonb, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'
import { users } from './auth.ts'

// Federation stubs. Empty in v1; populated at M7 when ActivityPub ships.
// Present now so future migrations are additive, not restructural.

export const apActors = pgTable(
  'ap_actors',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    apId: text('ap_id').notNull().unique(),
    inboxUrl: text('inbox_url').notNull(),
    outboxUrl: text('outbox_url'),
    sharedInboxUrl: text('shared_inbox_url'),
    publicKeyPem: text('public_key_pem').notNull(),
    raw: jsonb('raw'),
    fetchedAt: timestamp('fetched_at', { withTimezone: true }).notNull().defaultNow(),
    localUserId: uuid('local_user_id').references(() => users.id, { onDelete: 'cascade' }),
  },
)

export const apInbox = pgTable(
  'ap_inbox',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    actorApId: text('actor_ap_id').notNull(),
    activityType: text('activity_type').notNull(),
    raw: jsonb('raw').notNull(),
    receivedAt: timestamp('received_at', { withTimezone: true }).notNull().defaultNow(),
    processedAt: timestamp('processed_at', { withTimezone: true }),
    error: text('error'),
  },
  (t) => [index('ap_inbox_actor_idx').on(t.actorApId, t.receivedAt)],
)

export const apOutbox = pgTable(
  'ap_outbox',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    actorUserId: uuid('actor_user_id').references(() => users.id, { onDelete: 'cascade' }),
    activityType: text('activity_type').notNull(),
    payload: jsonb('payload').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    deliveredAt: timestamp('delivered_at', { withTimezone: true }),
  },
)

export const apFollows = pgTable(
  'ap_follows',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    localUserId: uuid('local_user_id').references(() => users.id, { onDelete: 'cascade' }),
    remoteActorApId: text('remote_actor_ap_id'),
    direction: text('direction').notNull(),
    state: text('state').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
)
