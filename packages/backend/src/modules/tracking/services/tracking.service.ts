import { Injectable, Inject, Logger } from '@nestjs/common';
import { DATABASE } from '../../../database/database.module';
import { contacts } from '../../../database/schema/contacts.schema';
import { pageHits } from '../../../database/schema/pages.schema';
import { emailStats } from '../../../database/schema/emails.schema';
import { formSubmissions } from '../../../database/schema/forms.schema';
import { assetDownloads } from '../../../database/schema/assets.schema';
import { eq, sql, and, gte, lte } from 'drizzle-orm';
import { Cron, CronExpression } from '@nestjs/schedule';

interface PageVisitData {
  url: string;
  trackingId?: string | null;
  title?: string;
  referrer?: string;
  ipAddress?: string;
  userAgent?: string;
}

@Injectable()
export class TrackingService {
  private readonly logger = new Logger(TrackingService.name);
  constructor(@Inject(DATABASE) private readonly db: any) {}

  async recordPageVisit(contactTrackingId: string | null, data: PageVisitData) {
    let contactId: string | null = null;

    // If we have a tracking ID, look up the contact
    if (contactTrackingId) {
      const [contact] = await this.db.select({ id: contacts.id })
        .from(contacts)
        .where(sql`id = ${contactTrackingId}::uuid`)
        .limit(1);
      if (contact) contactId = contact.id;
    }

    await this.db.insert(pageHits).values({
      contactId,
      url: data.url,
      title: data.title,
      referrer: data.referrer,
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
      dateHit: new Date(),
    });

    // Update contact lastActive
    if (contactId) {
      await this.db.update(contacts).set({ lastActive: new Date() }).where(eq(contacts.id, contactId));
    }
  }

  /**
   * Nightly stats aggregation for email stats.
   * Pre-computes totals to avoid counting raw rows on every dashboard load.
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async aggregateEmailStats() {
    this.logger.log('Starting nightly stats aggregation...');

    const emailAgg = await this.db.execute(sql`
      SELECT
        email_id,
        COUNT(*) FILTER (WHERE type = 'sent') AS sent_count,
        COUNT(*) FILTER (WHERE type = 'open') AS open_count,
        COUNT(*) FILTER (WHERE type = 'click') AS click_count,
        COUNT(*) FILTER (WHERE type = 'bounce') AS bounce_count,
        COUNT(*) FILTER (WHERE type = 'unsubscribe') AS unsubscribe_count
      FROM email_stats
      WHERE created_at >= NOW() - INTERVAL '24 hours'
      GROUP BY email_id
    `);

    if (emailAgg.length > 0) {
      for (const row of emailAgg) {
        await this.db.update(sql`emails`).set({
          sent_count: sql`sent_count + ${row.sent_count}`,
          open_count: sql`open_count + ${row.open_count}`,
          click_count: sql`click_count + ${row.click_count}`,
          bounce_count: sql`bounce_count + ${row.bounce_count}`,
          unsubscribe_count: sql`unsubscribe_count + ${row.unsubscribe_count}`,
        }).where(sql`id = ${row.email_id}`);
      }
    }

    this.logger.log(`Stats aggregation complete: ${emailAgg.length} emails updated`);
  }

  /** Get dashboard summary stats */
  async getDashboardStats() {
    const totalContacts = await this.db.select({ count: sql<number>`count(*)` }).from(contacts);
    const activeCampaigns = await this.db.select({ count: sql<number>`count(*)` }).from(sql`campaigns`).where(sql`is_published = true`);
    const todaySent = await this.db.select({ count: sql<number>`count(*)` }).from(emailStats).where(
      and(sql`type = 'sent'`, gte(sql`created_at`, sql`CURRENT_DATE`))
    );
    const todaySubmissions = await this.db.select({ count: sql<number>`count(*)` }).from(formSubmissions).where(
      gte(sql`created_at`, sql`CURRENT_DATE`)
    );

    return {
      totalContacts: Number(totalContacts[0]?.count ?? 0),
      activeCampaigns: Number(activeCampaigns[0]?.count ?? 0),
      todaySent: Number(todaySent[0]?.count ?? 0),
      todaySubmissions: Number(todaySubmissions[0]?.count ?? 0),
    };
  }
}
