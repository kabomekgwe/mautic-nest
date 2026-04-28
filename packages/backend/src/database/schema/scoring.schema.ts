import { pgTable, uuid, varchar, jsonb, integer, timestamp, boolean, text } from 'drizzle-orm/pg-core';

export const pointActions = pgTable('point_actions', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  type: varchar('type', { length: 100 }).notNull(),
  points: integer('points').notNull().default(0),
  properties: jsonb('properties').default({}),
  isPublished: boolean('is_published').default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const pointTriggers = pgTable('point_triggers', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  type: varchar('type', { length: 100 }).notNull(),
  points: integer('points').notNull().default(0),
  color: varchar('color', { length: 7 }),
  actionType: varchar('action_type', { length: 100 }),
  properties: jsonb('properties').default({}),
  isPublished: boolean('is_published').default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const stages = pgTable('stages', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  weight: integer('weight').default(0),
  isPublished: boolean('is_published').default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const contactStageLog = pgTable('contact_stage_log', {
  id: uuid('id').primaryKey().defaultRandom(),
  contactId: uuid('contact_id').notNull(),
  stageId: uuid('stage_id').notNull(),
  eventName: varchar('event_name', { length: 50 }).default('manual'), // 'manual' | 'action' | 'trigger'
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
