import { Injectable, Inject, NotFoundException, Logger } from '@nestjs/common';
import { DATABASE } from '../../../database/database.module';
import { campaigns, campaignEvents, campaignMemberships, campaignLeadEventLog } from '../../../database/schema/campaigns.schema';
import { contacts } from '../../../database/schema/contacts.schema';
import { eq, and, or, ilike, sql, desc, inArray, isNull } from 'drizzle-orm';
import { EventEmitter2 } from '@nestjs/event-emitter';

interface FindAllParams { page: number; limit: number; search?: string; }

@Injectable()
export class CampaignService {
  private readonly logger = new Logger(CampaignService.name);

  constructor(
    @Inject(DATABASE) private readonly db: any,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async findAll(params: FindAllParams) {
    const { page, limit, search } = params;
    const offset = (page - 1) * limit;
    const where = search ? ilike(campaigns.name, `%${search}%`) : undefined;
    const [data, totalResult] = await Promise.all([
      this.db.select().from(campaigns).where(where).limit(limit).offset(offset).orderBy(desc(campaigns.createdAt)),
      this.db.select({ count: sql<number>`count(*)` }).from(campaigns).where(where),
    ]);
    const total = Number(totalResult[0]?.count ?? 0);
    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async findOne(id: string) {
    const camp = await this.db.select().from(campaigns).where(eq(campaigns.id, id)).limit(1);
    if (!camp.length) throw new NotFoundException(`Campaign ${id} not found`);
    const events = await this.db.select().from(campaignEvents).where(eq(campaignEvents.campaignId, id)).orderBy(campaignEvents.order);
    return { ...camp[0], events };
  }

  async create(data: { name: string; description?: string; segmentId?: string }) {
    const [camp] = await this.db.insert(campaigns).values({
      name: data.name,
      description: data.description,
      segmentId: data.segmentId,
    }).returning();
    this.logger.log(`Created campaign ${camp.id}: ${camp.name}`);
    return camp;
  }

  async update(id: string, data: any) {
    const existing = await this.db.select().from(campaigns).where(eq(campaigns.id, id)).limit(1);
    if (!existing.length) throw new NotFoundException(`Campaign ${id} not found`);
    const updateData: any = { updatedAt: new Date() };
    if (data.name) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.segmentId !== undefined) updateData.segmentId = data.segmentId;
    if (data.canvasSettings !== undefined) updateData.canvasSettings = data.canvasSettings;
    await this.db.update(campaigns).set(updateData).where(eq(campaigns.id, id));
    return this.findOne(id);
  }

  async remove(id: string) {
    await Promise.all([
      this.db.delete(campaignLeadEventLog).where(eq(campaignLeadEventLog.campaignId, id)),
      this.db.delete(campaignMemberships).where(eq(campaignMemberships.campaignId, id)),
      this.db.delete(campaignEvents).where(eq(campaignEvents.campaignId, id)),
      this.db.delete(campaigns).where(eq(campaigns.id, id)),
    ]);
    this.logger.log(`Deleted campaign ${id}`);
  }

  async addEvent(campaignId: string, data: {
    type: string; eventType: string; name: string;
    triggerMode?: string; properties?: any; position?: any;
    parentId?: string; decisionPath?: string;
  }) {
    const existing = await this.db.select().from(campaigns).where(eq(campaigns.id, campaignId)).limit(1);
    if (!existing.length) throw new NotFoundException(`Campaign ${campaignId} not found`);

    const maxOrder = await this.db.select({ max: sql<number>`COALESCE(MAX("order"), 0)` })
      .from(campaignEvents).where(eq(campaignEvents.campaignId, campaignId));

    // Update canvas settings
    const canvas = existing[0].canvasSettings ?? { nodes: [], connections: [] };
    const eventId = crypto.randomUUID();
    canvas.nodes.push({ id: eventId, type: data.type, eventType: data.eventType, name: data.name, position: data.position ?? { x: 100, y: 100 } });

    if (data.parentId) {
      canvas.connections.push({ sourceId: data.parentId, targetId: eventId, label: data.decisionPath ?? null });
    }

    const [event] = await this.db.insert(campaignEvents).values({
      id: eventId, campaignId,
      type: data.type, eventType: data.eventType, name: data.name,
      triggerMode: data.triggerMode ?? 'immediate',
      properties: data.properties ?? {},
      position: data.position ?? { x: 100, y: 100 },
      parentId: data.parentId, decisionPath: data.decisionPath,
      order: (maxOrder[0]?.max ?? 0) + 1,
    }).returning();

    await this.db.update(campaigns).set({ canvasSettings: canvas }).where(eq(campaigns.id, campaignId));
    return event;
  }

  async updateEvent(campaignId: string, eventId: string, data: any) {
    const updateData: any = {};
    if (data.name) updateData.name = data.name;
    if (data.properties !== undefined) updateData.properties = data.properties;
    if (data.triggerMode) updateData.triggerMode = data.triggerMode;
    if (data.triggerInterval !== undefined) updateData.triggerInterval = data.triggerInterval;
    if (data.triggerIntervalUnit) updateData.triggerIntervalUnit = data.triggerIntervalUnit;
    if (data.position !== undefined) updateData.position = data.position;

    await this.db.update(campaignEvents).set(updateData)
      .where(and(eq(campaignEvents.id, eventId), eq(campaignEvents.campaignId, campaignId)));
    return this.findOne(campaignId);
  }

  async removeEvent(campaignId: string, eventId: string) {
    const camp = await this.db.select().from(campaigns).where(eq(campaigns.id, campaignId)).limit(1);
    if (!camp.length) throw new NotFoundException(`Campaign ${campaignId} not found`);

    const canvas = camp[0].canvasSettings ?? { nodes: [], connections: [] };
      canvas.nodes = canvas.nodes.filter((n: { id: string }) => n.id !== eventId);
      canvas.connections = canvas.connections.filter((c: { sourceId: string; targetId: string }) => c.sourceId !== eventId && c.targetId !== eventId);

    await Promise.all([
      this.db.delete(campaignLeadEventLog).where(eq(campaignLeadEventLog.eventId, eventId)),
      this.db.delete(campaignEvents).where(eq(campaignEvents.id, eventId)),
      this.db.update(campaigns).set({ canvasSettings: canvas }).where(eq(campaigns.id, campaignId)),
    ]);
  }

  async activate(id: string) {
    await this.db.update(campaigns).set({ isPublished: true }).where(eq(campaigns.id, id));
    await this.syncSegmentMembers(id);
    this.logger.log(`Activated campaign ${id}`);
    return { success: true };
  }

  async deactivate(id: string) {
    await this.db.update(campaigns).set({ isPublished: false }).where(eq(campaigns.id, id));
    this.logger.log(`Deactivated campaign ${id}`);
    return { success: true };
  }

  /**
   * Syncs campaign membership from its source segment
   */
  async syncSegmentMembers(campaignId: string) {
    const camp = await this.findOne(campaignId);
    if (!camp.segmentId) return { added: 0 };

    const segmentContacts = await this.db.select({ id: contacts.id })
      .from(contacts)
      .innerJoin(sql`segment_memberships`, and(
        sql`segment_memberships.contact_id = contacts.id`,
        sql`segment_memberships.segment_id = ${camp.segmentId}`,
        sql`segment_memberships.removed_at IS NULL`,
      ));

    let added = 0;
    for (const c of segmentContacts) {
      const existing = await this.db.select()
        .from(campaignMemberships)
        .where(and(
          eq(campaignMemberships.campaignId, campaignId),
          eq(campaignMemberships.contactId, c.id),
          isNull(campaignMemberships.dateRemoved),
        )).limit(1);
      if (!existing.length) {
        await this.db.insert(campaignMemberships).values({ campaignId, contactId: c.id }).onConflictDoNothing();
        added++;
      }
    }

    if (added > 0) {
      await this.db.update(campaigns).set({ contactCount: sql`contact_count + ${added}` })
        .where(eq(campaigns.id, campaignId));
    }

    this.logger.log(`Synced ${added} contacts to campaign ${campaignId}`);
    return { added };
  }

  /**
   * DAG WALKER ENGINE
   * Core automation execution. Walks the campaign event DAG for a given contact.
   * Evaluates decisions, executes actions, handles scheduling.
   */
  async walkDag(campaignId: string, contactId: string, triggerEvent?: string): Promise<any> {
    const events = await this.db.select()
      .from(campaignEvents)
      .where(eq(campaignEvents.campaignId, campaignId))
      .orderBy(campaignEvents.order);

    if (events.length === 0) return { executed: 0 };

    // Find root events (no parent) or events matching the trigger
    let currentEvents = events.filter((e: any) => !e.parentId);

    // If trigger event specified, only walk that branch
    if (triggerEvent) {
      currentEvents = events.filter((e: any) => e.eventType === triggerEvent || e.parentId === null);
    }

    let executed = 0;
    for (const event of currentEvents) {
      const result = await this.executeEvent(event, campaignId, contactId, events);
      if (result.executed) executed++;
    }

    return { executed };
  }

  private async executeEvent(
    event: any, campaignId: string, contactId: string, allEvents: any[]
  ): Promise<{ executed: boolean; nextEventId?: string }> {
    // Check if already executed for this contact
    const logCheck = await this.db.select()
      .from(campaignLeadEventLog)
      .where(and(
        eq(campaignLeadEventLog.campaignId, campaignId),
        eq(campaignLeadEventLog.contactId, contactId),
        eq(campaignLeadEventLog.eventId, event.id),
        eq(campaignLeadEventLog.status, 'executed'),
      )).limit(1);

    if (logCheck.length > 0) return { executed: false };

    // Log pending
    await this.db.insert(campaignLeadEventLog).values({
      campaignId, contactId, eventId: event.id, status: 'pending',
    }).onConflictDoNothing();

    if (event.type === 'action') {
      await this.executeAction(event, campaignId, contactId);
      await this.db.update(campaignLeadEventLog)
        .set({ status: 'executed', executedAt: new Date() })
        .where(and(
          eq(campaignLeadEventLog.campaignId, campaignId),
          eq(campaignLeadEventLog.contactId, contactId),
          eq(campaignLeadEventLog.eventId, event.id),
        ));

      this.eventEmitter.emit('campaign.action.executed', {
        campaignId, contactId, eventId: event.id, eventType: event.eventType, properties: event.properties,
      });

      // Find children and continue walking
      const children = allEvents.filter(e => e.parentId === event.id);
      for (const child of children) {
        await this.executeEvent(child, campaignId, contactId, allEvents);
      }
      return { executed: true };
    }

    if (event.type === 'decision') {
      const outcome = await this.evaluateDecision(event, campaignId, contactId);
      await this.db.update(campaignLeadEventLog)
        .set({ status: 'executed', executedAt: new Date(), metadata: { outcome } })
        .where(and(
          eq(campaignLeadEventLog.campaignId, campaignId),
          eq(campaignLeadEventLog.contactId, contactId),
          eq(campaignLeadEventLog.eventId, event.id),
        ));

      this.eventEmitter.emit('campaign.decision.evaluated', {
        campaignId, contactId, eventId: event.id, eventType: event.eventType, outcome,
      });

      // Follow the matching branch
      const children = allEvents.filter(e =>
        e.parentId === event.id && e.decisionPath === (outcome ? 'yes' : 'no')
      );
      for (const child of children) {
        await this.executeEvent(child, campaignId, contactId, allEvents);
      }
      return { executed: true };
    }

    if (event.type === 'condition') {
      const passed = await this.evaluateCondition(event, campaignId, contactId);
      await this.db.update(campaignLeadEventLog)
        .set({ status: 'executed', executedAt: new Date(), metadata: { passed } })
        .where(and(
          eq(campaignLeadEventLog.campaignId, campaignId),
          eq(campaignLeadEventLog.contactId, contactId),
          eq(campaignLeadEventLog.eventId, event.id),
        ));

      const children = allEvents.filter(e =>
        e.parentId === event.id && e.decisionPath === (passed ? 'yes' : 'no')
      );
      for (const child of children) {
        await this.executeEvent(child, campaignId, contactId, allEvents);
      }
      return { executed: true };
    }

    return { executed: false };
  }

  /**
   * Executes a campaign action event
   */
  private async executeAction(event: any, campaignId: string, contactId: string): Promise<void> {
    const props = event.properties ?? {};
    this.logger.debug(`Execute action: ${event.eventType} on contact ${contactId}`);

    switch (event.eventType) {
      case 'email.send': {
        this.eventEmitter.emit('email.send.requested', {
          contactId, emailId: props.emailId, campaignId,
        });
        break;
      }
      case 'stage.change': {
        await this.db.update(contacts).set({ stageId: props.stageId }).where(eq(contacts.id, contactId));
        break;
      }
      case 'point.change': {
        await this.db.update(contacts).set({
          points: sql`points + ${props.points ?? 0}`,
        }).where(eq(contacts.id, contactId));
        break;
      }
      case 'tag.add': {
        const tagValues = Array.isArray(props.tags) ? props.tags.map((t: string) => ({
          contactId, tag: t,
        })) : [{ contactId, tag: props.tag }];
        for (const tv of tagValues) {
          await this.db.insert(sql`contact_tags`).values(tv).onConflictDoNothing().execute();
        }
        break;
      }
      case 'tag.remove': {
        const tagsToRemove = Array.isArray(props.tags) ? props.tags : [props.tag];
        for (const tag of tagsToRemove) {
          await this.db.delete(sql`contact_tags`).where(and(
            sql`contact_id = ${contactId}`,
            sql`tag = ${tag}`,
          )).execute();
        }
        break;
      }
      case 'lead.update': {
        await this.db.update(contacts).set({
          fields: sql`fields || ${JSON.stringify(props.fields ?? {})}::jsonb`,
        }).where(eq(contacts.id, contactId));
        break;
      }
      case 'notification.send': {
        this.eventEmitter.emit('notification.send.requested', {
          contactId, message: props.message, campaignId,
        });
        break;
      }
      case 'sms.send': {
        this.eventEmitter.emit('sms.send.requested', {
          contactId, message: props.message, campaignId,
        });
        break;
      }
      case 'campaign.add': {
        if (props.targetCampaignId) {
          await this.addContact(props.targetCampaignId, contactId);
        }
        break;
      }
      default: {
        this.eventEmitter.emit(`campaign.action.${event.eventType}`, {
          campaignId, contactId, event, properties: props,
        });
        break;
      }
    }
  }

  /**
   * Evaluates a decision event (binary yes/no based on contact action)
   */
  private async evaluateDecision(event: any, campaignId: string, contactId: string): Promise<boolean> {
    const props = event.properties ?? {};

    switch (event.eventType) {
      case 'email.open': {
        const opened = await this.db.select()
          .from(sql`email_stats`)
          .where(and(
            sql`contact_id = ${contactId}`,
            sql`type = 'open'`,
            props.emailId ? sql`email_id = ${props.emailId}` : sql<boolean>`true`,
          ))
          .limit(1).execute();
        return opened.length > 0;
      }
      case 'email.click': {
        const clicked = await this.db.select()
          .from(sql`email_stats`)
          .where(and(
            sql`contact_id = ${contactId}`,
            sql`type = 'click'`,
            props.emailId ? sql`email_id = ${props.emailId}` : sql<boolean>`true`,
          ))
          .limit(1).execute();
        return clicked.length > 0;
      }
      case 'form.submit': {
        const submitted = await this.db.select()
          .from(sql`form_submissions`)
          .where(and(
            sql`contact_id = ${contactId}`,
            props.formId ? sql`form_id = ${props.formId}` : sql<boolean>`true`,
          ))
          .limit(1).execute();
        return submitted.length > 0;
      }
      case 'page.hit': {
        const hit = await this.db.select()
          .from(sql`page_hits`)
          .where(and(
            sql`contact_id = ${contactId}`,
            props.pageId ? sql`page_id = ${props.pageId}` : sql<boolean>`true`,
          ))
          .limit(1).execute();
        return hit.length > 0;
      }
      case 'asset.download': {
        const dl = await this.db.select()
          .from(sql`asset_downloads`)
          .where(and(
            sql`contact_id = ${contactId}`,
            props.assetId ? sql`asset_id = ${props.assetId}` : sql<boolean>`true`,
          ))
          .limit(1).execute();
        return dl.length > 0;
      }
      default: {
        return false;
      }
    }
  }

  /**
   * Evaluates a condition event (field value, segment membership, point score)
   */
  private async evaluateCondition(event: any, campaignId: string, contactId: string): Promise<boolean> {
    const props = event.properties ?? {};
    const contact = await this.db.select().from(contacts).where(eq(contacts.id, contactId)).limit(1);
    if (!contact.length) return false;

    switch (event.eventType) {
      case 'field.value': {
        const fieldValue = contact[0].fields?.[props.field];
        if (fieldValue === undefined || fieldValue === null) return false;
        switch (props.operator) {
          case '=': return String(fieldValue) === String(props.value);
          case '!=': return String(fieldValue) !== String(props.value);
          case '>': return Number(fieldValue) > Number(props.value);
          case '<': return Number(fieldValue) < Number(props.value);
          case 'like': return String(fieldValue).toLowerCase().includes(String(props.value).toLowerCase());
          default: return String(fieldValue) === String(props.value);
        }
      }
      case 'segment.membership': {
        const member = await this.db.select()
          .from(sql`segment_memberships`)
          .where(and(
            sql`segment_id = ${props.segmentId}`,
            sql`contact_id = ${contactId}`,
            sql`removed_at IS NULL`,
          ))
          .limit(1).execute();
        return member.length > 0;
      }
      case 'point.score': {
        const points = contact[0].points ?? 0;
        switch (props.operator) {
          case '>=': return points >= Number(props.value);
          case '>': return points > Number(props.value);
          case '<=': return points <= Number(props.value);
          case '<': return points < Number(props.value);
          case '=': return points === Number(props.value);
          default: return points >= Number(props.value);
        }
      }
      default: return false;
    }
  }

  async getCampaignContacts(campaignId: string, params: FindAllParams) {
    const { page, limit } = params;
    const offset = (page - 1) * limit;

    const [data, totalResult] = await Promise.all([
      this.db.select({
        id: contacts.id, fields: contacts.fields, points: contacts.points,
        dateAdded: campaignMemberships.dateAdded,
      })
        .from(campaignMemberships)
        .innerJoin(contacts, eq(campaignMemberships.contactId, contacts.id))
        .where(and(
          eq(campaignMemberships.campaignId, campaignId),
          isNull(campaignMemberships.dateRemoved),
        ))
        .limit(limit).offset(offset).orderBy(desc(campaignMemberships.dateAdded)),
      this.db.select({ count: sql<number>`count(*)` })
        .from(campaignMemberships)
        .where(and(eq(campaignMemberships.campaignId, campaignId), isNull(campaignMemberships.dateRemoved))),
    ]);

    const total = Number(totalResult[0]?.count ?? 0);
    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async addContact(campaignId: string, contactId: string) {
    const existing = await this.db.select()
      .from(campaignMemberships)
      .where(and(
        eq(campaignMemberships.campaignId, campaignId),
        eq(campaignMemberships.contactId, contactId),
        isNull(campaignMemberships.dateRemoved),
      )).limit(1);
    if (!existing.length) {
      await this.db.insert(campaignMemberships).values({ campaignId, contactId, manuallyAdded: true });
      await this.db.update(campaigns).set({ contactCount: sql`contact_count + 1` }).where(eq(campaigns.id, campaignId));
    }
    // Walk DAG for the new contact
    await this.walkDag(campaignId, contactId);
    return { success: true };
  }

  async removeContact(campaignId: string, contactId: string) {
    await this.db.update(campaignMemberships)
      .set({ dateRemoved: new Date(), manuallyRemoved: true })
      .where(and(
        eq(campaignMemberships.campaignId, campaignId),
        eq(campaignMemberships.contactId, contactId),
        isNull(campaignMemberships.dateRemoved),
      ));
    await this.db.update(campaigns).set({
      contactCount: sql`GREATEST(contact_count - 1, 0)`,
    }).where(eq(campaigns.id, campaignId));
  }
}
