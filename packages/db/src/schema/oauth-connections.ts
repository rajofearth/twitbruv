import { boolean, index, jsonb, pgTable, smallint, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core'
import { users } from './auth.ts'
import { oauthProviderEnum } from './enums.ts'

export const oauthConnections = pgTable(
  'oauth_connections',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    provider: oauthProviderEnum('provider').notNull(),
    providerAccountId: text('provider_account_id').notNull(),
    providerUsername: text('provider_username'),
    accessTokenEncrypted: text('access_token_encrypted'),
    refreshTokenEncrypted: text('refresh_token_encrypted'),
    accessTokenExpiresAt: timestamp('access_token_expires_at', { withTimezone: true }),
    scopes: text('scopes').array(),
    metadata: jsonb('metadata'),
    showOnProfile: boolean('show_on_profile').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex('oauth_connections_user_provider_uq').on(t.userId, t.provider),
    index('oauth_connections_provider_idx').on(t.provider, t.providerAccountId),
  ],
)

export const pinnedConnectorItems = pgTable(
  'pinned_connector_items',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    provider: oauthProviderEnum('provider').notNull(),
    itemType: text('item_type').notNull(),
    itemId: text('item_id').notNull(),
    snapshot: jsonb('snapshot'),
    position: smallint('position').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    refreshedAt: timestamp('refreshed_at', { withTimezone: true }),
  },
  (t) => [
    uniqueIndex('pinned_connector_items_user_item_uq').on(t.userId, t.provider, t.itemType, t.itemId),
    index('pinned_connector_items_user_idx').on(t.userId, t.position),
  ],
)
