import { pgTable, uuid, varchar, timestamp, jsonb, boolean, text } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  firstName: varchar('first_name', { length: 100 }),
  lastName: varchar('last_name', { length: 100 }),
  roleId: uuid('role_id'),
  timezone: varchar('timezone', { length: 50 }).default('UTC'),
  locale: varchar('locale', { length: 10 }).default('en_US'),
  isPublished: boolean('is_published').default(true),
  lastActive: timestamp('last_active'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const roles = pgTable('roles', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 100 }).notNull().unique(),
  description: text('description'),
  permissions: jsonb('permissions').notNull().default({}),
  isAdmin: boolean('is_admin').default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
