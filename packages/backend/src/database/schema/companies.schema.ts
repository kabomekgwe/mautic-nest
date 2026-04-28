import { pgTable, uuid, varchar, jsonb, timestamp, boolean } from 'drizzle-orm/pg-core';
import { users } from './users.schema';

export const companies = pgTable('companies', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  fields: jsonb('fields').notNull().default({}),
  ownerId: uuid('owner_id').references(() => users.id),
  isPublished: boolean('is_published').default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const contactCompanies = pgTable('contact_companies', {
  id: uuid('id').primaryKey().defaultRandom(),
  contactId: uuid('contact_id').notNull(),
  companyId: uuid('company_id').notNull(),
  isPrimary: boolean('is_primary').default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
