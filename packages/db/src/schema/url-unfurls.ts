import { index, jsonb, pgTable, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core'

export const urlUnfurls = pgTable(
  'url_unfurls',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    url: text('url').notNull(),
    urlHash: text('url_hash').notNull(),
    title: text('title'),
    description: text('description'),
    imageUrl: text('image_url'),
    providerName: text('provider_name'),
    siteName: text('site_name'),
    card: jsonb('card'),
    fetchedAt: timestamp('fetched_at', { withTimezone: true }).notNull().defaultNow(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  },
  (t) => [
    uniqueIndex('url_unfurls_hash_uq').on(t.urlHash),
    index('url_unfurls_expires_idx').on(t.expiresAt),
  ],
)
