import { pgTable, uuid, varchar, jsonb, integer, timestamp, boolean, text } from 'drizzle-orm/pg-core';
import { segments } from './segments.schema';

export const emails = pgTable('emails', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  subject: varchar('subject', { length: 255 }).notNull(),
  body: text('body'),
  plainText: text('plain_text'),
  template: varchar('template', { length: 50 }),
  type: varchar('type', { length: 50 }).default('template'), // 'template' | 'list'
  listId: uuid('list_id').references(() => segments.id),
  assetId: uuid('asset_id'),
  variantSettings: jsonb('variant_settings').default({}),
  headers: jsonb('headers').default({}),
  isPublished: boolean('is_published').default(false),
  sentCount: integer('sent_count').default(0),
  openCount: integer('open_count').default(0),
  clickCount: integer('click_count').default(0),
  bounceCount: integer('bounce_count').default(0),
  unsubscribeCount: integer('unsubscribe_count').default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const emailStats = pgTable('email_stats', {
  id: uuid('id').primaryKey().defaultRandom(),
  emailId: uuid('email_id').notNull(),
  contactId: uuid('contact_id').notNull(),
  type: varchar('type', { length: 30 }).notNull(), // 'sent' | 'open' | 'click' | 'bounce' | 'unsubscribe'
  dateSent: timestamp('date_sent'),
  dateOpened: timestamp('date_opened'),
  dateClicked: timestamp('date_clicked'),
  clickUrl: text('click_url'),
  userAgent: text('user_agent'),
  ipAddress: varchar('ip_address', { length: 45 }),
  source: varchar('source', { length: 50 }), // 'campaign' | 'list' | 'manual'
  campaignId: uuid('campaign_id'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
