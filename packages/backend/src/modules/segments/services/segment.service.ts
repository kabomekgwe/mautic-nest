import { Injectable, Inject, NotFoundException, Logger } from '@nestjs/common';
import { DATABASE } from '../../../database/database.module';
import { segments, segmentMemberships } from '../../../database/schema/segments.schema';
import { contacts } from '../../../database/schema/contacts.schema';
import { eq, and, or, ilike, sql, desc, inArray, count, not } from 'drizzle-orm';

interface FindAllParams { page: number; limit: number; search?: string; }

interface SegmentFilter {
  field: string;
  operator: string;
  value: any;
  glue?: 'and' | 'or';
}

@Injectable()
export class SegmentService {
  private readonly logger = new Logger(SegmentService.name);
  constructor(@Inject(DATABASE) private readonly db: any) {}

  async findAll(params: FindAllParams) {
    const { page, limit, search } = params;
    const offset = (page - 1) * limit;
    const where = search ? ilike(segments.name, `%${search}%`) : undefined;
    const [data, totalResult] = await Promise.all([
      this.db.select().from(segments).where(where).limit(limit).offset(offset).orderBy(desc(segments.createdAt)),
      this.db.select({ count: sql<number>`count(*)` }).from(segments).where(where),
    ]);
    const total = Number(totalResult[0]?.count ?? 0);
    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async findOne(id: string) {
    const result = await this.db.select().from(segments).where(eq(segments.id, id)).limit(1);
    if (!result.length) throw new NotFoundException(`Segment ${id} not found`);
    return result[0];
  }

  async create(data: { name: string; description?: string; type?: string; filters?: any[] }) {
    const [segment] = await this.db.insert(segments).values({
      name: data.name,
      description: data.description,
      type: data.type ?? 'dynamic',
      filters: data.filters ?? [],
    }).returning();
    this.logger.log(`Created segment ${segment.id}: ${segment.name}`);
    if (segment.type === 'dynamic' && segment.filters.length > 0) {
      await this.rebuildMembership(segment.id);
    }
    return segment;
  }

  async update(id: string, data: any) {
    const existing = await this.db.select().from(segments).where(eq(segments.id, id)).limit(1);
    if (!existing.length) throw new NotFoundException(`Segment ${id} not found`);
    const updateData: any = { updatedAt: new Date() };
    if (data.name) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.filters !== undefined) updateData.filters = data.filters;
    await this.db.update(segments).set(updateData).where(eq(segments.id, id));
    if (updateData.filters && existing[0].type === 'dynamic') {
      await this.rebuildMembership(id);
    }
    return this.findOne(id);
  }

  async remove(id: string) {
    const existing = await this.db.select().from(segments).where(eq(segments.id, id)).limit(1);
    if (!existing.length) throw new NotFoundException(`Segment ${id} not found`);
    await this.db.delete(segmentMemberships).where(eq(segmentMemberships.segmentId, id));
    await this.db.delete(segments).where(eq(segments.id, id));
    this.logger.log(`Deleted segment ${id}`);
  }

  /**
   * FILTER-TO-SQL ENGINE
   * Translates segment filter conditions into PostgreSQL JSONB queries
   * Handles operator mapping, value coercion, AND/OR nesting
   */
  private buildFilterWhere(filters: SegmentFilter[]): any {
    if (!filters || filters.length === 0) return undefined;

    const conditions = filters.map((filter, i) => {
      const nextGlue = i < filters.length - 1 ? (filters[i + 1].glue ?? 'and') : 'and';
      const fieldExpr = sql`contacts.fields->>${filter.field}`;
      const condition = this.buildCondition(filter.operator, fieldExpr, filter.value);
      return { condition, nextGlue };
    });

    // Group and/or conditions
    let currentGroup: any[] = [];
    let useOr = false;
    const groups: { conditions: any[]; glue: 'and' | 'or' }[] = [];

    for (const { condition, nextGlue } of conditions) {
      currentGroup.push(condition);
      if (nextGlue === 'or') {
        useOr = true;
      } else {
        groups.push({ conditions: [...currentGroup], glue: useOr ? 'or' : 'and' });
        currentGroup = [];
        useOr = false;
      }
    }

    if (currentGroup.length > 0) {
      groups.push({ conditions: currentGroup, glue: useOr ? 'or' : 'and' });
    }

    if (groups.length === 0) return undefined;
    if (groups.length === 1) {
      return groups[0].glue === 'or' ? or(...groups[0].conditions) : and(...groups[0].conditions);
    }
    return and(...groups.map(g => g.glue === 'or' ? or(...g.conditions) : and(...g.conditions)));
  }

  private buildCondition(operator: string, fieldExpr: any, value: any): any {
    switch (operator) {
      case '=': return eq(fieldExpr, String(value));
      case '!=': return sql`${fieldExpr} != ${String(value)}`;
      case '>': return sql`${fieldExpr}::numeric > ${Number(value)}`;
      case '<': return sql`${fieldExpr}::numeric < ${Number(value)}`;
      case '>=': return sql`${fieldExpr}::numeric >= ${Number(value)}`;
      case '<=': return sql`${fieldExpr}::numeric <= ${Number(value)}`;
      case 'like': return sql`${fieldExpr}::text ILIKE ${`%${value}%`}`;
      case 'not like': return sql`${fieldExpr}::text NOT ILIKE ${`%${value}%`}`;
      case 'startsWith': return sql`${fieldExpr}::text ILIKE ${`${value}%`}`;
      case 'endsWith': return sql`${fieldExpr}::text ILIKE ${`%${value}`}`;
      case 'regexp': return sql`${fieldExpr}::text ~ ${String(value)}`;
      case 'in': {
        const values = Array.isArray(value) ? value : String(value).split(',').map(s => s.trim());
        return sql`${fieldExpr} IN (${sql.join(values.map(v => sql`${v}`), sql`, `)})`;
      }
      case 'not in': {
        const values = Array.isArray(value) ? value : String(value).split(',').map(s => s.trim());
        return sql`${fieldExpr} NOT IN (${sql.join(values.map(v => sql`${v}`), sql`, `)})`;
      }
      case 'between': {
        const [min, max] = Array.isArray(value) ? value : String(value).split(',').map(s => Number(s.trim()));
        return sql`${fieldExpr}::numeric BETWEEN ${min} AND ${max}`;
      }
      case 'empty': return sql`(${fieldExpr} IS NULL OR ${fieldExpr} = '')`;
      case 'not empty': return sql`(${fieldExpr} IS NOT NULL AND ${fieldExpr} != '')`;
      default: return eq(fieldExpr, String(value));
    }
  }

