import { pgTable, uuid, varchar, jsonb, integer, timestamp, boolean, text } from 'drizzle-orm/pg-core';

export const segments = pgTable('segments', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  type: varchar('type', { length: 20 }).notNull().default('dynamic'), // 'static' | 'dynamic'
  filters: jsonb('filters').default([]),
  isPublished: boolean('is_published').default(true),
  contactCount: integer('contact_count').default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const segmentMemberships = pgTable('segment_memberships', {
  id: uuid('id').primaryKey().defaultRandom(),
  segmentId: uuid('segment_id').notNull(),
  contactId: uuid('contact_id').notNull(),
  manuallyAdded: boolean('manually_added').default(false),
  manuallyRemoved: boolean('manually_removed').default(false),
  addedAt: timestamp('added_at').defaultNow().notNull(),
  removedAt: timestamp('removed_at'),
});
