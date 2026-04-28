import { Injectable, Inject, NotFoundException, Logger } from '@nestjs/common';
import { DATABASE } from '../../../database/database.module';
import { eq, desc, sql, and, ilike } from 'drizzle-orm';
import { contacts } from '../../../database/schema/contacts.schema';

interface ReportColumn { field: string; label: string; aggregation?: 'SUM' | 'AVG' | 'COUNT' | 'MIN' | 'MAX'; }
interface ReportFilter { column: string; operator: string; value: any; }
interface ReportGraph { type: 'bar' | 'line' | 'pie' | 'table' | 'area'; options: Record<string, any>; }

@Injectable()
export class ReportingService {
  private readonly logger = new Logger(ReportingService.name);
  constructor(@Inject(DATABASE) private readonly db: any) {}

  async findAll(params: { page: number; limit: number }) {
    const offset = (params.page - 1) * params.limit;
    const [data, totalResult] = await Promise.all([
      this.db.select().from(sql`reports`).limit(params.limit).offset(offset).orderBy(sql`created_at DESC`),
      this.db.select({ count: sql<number>`count(*)` }).from(sql`reports`),
    ]);
    return { data, meta: { total: Number(totalResult[0]?.count ?? 0), ...params } };
  }

  async findOne(id: string) {
    const [report] = await this.db.select().from(sql`reports`).where(sql`id = ${id}`).limit(1);
    if (!report) throw new NotFoundException(`Report ${id} not found`);
    return report;
  }

  async create(data: { name: string; source: string; columns: ReportColumn[]; filters?: ReportFilter[]; graphs?: ReportGraph[] }) {
    const [report] = await this.db.insert(sql`reports`).values({
      name: data.name,
      source: data.source,
      columns: JSON.stringify(data.columns),
      filters: JSON.stringify(data.filters ?? []),
      graphs: JSON.stringify(data.graphs ?? []),
      created_at: new Date(),
      updated_at: new Date(),
    }).returning();
    return report;
  }

  async update(id: string, data: any) {
    await this.db.update(sql`reports`).set({ ...data, updated_at: new Date() }).where(sql`id = ${id}`);
    return this.findOne(id);
  }

  async remove(id: string) {
    await this.db.delete(sql`reports`).where(sql`id = ${id}`);
  }

  /**
   * SQL query builder that translates report config into executable queries.
   * Supports multiple data sources with column selection, filtering, grouping, and aggregation.
   */
  async runReport(id: string, format?: string) {
    const report = await this.findOne(id);
    const query = this.buildQuery(report);
    const data = await this.db.execute(query);
    const chartData = this.formatChartData(data, report.graphs);
    return { data, chartData, format: format ?? 'table' };
  }

  private buildQuery(report: any): any {
    const source = report.source;
    const columns = report.columns as ReportColumn[];
    const filters = report.filters as ReportFilter[];

    // Build SELECT clause
    const selectParts = columns.map((col) => {
      if (col.aggregation) {
        return sql`${sql.raw(col.aggregation)}(${this.resolveField(source, col.field)}) AS ${sql.raw(col.label)}`;
      }
      return sql`${this.resolveField(source, col.field)} AS ${sql.raw(col.label)}`;
    });

    let query = this.db.select(selectParts).from(this.resolveSource(source));

    // WHERE clause
    if (filters && filters.length > 0) {
      const conditions = filters.map((f) => {
        const field = this.resolveField(source, f.column);
        return this.buildCondition(f.operator, field, f.value);
      });
      query = query.where(and(...conditions));
    }

    return query;
  }

  private resolveSource(source: string): any {
    switch (source) {
      case 'contacts': return contacts;
      case 'email_stats': return sql`email_stats`;
      case 'form_submissions': return sql`form_submissions`;
      case 'page_hits': return sql`page_hits`;
      case 'campaigns': return sql`campaigns`;
      case 'campaign_lead_event_log': return sql`campaign_lead_event_log`;
      default: return sql.raw(source);
    }
  }

  private resolveField(source: string, field: string): any {
    if (field.startsWith('fields.')) {
      const alias = field.replace('fields.', '');
      return sql`contacts.fields->>${alias}`;
    }
    return sql.raw(field);
  }

  private buildCondition(operator: string, field: any, value: any): any {
    switch (operator) {
      case '=': return sql`${field} = ${value}`;
      case '!=': return sql`${field} != ${value}`;
      case '>': return sql`${field} > ${value}`;
      case '<': return sql`${field} < ${value}`;
      case '>=': return sql`${field} >= ${value}`;
      case '<=': return sql`${field} <= ${value}`;
      case 'like': return sql`${field} ILIKE ${'%' + value + '%'}`;
      case 'in': return sql`${field} IN ${sql.raw(`(${String(value)})`)}`;
      default: return sql`${field} = ${value}`;
    }
  }

  private formatChartData(data: any[], graphs: ReportGraph[]) {
    if (!graphs || graphs.length === 0) return [];
    return graphs.map((graph) => {
      const chartConfig: any = {
        type: graph.type,
        data: data.slice(0, graph.options?.limit ?? 50),
        options: graph.options,
      };
      return chartConfig;
    });
  }

  /** Pre-built metric queries for dashboard widgets */
  async getWidgets() {
    return this.db.select().from(sql`dashboard_widgets`).orderBy(sql`ordering`);
  }

  async createWidget(data: { name: string; type: string; config: any; width?: number; height?: number; ordering?: number }) {
    const [widget] = await this.db.insert(sql`dashboard_widgets`).values({
      name: data.name, type: data.type, config: JSON.stringify(data.config),
      width: data.width ?? 2, height: data.height ?? 1, ordering: data.ordering ?? 0,
    }).returning();
    return widget;
  }

  async updateWidget(id: string, data: any) {
    await this.db.update(sql`dashboard_widgets`).set(data).where(sql`id = ${id}`);
    return this.db.select().from(sql`dashboard_widgets`).where(sql`id = ${id}`).limit(1);
  }

  async removeWidget(id: string) {
    await this.db.delete(sql`dashboard_widgets`).where(sql`id = ${id}`);
  }

  /** Ad-hoc query execution */
  async executeQuery(params: { source: string; columns: string[]; filters?: any[]; groupBy?: string }) {
    const colExprs = params.columns.map((c) => sql.raw(c));
    let query = this.db.select(colExprs).from(this.resolveSource(params.source));

    if (params.filters && params.filters.length > 0) {
      const conditions = params.filters.map((f) => this.buildCondition(f.operator, sql.raw(f.column), f.value));
      query = query.where(and(...conditions));
    }

    if (params.groupBy) {
      query = query.groupBy(sql.raw(params.groupBy));
    }

    return query;
  }
}
