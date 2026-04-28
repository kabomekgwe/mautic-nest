import { pgTable, uuid, varchar, jsonb, timestamp, boolean, text } from 'drizzle-orm/pg-core';

export const dynamicContents = pgTable('dynamic_contents', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  content: text('content'),
  filters: jsonb('filters').default([]),
  slotName: varchar('slot_name', { length: 100 }),
  isPublished: boolean('is_published').default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
