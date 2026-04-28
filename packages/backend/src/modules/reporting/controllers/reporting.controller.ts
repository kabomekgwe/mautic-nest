import { Controller, Get, Post, Put, Delete, Param, Query, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ReportingService } from '../services/reporting.service';

@Controller('reports')
export class ReportingController {
  constructor(private readonly reportingService: ReportingService) {}

  @Get()
  async findAll(@Query('page') page?: string, @Query('limit') limit?: string) {
    return this.reportingService.findAll({ page: page ? parseInt(page,10) : 1, limit: limit ? parseInt(limit,10) : 30 });
  }

  @Get(':id')
  async findOne(@Param('id') id: string) { return this.reportingService.findOne(id); }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() data: any) { return this.reportingService.create(data); }

  @Put(':id')
  async update(@Param('id') id: string, @Body() data: any) { return this.reportingService.update(id, data); }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string) { await this.reportingService.remove(id); }

  @Post(':id/run')
  async run(@Param('id') id: string, @Query('format') format?: string) {
    return this.reportingService.runReport(id, format);
  }

  // Dashboard endpoints
  @Get('dashboard/widgets')
  async getWidgets() { return this.reportingService.getWidgets(); }

  @Post('dashboard/widgets')
  @HttpCode(HttpStatus.CREATED)
  async createWidget(@Body() data: any) { return this.reportingService.createWidget(data); }

  @Put('dashboard/widgets/:id')
  async updateWidget(@Param('id') id: string, @Body() data: any) { return this.reportingService.updateWidget(id, data); }

  @Delete('dashboard/widgets/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeWidget(@Param('id') id: string) { await this.reportingService.removeWidget(id); }

  // Ad-hoc query
  @Post('query')
  async adhocQuery(@Body() data: { source: string; columns: string[]; filters?: any[]; groupBy?: string }) {
    return this.reportingService.executeQuery(data);
  }
}
