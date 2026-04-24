import { bigint, customType, index, integer, jsonb, pgTable, primaryKey, smallint, text, timestamp, uuid } from 'drizzle-orm/pg-core'
import { users } from './auth.ts'
import { posts } from './posts.ts'
import { mediaKindEnum, mediaStateEnum } from './enums.ts'

const bytea = customType<{ data: Uint8Array; driverData: Buffer }>({
  dataType() {
    return 'bytea'
  },
})

export const media = pgTable(
  'media',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    ownerId: uuid('owner_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    kind: mediaKindEnum('kind').notNull(),
    originalKey: text('original_key').notNull(),
    mimeType: text('mime_type'),
    bytes: bigint('bytes', { mode: 'number' }),
    width: integer('width'),
    height: integer('height'),
    durationMs: integer('duration_ms'),
    dominantColor: text('dominant_color'),
    blurhash: text('blurhash'),
    altText: text('alt_text'),
    processingState: mediaStateEnum('processing_state').notNull().default('pending'),
    processingError: text('processing_error'),
    variants: jsonb('variants'),
    phashHex: text('phash_hex'),
    contentHashSha256: bytea('content_hash_sha256'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
  },
  (t) => [
    index('media_owner_created_idx').on(t.ownerId, t.createdAt),
    index('media_sha256_idx').on(t.contentHashSha256),
    index('media_phash_idx').on(t.phashHex),
  ],
)

export const postMedia = pgTable(
  'post_media',
  {
    postId: uuid('post_id')
      .notNull()
      .references(() => posts.id, { onDelete: 'cascade' }),
    mediaId: uuid('media_id')
      .notNull()
      .references(() => media.id, { onDelete: 'cascade' }),
    position: smallint('position').notNull().default(0),
    altText: text('alt_text'),
  },
  (t) => [primaryKey({ columns: [t.postId, t.mediaId] })],
)
