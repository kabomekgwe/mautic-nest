import { pgTable, uuid, varchar, jsonb, integer, timestamp, boolean, text } from 'drizzle-orm/pg-core';
import { segments } from './segments.schema';

export const campaigns = pgTable('campaigns', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  canvasSettings: jsonb('canvas_settings').default({}),
  segmentId: uuid('segment_id').references(() => segments.id),
  isPublished: boolean('is_published').default(false),
  contactCount: integer('contact_count').default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const campaignEvents = pgTable('campaign_events', {
  id: uuid('id').primaryKey().defaultRandom(),
  campaignId: uuid('campaign_id').notNull(),
  type: varchar('type', { length: 50 }).notNull(), // 'decision' | 'condition' | 'action'
  eventType: varchar('event_type', { length: 100 }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  triggerMode: varchar('trigger_mode', { length: 30 }).default('immediate'),
  triggerInterval: integer('trigger_interval'),
  triggerIntervalUnit: varchar('trigger_interval_unit', { length: 5 }),
  triggerHour: integer('trigger_hour'),
  triggerRestrictedStartHour: integer('trigger_restricted_start_hour'),
  triggerRestrictedEndHour: integer('trigger_restricted_end_hour'),
  triggerRestrictedDaysOfWeek: varchar('trigger_restricted_days_of_week', { length: 20 }),
  properties: jsonb('properties').default({}),
  position: jsonb('position'), // { x, y }
  parentId: uuid('parent_id'),
  decisionPath: varchar('decision_path', { length: 5 }), // 'yes' | 'no'
  order: integer('order').default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const campaignMemberships = pgTable('campaign_memberships', {
  id: uuid('id').primaryKey().defaultRandom(),
  campaignId: uuid('campaign_id').notNull(),
  contactId: uuid('contact_id').notNull(),
  dateAdded: timestamp('date_added').defaultNow().notNull(),
  dateRemoved: timestamp('date_removed'),
  manuallyAdded: boolean('manually_added').default(false),
  manuallyRemoved: boolean('manually_removed').default(false),
});

export const campaignLeadEventLog = pgTable('campaign_lead_event_log', {
  id: uuid('id').primaryKey().defaultRandom(),
  campaignId: uuid('campaign_id').notNull(),
  contactId: uuid('contact_id').notNull(),
  eventId: uuid('event_id').notNull(),
  status: varchar('status', { length: 30 }).default('pending'), // 'pending' | 'executed' | 'failed' | 'scheduled'
  metadata: jsonb('metadata').default({}),
  scheduledAt: timestamp('scheduled_at'),
  executedAt: timestamp('executed_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
