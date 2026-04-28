import { pgTable, uuid, varchar, integer, timestamp, boolean, text } from 'drizzle-orm/pg-core';

export const assets = pgTable('assets', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  filePath: text('file_path').notNull(),
  originalFileName: varchar('original_file_name', { length: 255 }),
  fileSize: integer('file_size'),
  mimeType: varchar('mime_type', { length: 100 }),
  downloadCount: integer('download_count').default(0),
  isPublished: boolean('is_published').default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const assetDownloads = pgTable('asset_downloads', {
  id: uuid('id').primaryKey().defaultRandom(),
  assetId: uuid('asset_id').notNull(),
  contactId: uuid('contact_id'),
  ipAddress: varchar('ip_address', { length: 45 }),
  userAgent: text('user_agent'),
  dateDownloaded: timestamp('date_downloaded').defaultNow().notNull(),
});
