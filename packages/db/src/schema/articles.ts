import { sql } from 'drizzle-orm'
import { bigint, index, integer, jsonb, pgTable, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core'
import { users } from './auth.ts'
import { media } from './media.ts'
import { posts } from './posts.ts'
import { articleFormatEnum, articleStatusEnum } from './enums.ts'

export const articles = pgTable(
  'articles',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    authorId: uuid('author_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    slug: text('slug').notNull(),
    title: text('title').notNull(),
    subtitle: text('subtitle'),
    coverMediaId: uuid('cover_media_id').references(() => media.id, { onDelete: 'set null' }),
    bodyFormat: articleFormatEnum('body_format').notNull().default('lexical'),
    bodyJson: jsonb('body_json'),
    bodyHtml: text('body_html'),
    bodyText: text('body_text'),
    wordCount: integer('word_count').notNull().default(0),
    readingMinutes: integer('reading_minutes').notNull().default(0),
    status: articleStatusEnum('status').notNull().default('draft'),
    publishedAt: timestamp('published_at', { withTimezone: true }),
    editedAt: timestamp('edited_at', { withTimezone: true }),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
    likeCount: integer('like_count').notNull().default(0),
    bookmarkCount: integer('bookmark_count').notNull().default(0),
    replyCount: integer('reply_count').notNull().default(0),
    impressionCount: bigint('impression_count', { mode: 'number' }).notNull().default(0),
    crosspostPostId: uuid('crosspost_post_id').references(() => posts.id, { onDelete: 'set null' }),
  },
  (t) => [
    uniqueIndex('articles_author_slug_uq').on(t.authorId, t.slug),
    index('articles_published_idx').on(t.publishedAt),
    // Hit by loadArticleCards(postIds) on every feed render — reverse-lookup from a crosspost
    // post id to the article card. Partial so the index only holds eligible rows.
    index('articles_crosspost_post_idx')
      .on(t.crosspostPostId)
      .where(sql`${t.crosspostPostId} IS NOT NULL AND ${t.deletedAt} IS NULL AND ${t.status} = 'published'`),
    // Profile "articles" list sorts an author's published pieces by publishedAt DESC.
    index('articles_author_published_idx')
      .on(t.authorId, t.publishedAt)
      .where(sql`${t.status} = 'published' AND ${t.deletedAt} IS NULL`),
  ],
)

export const articleRevisions = pgTable(
  'article_revisions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    articleId: uuid('article_id')
      .notNull()
      .references(() => articles.id, { onDelete: 'cascade' }),
    bodyJson: jsonb('body_json'),
    editedAt: timestamp('edited_at', { withTimezone: true }).notNull().defaultNow(),
    editedBy: uuid('edited_by')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
  },
  (t) => [index('article_revisions_article_idx').on(t.articleId, t.editedAt)],
)
