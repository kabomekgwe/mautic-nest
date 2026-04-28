import { pgTable, uuid, varchar, jsonb, integer, timestamp, boolean, text } from 'drizzle-orm/pg-core';

export const forms = pgTable('forms', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  kiosk: boolean('kiosk').default(false),
  captureLead: boolean('capture_lead').default(true),
  template: varchar('template', { length: 50 }),
  isPublished: boolean('is_published').default(false),
  submissionCount: integer('submission_count').default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const formFields = pgTable('form_fields', {
  id: uuid('id').primaryKey().defaultRandom(),
  formId: uuid('form_id').notNull(),
  label: varchar('label', { length: 255 }).notNull(),
  fieldType: varchar('field_type', { length: 50 }).notNull(),
  alias: varchar('alias', { length: 100 }),
  properties: jsonb('properties').default({}),
  isCustom: boolean('is_custom').default(false),
  order: integer('order').default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const formActions = pgTable('form_actions', {
  id: uuid('id').primaryKey().defaultRandom(),
  formId: uuid('form_id').notNull(),
  actionType: varchar('action_type', { length: 100 }).notNull(),
  properties: jsonb('properties').default({}),
  order: integer('order').default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const formSubmissions = pgTable('form_submissions', {
  id: uuid('id').primaryKey().defaultRandom(),
  formId: uuid('form_id').notNull(),
  contactId: uuid('contact_id'),
  data: jsonb('data').notNull().default({}),
  ipAddress: varchar('ip_address', { length: 45 }),
  userAgent: text('user_agent'),
  referrer: text('referrer'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
