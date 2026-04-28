import { Injectable, Inject, NotFoundException, Logger } from '@nestjs/common';
import { DATABASE } from '../../../database/database.module';
import { forms, formFields, formActions, formSubmissions } from '../../../database/schema/forms.schema';
import { contacts } from '../../../database/schema/contacts.schema';
import { eq, desc, sql, and } from 'drizzle-orm';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class FormService {
  private readonly logger = new Logger(FormService.name);
  constructor(
    @Inject(DATABASE) private readonly db: any,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async findAll(params: { page: number; limit: number }) {
    const offset = (params.page - 1) * params.limit;
    const [data, totalResult] = await Promise.all([
      this.db.select().from(forms).limit(params.limit).offset(offset).orderBy(desc(forms.createdAt)),
      this.db.select({ count: sql<number>`count(*)` }).from(forms),
    ]);
    return { data, meta: { total: Number(totalResult[0]?.count ?? 0), ...params } };
  }

  async findOne(id: string) {
    const form = await this.db.select().from(forms).where(eq(forms.id, id)).limit(1);
    if (!form.length) throw new NotFoundException(`Form ${id} not found`);
    const [fields, actions] = await Promise.all([
      this.db.select().from(formFields).where(eq(formFields.formId, id)).orderBy(formFields.order),
      this.db.select().from(formActions).where(eq(formActions.formId, id)).orderBy(formActions.order),
    ]);
    return { ...form[0], fields, actions };
  }

  async create(data: { name: string; description?: string; captureLead?: boolean; template?: string }) {
    const [form] = await this.db.insert(forms).values(data).returning();
    return form;
  }

  async update(id: string, data: any) {
    await this.db.update(forms).set(data).where(eq(forms.id, id));
    return this.findOne(id);
  }

  async remove(id: string) {
    await Promise.all([
      this.db.delete(formFields).where(eq(formFields.formId, id)),
      this.db.delete(formActions).where(eq(formActions.formId, id)),
      this.db.delete(formSubmissions).where(eq(formSubmissions.formId, id)),
      this.db.delete(forms).where(eq(forms.id, id)),
    ]);
  }

  async addAction(formId: string, data: { actionType: string; properties?: any }) {
    const maxOrder = await this.db.select({ max: sql<number>`COALESCE(MAX("order"), 0)` })
      .from(formActions).where(eq(formActions.formId, formId));
    const [action] = await this.db.insert(formActions).values({
      formId, actionType: data.actionType,
      properties: data.properties ?? {},
      order: (maxOrder[0]?.max ?? 0) + 1,
    }).returning();
    return action;
  }

  /**
   * Handles form submission: stores data, optionally creates/updates contact,
   * fires events that trigger point actions and campaign decisions.
   */
  async submit(formId: string, data: { data: Record<string, any>; ipAddress?: string; userAgent?: string }) {
    const form = await this.findOne(formId);

    let contactId: string | null = null;

    // Create or update contact from submission data
    if (form.captureLead) {
      const email = data.data['email'] as string | undefined;
      if (email) {
        const existing = await this.db.select().from(contacts)
          .where(sql`contacts.fields->>'email' = ${email}`).limit(1);

        if (existing.length) {
          contactId = existing[0].id;
          await this.db.update(contacts).set({
            fields: sql`fields || ${JSON.stringify(data.data)}::jsonb`,
            updatedAt: new Date(),
          }).where(eq(contacts.id, contactId as string));
        } else {
          const [contact] = await this.db.insert(contacts).values({
            fields: data.data, lastActive: new Date(),
          }).returning();
          contactId = contact.id;
        }
      } else {
        const [contact] = await this.db.insert(contacts).values({
          fields: data.data, lastActive: new Date(),
        }).returning();
        contactId = contact.id;
      }
    }

    // Record submission
    const [submission] = await this.db.insert(formSubmissions).values({
      formId, contactId: contactId,
      data: data.data, ipAddress: data.ipAddress, userAgent: data.userAgent,
    }).returning();

    await this.db.update(forms).set({
      submissionCount: sql`submission_count + 1`,
    }).where(eq(forms.id, formId));

    // Execute post-submit actions
    for (const action of form.actions) {
      await this.executeFormAction(action, formId, contactId, data.data);
    }

    // Fire events for point actions, campaigns, webhooks
    this.eventEmitter.emit('form.submitted', {
      eventType: 'form.submit',
      formId, contactId, data: data.data, submissionId: submission.id,
    });

    this.logger.log(`Form ${formId} submitted by contact ${contactId ?? 'anonymous'}`);
    return submission;
  }

  private async executeFormAction(action: any, formId: string, contactId: string | null, submittedData: Record<string, any>) {
    if (!contactId) return;
    const props = action.properties ?? {};

    switch (action.actionType) {
      case 'lead.update': {
        await this.db.update(contacts).set({
          fields: sql`fields || ${JSON.stringify(props.fields ?? {})}::jsonb`,
        }).where(eq(contacts.id, contactId));
        break;
      }
      case 'lead.points': {
        await this.db.update(contacts).set({
          points: sql`points + ${props.points ?? 0}`,
        }).where(eq(contacts.id, contactId));
        break;
      }
      case 'lead.tags': {
        if (Array.isArray(props.tags)) {
          for (const tag of props.tags) {
            await this.db.insert(sql`contact_tags`).values({ contactId, tag }).onConflictDoNothing().execute();
          }
        }
        break;
      }
      case 'send.email': {
        this.eventEmitter.emit('email.send.requested', { contactId, emailId: props.emailId });
        break;
      }
      case 'campaign.add': {
        if (props.campaignId) {
          this.eventEmitter.emit('campaign.add.contact', { campaignId: props.campaignId, contactId });
        }
        break;
      }
    }
  }

  async getSubmissions(formId: string, params: { page: number; limit: number }) {
    const offset = (params.page - 1) * params.limit;
    const [data, totalResult] = await Promise.all([
      this.db.select().from(formSubmissions).where(eq(formSubmissions.formId, formId))
        .limit(params.limit).offset(offset).orderBy(desc(formSubmissions.createdAt)),
      this.db.select({ count: sql<number>`count(*)` }).from(formSubmissions).where(eq(formSubmissions.formId, formId)),
    ]);
    return { data, meta: { total: Number(totalResult[0]?.count ?? 0), ...params } };
  }
}
