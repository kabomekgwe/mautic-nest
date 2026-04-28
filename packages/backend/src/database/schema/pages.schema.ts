import { pgTable, uuid, varchar, jsonb, integer, timestamp, boolean, text } from 'drizzle-orm/pg-core';

export const pages = pgTable('pages', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: varchar('title', { length: 255 }).notNull(),
  content: text('content'),
  template: varchar('template', { length: 50 }),
  isPublished: boolean('is_published').default(false),
  hitCount: integer('hit_count').default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const pageHits = pgTable('page_hits', {
  id: uuid('id').primaryKey().defaultRandom(),
  pageId: uuid('page_id'),
  contactId: uuid('contact_id'),
  url: text('url').notNull(),
  title: text('title'),
  referrer: text('referrer'),
  ipAddress: varchar('ip_address', { length: 45 }),
  userAgent: text('user_agent'),
  source: varchar('source', { length: 50 }),
  dateHit: timestamp('date_hit').defaultNow().notNull(),
});
