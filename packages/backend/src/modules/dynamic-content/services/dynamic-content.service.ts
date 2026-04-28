import { Injectable, Inject, Logger, NotFoundException } from '@nestjs/common';
import { DATABASE } from '../../../database/database.module';
import { dynamicContents } from '../../../database/schema/dynamic-content.schema';
import { contacts } from '../../../database/schema/contacts.schema';
import { eq, desc, sql, and } from 'drizzle-orm';

@Injectable()
export class DynamicContentService {
  private readonly logger = new Logger(DynamicContentService.name);
  constructor(@Inject(DATABASE) private readonly db: any) {}

  async findAll(params: { page: number; limit: number }) {
    const offset = (params.page - 1) * params.limit;
    const [data, totalResult] = await Promise.all([
      this.db.select().from(dynamicContents).limit(params.limit).offset(offset).orderBy(desc(dynamicContents.createdAt)),
      this.db.select({ count: sql<number>`count(*)` }).from(dynamicContents),
    ]);
    return { data, meta: { total: Number(totalResult[0]?.count ?? 0), ...params } };
  }

  async findOne(id: string) {
    const [dc] = await this.db.select().from(dynamicContents).where(eq(dynamicContents.id, id)).limit(1);
    if (!dc) throw new NotFoundException(`Dynamic content ${id} not found`);
    return dc;
  }

  async create(data: { name: string; content: string; filters?: any[]; slotName?: string }) {
    const [dc] = await this.db.insert(dynamicContents).values(data).returning();
    return dc;
  }

  async update(id: string, data: any) {
    await this.db.update(dynamicContents).set({ ...data, updatedAt: new Date() }).where(eq(dynamicContents.id, id));
    return this.findOne(id);
  }

  async remove(id: string) {
    await this.db.delete(dynamicContents).where(eq(dynamicContents.id, id));
  }

  async render(content: string, contactId: string): Promise<{ rendered: string }> {
    const [contact] = await this.db.select().from(contacts).where(eq(contacts.id, contactId)).limit(1);
    if (!contact) return { rendered: content };
    const fields = contact.fields ?? {};
    let result = content
      .replace(/{{\s*firstname\s*}}/gi, fields['firstname'] ?? 'there')
      .replace(/{{\s*lastname\s*}}/gi, fields['lastname'] ?? '')
      .replace(/{{\s*email\s*}}/gi, fields['email'] ?? '')
      .replace(/{{\s*company\s*}}/gi, fields['company'] ?? '')
      .replace(/{{\s*points\s*}}/gi, String(contact.points ?? 0))
      .replace(/{{\s*stage\s*}}/gi, contact.stageId ?? '')
      .replace(/{{\s*unsubscribe_url\s*}}/gi, `${process.env['FRONTEND_URL'] ?? 'http://localhost:3001'}/unsubscribe/${contactId}`)
      .replace(/{{\s*date\s*}}/gi, new Date().toLocaleDateString())
      .replace(/{{\s*year\s*}}/gi, String(new Date().getFullYear()));
    for (const [key, value] of Object.entries(fields)) {
      result = result.replace(new RegExp(`{{\s*${key}\s*}}`, 'gi'), String(value ?? ''));
    }
    return { rendered: result };
  }

  async getContentForSlot(slotName: string, contactId: string): Promise<{ content: string | null }> {
    const [contact] = await this.db.select().from(contacts).where(eq(contacts.id, contactId)).limit(1);
    if (!contact) return { content: null };
    const candidates = await this.db.select().from(dynamicContents).where(and(
      eq(dynamicContents.slotName, slotName),
      eq(dynamicContents.isPublished, true),
    ));
    if (candidates.length === 0) return { content: null };
    for (const candidate of candidates) {
      const filters = (candidate.filters as any[]) ?? [];
      if (filters.length === 0) {
        const { rendered } = await this.render(candidate.content, contactId);
        return { content: rendered };
      }
      const matches = filters.every((filter: any) => {
        const fieldValue = contact.fields?.[filter.field];
        if (fieldValue === undefined) return false;
        switch (filter.operator) {
          case '=': return String(fieldValue) === String(filter.value);
          case '!=': return String(fieldValue) !== String(filter.value);
          case 'in': return Array.isArray(filter.value) ? filter.value.includes(fieldValue) : String(filter.value).split(',').map(s => s.trim()).includes(String(fieldValue));
          case 'contains': return String(fieldValue).toLowerCase().includes(String(filter.value).toLowerCase());
          default: return String(fieldValue) === String(filter.value);
        }
      });
      if (matches) {
        const { rendered } = await this.render(candidate.content, contactId);
        return { content: rendered };
      }
    }
    return { content: null };
  }
}