  async getSegmentContacts(segmentId: string, params: FindAllParams) {
    const { page, limit } = params;
    const offset = (page - 1) * limit;

    const [data, totalResult] = await Promise.all([
      this.db.select({
        id: contacts.id,
        fields: contacts.fields,
        points: contacts.points,
        lastActive: contacts.lastActive,
        addedAt: segmentMemberships.addedAt,
        manuallyAdded: segmentMemberships.manuallyAdded,
      })
        .from(segmentMemberships)
        .innerJoin(contacts, eq(segmentMemberships.contactId, contacts.id))
        .where(and(eq(segmentMemberships.segmentId, segmentId), sql`${segmentMemberships.removedAt} IS NULL`))
        .limit(limit).offset(offset).orderBy(desc(segmentMemberships.addedAt)),

      this.db.select({ count: sql<number>`count(*)` })
        .from(segmentMemberships)
        .where(and(eq(segmentMemberships.segmentId, segmentId), sql`${segmentMemberships.removedAt} IS NULL`)),
    ]);

    const total = Number(totalResult[0]?.count ?? 0);
    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async addContact(segmentId: string, contactId: string) {
    const existing = await this.db.select()
      .from(segmentMemberships)
      .where(and(
        eq(segmentMemberships.segmentId, segmentId),
        eq(segmentMemberships.contactId, contactId),
        sql`${segmentMemberships.removedAt} IS NULL`,
      )).limit(1);

    if (!existing.length) {
      await this.db.insert(segmentMemberships).values({
        segmentId, contactId, manuallyAdded: true,
      }).onConflictDoNothing();
    }
    await this.db.update(segments).set({
      contactCount: sql`contact_count + 1`,
    }).where(eq(segments.id, segmentId));
    return { success: true };
  }

  async removeContact(segmentId: string, contactId: string) {
    await this.db.update(segmentMemberships)
      .set({ removedAt: new Date(), manuallyRemoved: true })
      .where(and(
        eq(segmentMemberships.segmentId, segmentId),
        eq(segmentMemberships.contactId, contactId),
        sql`${segmentMemberships.removedAt} IS NULL`,
      ));
    await this.db.update(segments).set({
      contactCount: sql`GREATEST(contact_count - 1, 0)`,
    }).where(eq(segments.id, segmentId));
  }

  /**
   * Rebuilds dynamic segment membership by re-evaluating all contacts against filters.
   * For static segments, filters are not re-evaluated.
   */
  async rebuildMembership(segmentId: string) {
    const seg = await this.findOne(segmentId);
    if (seg.type !== 'dynamic' || !seg.filters || seg.filters.length === 0) {
      return { added: 0, removed: 0 };
    }

    const whereClause = this.buildFilterWhere(seg.filters);
    const qualifiedContacts = await this.db.select({ id: contacts.id })
      .from(contacts)
      .where(whereClause);

    const qualifiedIds = qualifiedContacts.map((c: { id: string }) => c.id);
    const currentMembers = await this.db.select({ contactId: segmentMemberships.contactId })
      .from(segmentMemberships)
      .where(and(
        eq(segmentMemberships.segmentId, segmentId),
        sql`${segmentMemberships.removedAt} IS NULL`,
        sql`${segmentMemberships.manuallyRemoved} = false`,
      ));

    const currentIds = currentMembers.map((m: { contactId: string }) => m.contactId);
    const currentSet = new Set(currentIds);
    const qualifiedSet = new Set(qualifiedIds);

    const toAdd = qualifiedIds.filter((id: string) => !currentSet.has(id));
    const toRemove = currentIds.filter((id: string) => !qualifiedSet.has(id));

    if (toAdd.length > 0) {
      for (const contactId of toAdd) {
        await this.db.insert(segmentMemberships).values({ segmentId, contactId, manuallyAdded: false })
          .onConflictDoNothing();
      }
    }
    if (toRemove.length > 0) {
      await this.db.update(segmentMemberships).set({ removedAt: new Date() })
        .where(and(
          eq(segmentMemberships.segmentId, segmentId),
          inArray(segmentMemberships.contactId, toRemove),
          sql`${segmentMemberships.removedAt} IS NULL`,
        ));
    }

    await this.db.update(segments).set({ contactCount: qualifiedIds.length })
      .where(eq(segments.id, segmentId));

    this.logger.log(`Rebuilt segment ${segmentId}: +${toAdd.length} -${toRemove.length}`);
    return { added: toAdd.length, removed: toRemove.length };
  }

  async estimateMembership(filters: any[]) {
    if (!filters || filters.length === 0) return { estimatedCount: 0 };
    const whereClause = this.buildFilterWhere(filters);
    const result = await this.db.select({ count: sql<number>`count(*)` }).from(contacts).where(whereClause);
    return { estimatedCount: Number(result[0]?.count ?? 0) };
  }
}
