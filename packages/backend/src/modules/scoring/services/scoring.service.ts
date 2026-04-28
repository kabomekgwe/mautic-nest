import { Injectable, Inject, Logger, NotFoundException } from '@nestjs/common';
import { DATABASE } from '../../../database/database.module';
import { pointActions, pointTriggers, stages, contactStageLog } from '../../../database/schema/scoring.schema';
import { contacts } from '../../../database/schema/contacts.schema';
import { eq, desc, sql, and } from 'drizzle-orm';
import { OnEvent } from '@nestjs/event-emitter';

@Injectable()
export class ScoringService {
  private readonly logger = new Logger(ScoringService.name);
  constructor(@Inject(DATABASE) private readonly db: any) {}

  // === POINT ACTIONS ===
  async getPointActions() {
    return this.db.select().from(pointActions).orderBy(desc(pointActions.createdAt));
  }

  async createPointAction(data: { name: string; type: string; points: number; properties?: any }) {
    const [pa] = await this.db.insert(pointActions).values(data).returning();
    this.logger.log(`Created point action ${pa.id}: ${pa.type} = ${pa.points}pts`);
    return pa;
  }

  async updatePointAction(id: string, data: any) {
    await this.db.update(pointActions).set(data).where(eq(pointActions.id, id));
    return this.db.select().from(pointActions).where(eq(pointActions.id, id)).limit(1);
  }

  async removePointAction(id: string) {
    await this.db.delete(pointActions).where(eq(pointActions.id, id));
  }

  // === POINT TRIGGERS ===
  async getPointTriggers() {
    return this.db.select().from(pointTriggers).orderBy(desc(pointTriggers.createdAt));
  }

  async createPointTrigger(data: any) {
    const [pt] = await this.db.insert(pointTriggers).values(data).returning();
    return pt;
  }

  async updatePointTrigger(id: string, data: any) {
    await this.db.update(pointTriggers).set(data).where(eq(pointTriggers.id, id));
    return this.db.select().from(pointTriggers).where(eq(pointTriggers.id, id)).limit(1);
  }

  async removePointTrigger(id: string) {
    await this.db.delete(pointTriggers).where(eq(pointTriggers.id, id));
  }

  // === STAGES ===
  async getStages() {
    return this.db.select().from(stages).orderBy(stages.weight);
  }

  async createStage(data: { name: string; description?: string; weight?: number }) {
    const [s] = await this.db.insert(stages).values(data).returning();
    return s;
  }

  async updateStage(id: string, data: any) {
    await this.db.update(stages).set(data).where(eq(stages.id, id));
    return this.db.select().from(stages).where(eq(stages.id, id)).limit(1);
  }

  async removeStage(id: string) {
    await this.db.delete(contactStageLog).where(eq(contactStageLog.stageId, id));
    await this.db.delete(stages).where(eq(stages.id, id));
  }

  /**
   * Applies points to a contact when an event matches a point action.
   * Listens to all domain events.
   */
  @OnEvent('**')
  async handlePointEvent(payload: any) {
    const eventType = (payload as any)?.eventType;
    if (!eventType) return;
    const contactId = (payload as any)?.contactId;
    if (!contactId) return;

    const matchingActions = await this.db.select()
      .from(pointActions)
      .where(sql`${pointActions.type} = ${eventType} AND ${pointActions.isPublished} = true`);

    if (!matchingActions.length) return;

    for (const action of matchingActions) {
      await this.db.update(contacts)
        .set({ points: sql`points + ${action.points}` })
        .where(eq(contacts.id, contactId));

      this.logger.debug(`Applied ${action.points}pts to contact ${contactId} for ${eventType}`);
    }

    // Check point triggers
    const contact = await this.db.select().from(contacts).where(eq(contacts.id, contactId)).limit(1);
    if (!contact.length) return;
    const currentPoints = contact[0].points ?? 0;

    const triggers = await this.db.select()
      .from(pointTriggers)
      .where(and(
        sql`${pointTriggers.type} = 'points.reach'`,
        sql`${pointTriggers.points} <= ${currentPoints}`,
        sql`${pointTriggers.isPublished} = true`,
      ));

    for (const trigger of triggers) {
      this.logger.log(`Point trigger ${trigger.id} fired for contact ${contactId} at ${currentPoints}pts`);
      if (trigger.actionType === 'lead.stage.change') {
        const targetStageId = trigger.properties?.stageId;
        if (targetStageId) {
          await this.db.update(contacts).set({ stageId: targetStageId }).where(eq(contacts.id, contactId));
          await this.db.insert(contactStageLog).values({
            contactId, stageId: targetStageId, eventName: 'trigger',
          });
        }
      }
    }
  }
}
