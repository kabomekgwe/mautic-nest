import { Injectable, Inject, NotFoundException, Logger } from '@nestjs/common';
import { DATABASE } from '../../../database/database.module';
import { emails, emailStats } from '../../../database/schema/emails.schema';
import { contacts } from '../../../database/schema/contacts.schema';
import { eq, desc, sql, and, inArray, isNull } from 'drizzle-orm';
import { OnEvent, EventEmitter2 } from '@nestjs/event-emitter';
import { Response, Request } from 'express';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  constructor(
    @Inject(DATABASE) private readonly db: any,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async findAll(params: { page: number; limit: number }) {
    const offset = (params.page - 1) * params.limit;
    const [data, totalResult] = await Promise.all([
      this.db.select().from(emails).limit(params.limit).offset(offset).orderBy(desc(emails.createdAt)),
      this.db.select({ count: sql<number>`count(*)` }).from(emails),
    ]);
    return { data, meta: { total: Number(totalResult[0]?.count ?? 0), ...params } };
  }

  async findOne(id: string) {
    const result = await this.db.select().from(emails).where(eq(emails.id, id)).limit(1);
    if (!result.length) throw new NotFoundException(`Email ${id} not found`);
    return result[0];
  }

  async create(data: { name: string; subject: string; body?: string; template?: string; type?: string; listId?: string }) {
    const [email] = await this.db.insert(emails).values(data).returning();
    return email;
  }

  async update(id: string, data: any) {
    await this.db.update(emails).set({ ...data, updatedAt: new Date() }).where(eq(emails.id, id));
    return this.findOne(id);
  }

  async remove(id: string) {
    await this.db.delete(emailStats).where(eq(emailStats.emailId, id));
    await this.db.delete(emails).where(eq(emails.id, id));
  }

  /**
   * Email sending pipeline. Supports sending to specific contacts or a segment.
   * Creates email_stat records and emits events for tracking.
   */
  async send(emailId: string, contactIds?: string[], segmentId?: string) {
    const email = await this.findOne(emailId);
    let targets: any[] = [];

    if (contactIds && contactIds.length > 0) {
      const results = await this.db.select({ id: contacts.id, fields: contacts.fields })
        .from(contacts).where(inArray(contacts.id, contactIds));
      targets = results;
    } else if (segmentId) {
      const results = await this.db.select({ id: contacts.id, fields: contacts.fields })
        .from(contacts)
        .innerJoin(sql`segment_memberships`,
          and(sql`segment_memberships.contact_id = contacts.id`,
              sql`segment_memberships.segment_id = ${segmentId}`,
              isNull(sql`segment_memberships.removed_at`)))
        .innerJoin(sql`do_not_contact`,
          and(sql`do_not_contact.contact_id = contacts.id`,
              sql`do_not_contact.channel = 'email'`));
      targets = results;
    } else {
      throw new Error('Must provide contactIds or segmentId');
    }

    let sent = 0;
    for (const target of targets) {
      const trackingId = crypto.randomUUID();
      const emailField = target.fields?.email;
      if (!emailField) {
        this.logger.warn(`Contact ${target.id} has no email, skipping`);
        continue;
      }

      await this.db.insert(emailStats).values({
        emailId, contactId: target.id, type: 'sent',
        source: segmentId ? 'list' : 'manual',
      });

      this.eventEmitter.emit('email.sent', {
        trackingId, emailId, contactId: target.id,
        to: emailField, subject: email.subject,
        body: this.injectTrackingLinks(email.body, trackingId),
      });
      sent++;
    }

    await this.db.update(emails).set({
      sentCount: sql`sent_count + ${sent}`,
    }).where(eq(emails.id, emailId));

    this.logger.log(`Sent email ${emailId} to ${sent} contacts`);
    return { sent };
  }

  private injectTrackingLinks(htmlBody: string | null, trackingId: string): string {
    if (!htmlBody) return '';
    const baseUrl = process.env['FRONTEND_URL'] ?? 'http://localhost:3001';
    // Inject open tracking pixel at end of body
    const pixelUrl = `${baseUrl}/api/emails/track/open/${trackingId}`;
    let result = htmlBody;
    // Rewrite all href links to use click tracker
    result = result.replace(/href="(https?:\/\/([^"]+))"/g, `href="${baseUrl}/api/emails/track/click/${trackingId}?url=$1"`);
    // Inject tracking pixel before </body>
    result = result.replace('</body>', `<img src="${pixelUrl}" alt="" width="1" height="1" /></body>`);
    return result;
  }

  async recordOpen(trackingId: string, meta: { ipAddress?: string; userAgent?: string }) {
    await this.db.insert(emailStats).values({
      type: 'open', ipAddress: meta.ipAddress, userAgent: meta.userAgent,
      dateOpened: new Date(),
    });
    // Update the parent email stat if we can find it
    await this.db.update(emails).set({
      openCount: sql`open_count + 1`,
    }).where(eq(emails.id, sql`(SELECT email_id FROM email_stats WHERE id = ${sql.placeholder('sid')})`));
  }

  async recordClick(trackingId: string, meta: { url?: string; ipAddress?: string; userAgent?: string }) {
    await this.db.insert(emailStats).values({
      type: 'click', clickUrl: meta.url, ipAddress: meta.ipAddress, userAgent: meta.userAgent,
      dateClicked: new Date(),
    });
    await this.db.update(emails).set({
      clickCount: sql`click_count + 1`,
    });
  }

  @OnEvent('email.send.requested')
  async handleCampaignSend(payload: { contactId: string; emailId: string; campaignId: string }) {
    await this.send(payload.emailId, [payload.contactId]);
  }
}
