import { Injectable, Inject, NotFoundException, Logger } from '@nestjs/common';
import { DATABASE } from '../../../database/database.module';
import { webhooks, webhookLogs } from '../../../database/schema/webhooks.schema';
import { eq, desc, sql } from 'drizzle-orm';
import { OnEvent } from '@nestjs/event-emitter';
import { createHash } from 'crypto';

@Injectable()
export class WebhookService {
  private readonly logger = new Logger(WebhookService.name);
  constructor(@Inject(DATABASE) private readonly db: any) {}

  async findAll(params: { page: number; limit: number }) {
    const offset = (params.page - 1) * params.limit;
    const [data, totalResult] = await Promise.all([
      this.db.select().from(webhooks).limit(params.limit).offset(offset).orderBy(desc(webhooks.createdAt)),
      this.db.select({ count: sql<number>`count(*)` }).from(webhooks),
    ]);
    return { data, meta: { total: Number(totalResult[0]?.count ?? 0), ...params } };
  }

  async findOne(id: string) {
    const result = await this.db.select().from(webhooks).where(eq(webhooks.id, id)).limit(1);
    if (!result.length) throw new NotFoundException(`Webhook ${id} not found`);
    return result[0];
  }

  async create(data: { name: string; url: string; eventTypes: string[]; secret?: string; queueMode?: string }) {
    const [wh] = await this.db.insert(webhooks).values({
      name: data.name, url: data.url,
      eventTypes: data.eventTypes,
      secret: data.secret ?? crypto.randomUUID(),
      queueMode: data.queueMode ?? 'immediate',
    }).returning();
    this.logger.log(`Created webhook ${wh.id}: ${wh.name}`);
    return wh;
  }

  async update(id: string, data: any) {
    await this.db.update(webhooks).set({ ...data, updatedAt: new Date() }).where(eq(webhooks.id, id));
    return this.findOne(id);
  }

  async remove(id: string) {
    await this.db.delete(webhookLogs).where(eq(webhookLogs.webhookId, id));
    await this.db.delete(webhooks).where(eq(webhooks.id, id));
  }

  /**
   * Event-driven webhook dispatcher. Listens to all domain events and fires
   * matching webhooks.
   */
  @OnEvent('**')
  async handleDomainEvent(payload: any) {
    const eventType = (payload as any)?.eventType;
    if (!eventType) return;

    const hooks = await this.db.select()
      .from(webhooks)
      .where(sql`${webhooks.eventTypes} ? ${eventType} AND ${webhooks.isPublished} = true`)
      .limit(10);

    for (const hook of hooks) {
      const signature = createHash('sha256')
        .update(JSON.stringify(payload) + (hook.secret ?? ''))
        .digest('hex');

      try {
        const response = await fetch(hook.url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Webhook-Signature': signature,
            'User-Agent': 'Mautic-Nest-Webhook/1.0',
          },
          body: JSON.stringify({ [eventType]: [payload] }),
        });

        await this.db.insert(webhookLogs).values({
          webhookId: hook.id, eventType,
          payload, statusCode: response.status,
          status: response.ok ? 'success' : 'failed',
        });

        if (!response.ok) {
          this.logger.warn(`Webhook ${hook.id} returned ${response.status} for ${eventType}`);
        }
      } catch (err) {
        await this.db.insert(webhookLogs).values({
          webhookId: hook.id, eventType,
          payload, statusCode: 0,
          status: 'failed', response: String(err),
        });
        this.logger.error(`Webhook ${hook.id} failed for ${eventType}: ${err}`);
      }

      await this.db.update(webhooks).set({ lastExecution: new Date() }).where(eq(webhooks.id, hook.id));
    }
  }
}
