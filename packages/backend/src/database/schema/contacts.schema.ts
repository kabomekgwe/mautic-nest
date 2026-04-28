import { pgTable, uuid, varchar, jsonb, integer, timestamp, boolean, text } from 'drizzle-orm/pg-core';
import { users } from './users.schema';
import { companies } from './companies.schema';

export const contacts = pgTable('contacts', {
  id: uuid('id').primaryKey().defaultRandom(),
  fields: jsonb('fields').notNull().default({}),
  ownerId: uuid('owner_id').references(() => users.id),
  points: integer('points').notNull().default(0),
  stageId: uuid('stage_id'),
  lastActive: timestamp('last_active'),
  dateIdentified: timestamp('date_identified'),
  color: varchar('color', { length: 7 }),
  isPublished: boolean('is_published').default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const contactTags = pgTable('contact_tags', {
  id: uuid('id').primaryKey().defaultRandom(),
  contactId: uuid('contact_id').references(() => contacts.id).notNull(),
  tag: varchar('tag', { length: 100 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const contactUtmTags = pgTable('contact_utm_tags', {
  id: uuid('id').primaryKey().defaultRandom(),
  contactId: uuid('contact_id').references(() => contacts.id).notNull(),
  utmSource: varchar('utm_source', { length: 255 }),
  utmMedium: varchar('utm_medium', { length: 255 }),
  utmCampaign: varchar('utm_campaign', { length: 255 }),
  utmContent: varchar('utm_content', { length: 255 }),
  utmTerm: varchar('utm_term', { length: 255 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const doNotContact = pgTable('do_not_contact', {
  id: uuid('id').primaryKey().defaultRandom(),
  contactId: uuid('contact_id').references(() => contacts.id).notNull(),
  channel: varchar('channel', { length: 50 }).notNull(), // 'email' | 'sms' | 'notification'
  reason: text('reason'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const contactIpAddresses = pgTable('contact_ip_addresses', {
  id: uuid('id').primaryKey().defaultRandom(),
  contactId: uuid('contact_id').references(() => contacts.id).notNull(),
  ipAddress: varchar('ip_address', { length: 45 }).notNull(),
  firstSeen: timestamp('first_seen').defaultNow().notNull(),
  lastSeen: timestamp('last_seen').defaultNow().notNull(),
});

export const customFields = pgTable('custom_fields', {
  id: uuid('id').primaryKey().defaultRandom(),
  object: varchar('object', { length: 50 }).notNull().default('contact'), // 'contact' | 'company'
  alias: varchar('alias', { length: 100 }).notNull().unique(),
  label: varchar('label', { length: 255 }).notNull(),
  fieldType: varchar('field_type', { length: 50 }).notNull(),
  fieldGroup: varchar('field_group', { length: 100 }).default('core'),
  properties: jsonb('properties').default({}),
  isRequired: boolean('is_required').default(false),
  isVisible: boolean('is_visible').default(true),
  order: integer('order').default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
