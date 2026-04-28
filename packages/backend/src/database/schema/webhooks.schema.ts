import { pgTable, uuid, varchar, jsonb, integer, timestamp, boolean, text } from 'drizzle-orm/pg-core';

export const webhooks = pgTable('webhooks', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  url: text('url').notNull(),
  secret: text('secret'),
  eventTypes: jsonb('event_types').notNull().default([]),
  queueMode: varchar('queue_mode', { length: 20 }).default('immediate'), // 'immediate' | 'batch'
  isPublished: boolean('is_published').default(true),
  lastExecution: timestamp('last_execution'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const webhookLogs = pgTable('webhook_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  webhookId: uuid('webhook_id').notNull(),
  eventType: varchar('event_type', { length: 100 }).notNull(),
  payload: jsonb('payload').default({}),
  statusCode: integer('status_code'),
  response: text('response'),
  status: varchar('status', { length: 20 }).default('pending'), // 'pending' | 'success' | 'failed'
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
