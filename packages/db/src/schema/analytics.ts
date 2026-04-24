import { bigint, customType, date, index, integer, jsonb, pgTable, primaryKey, real, text, timestamp, uuid } from 'drizzle-orm/pg-core'
import { eventKindEnum } from './enums.ts'

const bytea = customType<{ data: Uint8Array; driverData: Buffer }>({
  dataType() {
    return 'bytea'
  },
})

// analytics_events is partitioned by RANGE(created_at) DAILY in production (pg_partman).
// Drizzle does not natively emit partitioned DDL; see packages/db/drizzle for a manual SQL
// migration that converts this table to partitioned at scale. v1 ships unpartitioned.
export const analyticsEvents = pgTable(
  'analytics_events',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    kind: eventKindEnum('kind').notNull(),
    subjectType: text('subject_type').notNull(),
    subjectId: uuid('subject_id'),
    actorUserId: uuid('actor_user_id'),
    sessionIdHash: bytea('session_id_hash'),
    ownerUserId: uuid('owner_user_id'),
    ipCountry: text('ip_country'),
    referrer: text('referrer'),
    uaFamily: text('ua_family'),
    weight: real('weight').notNull().default(1),
    metadata: jsonb('metadata'),
  },
  (t) => [
    index('analytics_events_owner_created_idx').on(t.ownerUserId, t.createdAt),
    index('analytics_events_subject_idx').on(t.subjectType, t.subjectId, t.createdAt),
    index('analytics_events_created_brin_idx').using('brin', t.createdAt),
  ],
)

export const analyticsRollupsDaily = pgTable(
  'analytics_rollups_daily',
  {
    day: date('day').notNull(),
    ownerUserId: uuid('owner_user_id'),
    subjectType: text('subject_type').notNull(),
    subjectId: uuid('subject_id').notNull(),
    impressions: bigint('impressions', { mode: 'number' }).notNull().default(0),
    engagements: bigint('engagements', { mode: 'number' }).notNull().default(0),
    profileVisits: bigint('profile_visits', { mode: 'number' }).notNull().default(0),
    linkClicks: bigint('link_clicks', { mode: 'number' }).notNull().default(0),
    follows: bigint('follows', { mode: 'number' }).notNull().default(0),
    unfollows: bigint('unfollows', { mode: 'number' }).notNull().default(0),
  },
  (t) => [primaryKey({ columns: [t.day, t.subjectType, t.subjectId] })],
)

export const analyticsRollupsUserDaily = pgTable(
  'analytics_rollups_user_daily',
  {
    day: date('day').notNull(),
    userId: uuid('user_id').notNull(),
    impressions: bigint('impressions', { mode: 'number' }).notNull().default(0),
    engagements: bigint('engagements', { mode: 'number' }).notNull().default(0),
    followers: integer('followers').notNull().default(0),
    following: integer('following').notNull().default(0),
    profileVisits: bigint('profile_visits', { mode: 'number' }).notNull().default(0),
  },
  (t) => [primaryKey({ columns: [t.day, t.userId] })],
)
