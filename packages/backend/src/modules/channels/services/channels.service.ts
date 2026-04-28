import { Injectable, Inject, Logger } from '@nestjs/common';
import { DATABASE } from '../../../database/database.module';
import { contacts } from '../../../database/schema/contacts.schema';
import { doNotContact } from '../../../database/schema/contacts.schema';
import { eq, sql } from 'drizzle-orm';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class ChannelsService {
  private readonly logger = new Logger(ChannelsService.name);
  constructor(
    @Inject(DATABASE) private readonly db: any,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async sendSms(contactId: string, message: string) {
    const [contact] = await this.db.select({ id: contacts.id, fields: contacts.fields })
      .from(contacts).where(eq(contacts.id, contactId)).limit(1);
    if (!contact) return { error: 'Contact not found' };

    // Check DNC
    const dnc = await this.db.select().from(doNotContact)
      .where(sql`contact_id = ${contactId} AND channel = 'sms'`).limit(1);
    if (dnc.length > 0) return { error: 'Contact opted out of SMS' };

    const phone = contact.fields?.['phone'] || contact.fields?.['mobile'];
    if (!phone) return { error: 'No phone number' };

    this.logger.log(`Sending SMS to ${contactId}: ${message.substring(0, 50)}...`);

    // Emit event for provider adapter
    this.eventEmitter.emit('sms.send', { contactId, phone, message });
    return { sent: true, phone };
  }

  async sendNotification(contactId: string, message: string, url?: string) {
    this.logger.log(`Sending web notification to ${contactId}: ${message.substring(0, 50)}...`);
    this.eventEmitter.emit('notification.send', { contactId, message, url });
    return { sent: true };
  }

  async getProviders() {
    return {
      sms: ['twilio', 'africas-talking'],
      email: ['ses', 'sendgrid', 'mailjet', 'smtp'],
      notification: ['web-push'],
    };
  }
}
