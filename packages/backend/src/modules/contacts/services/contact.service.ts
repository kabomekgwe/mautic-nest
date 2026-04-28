import { Injectable, Inject, NotFoundException, Logger } from '@nestjs/common';
import { DATABASE } from '../../../database/database.module';
import { contacts, contactTags, contactUtmTags, doNotContact, contactIpAddresses, customFields } from '../../../database/schema/contacts.schema';
import { eq, ilike, or, and, sql, desc } from 'drizzle-orm';

interface FindAllParams {
  page: number;
  limit: number;
  search?: string;
}

export interface PaginatedResult<T> {
  data: T[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

@Injectable()
export class ContactService {
  private readonly logger = new Logger(ContactService.name);

  constructor(@Inject(DATABASE) private readonly db: any) {}

  async findAll(params: FindAllParams): Promise<PaginatedResult<any>> {
    const { page, limit, search } = params;
    const offset = (page - 1) * limit;

    const where = search
      ? or(
          ilike(sql`fields->>'email'`, `%${search}%`),
          ilike(sql`fields->>'firstname'`, `%${search}%`),
          ilike(sql`fields->>'lastname'`, `%${search}%`),
        )
      : undefined;

    const [data, totalResult] = await Promise.all([
      this.db.select().from(contacts).where(where).limit(limit).offset(offset).orderBy(desc(contacts.createdAt)),
      this.db.select({ count: sql<number>`count(*)` }).from(contacts).where(where),
    ]);

    const total = Number(totalResult[0]?.count ?? 0);

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(id: string): Promise<any> {
    const result = await this.db.select().from(contacts).where(eq(contacts.id, id)).limit(1);
    if (!result.length) throw new NotFoundException(`Contact ${id} not found`);

    const [tags, utmTags, dncEntries, ipEntries] = await Promise.all([
      this.db.select().from(contactTags).where(eq(contactTags.contactId, id)),
      this.db.select().from(contactUtmTags).where(eq(contactUtmTags.contactId, id)),
      this.db.select().from(doNotContact).where(eq(doNotContact.contactId, id)),
      this.db.select().from(contactIpAddresses).where(eq(contactIpAddresses.contactId, id)),
    ]);

    return { ...result[0], tags, utmTags, doNotContact: dncEntries, ipAddresses: ipEntries };
  }

  async create(data: Record<string, unknown>): Promise<any> {
    const { tags, ipAddress, ...fields } = data;

    const [contact] = await this.db.insert(contacts).values({
      fields,
      lastActive: new Date(),
    }).returning();

    if (tags && Array.isArray(tags)) {
      await this.db.insert(contactTags).values(
        tags.map((tag: string) => ({ contactId: contact.id, tag })),
      );
    }

    if (ipAddress) {
      await this.db.insert(contactIpAddresses).values({
        contactId: contact.id,
        ipAddress: ipAddress as string,
      });
    }

    this.logger.log(`Created contact ${contact.id}`);
    return this.findOne(contact.id);
  }

  async update(id: string, data: Record<string, unknown>): Promise<any> {
    const existing = await this.db.select().from(contacts).where(eq(contacts.id, id)).limit(1);
    if (!existing.length) throw new NotFoundException(`Contact ${id} not found`);

    const { tags, ipAddress, ...fields } = data;
    const updateData: Record<string, any> = {
      fields: { ...existing[0].fields, ...fields },
      updatedAt: new Date(),
    };

    await this.db.update(contacts).set(updateData).where(eq(contacts.id, id));

    if (tags && Array.isArray(tags)) {
      await this.db.delete(contactTags).where(eq(contactTags.contactId, id));
      await this.db.insert(contactTags).values(
        tags.map((tag: string) => ({ contactId: id, tag })),
      );
    }

    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    const existing = await this.db.select().from(contacts).where(eq(contacts.id, id)).limit(1);
    if (!existing.length) throw new NotFoundException(`Contact ${id} not found`);

    await Promise.all([
      this.db.delete(contactTags).where(eq(contactTags.contactId, id)),
      this.db.delete(contactUtmTags).where(eq(contactUtmTags.contactId, id)),
      this.db.delete(doNotContact).where(eq(doNotContact.contactId, id)),
      this.db.delete(contactIpAddresses).where(eq(contactIpAddresses.contactId, id)),
      this.db.delete(contacts).where(eq(contacts.id, id)),
    ]);

    this.logger.log(`Deleted contact ${id}`);
  }

  async merge(sourceId: string, targetId: string): Promise<any> {
    const [source, target] = await Promise.all([
      this.db.select().from(contacts).where(eq(contacts.id, sourceId)).limit(1),
      this.db.select().from(contacts).where(eq(contacts.id, targetId)).limit(1),
    ]);

    if (!source.length) throw new NotFoundException(`Source contact ${sourceId} not found`);
    if (!target.length) throw new NotFoundException(`Target contact ${targetId} not found`);

    // Merge fields (target wins on conflict)
    const mergedFields = { ...source[0].fields, ...target[0].fields };
    const mergedPoints = (source[0].points ?? 0) + (target[0].points ?? 0);
    const mergedTags = [
      ...(source[0].tags ?? []),
      ...(target[0].tags ?? []),
    ].filter((t: string, i: number, arr: string[]) => arr.indexOf(t) === i);

    await this.db.update(contacts).set({
      fields: mergedFields,
      points: mergedPoints,
      updatedAt: new Date(),
    }).where(eq(contacts.id, targetId));

    // Delete source
    await this.db.delete(contacts).where(eq(contacts.id, sourceId));

    this.logger.log(`Merged contact ${sourceId} into ${targetId}`);
    return this.findOne(targetId);
  }

  async getTimeline(contactId: string): Promise<any[]> {
    // Query events from various tables: email_stats, form_submissions, page_hits, etc.
    return [];
  }
}
