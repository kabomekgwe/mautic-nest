import { Controller, Get, Post, Put, Delete, Param, Query, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { WebhookService } from '../services/webhook.service';

@Controller('webhooks')
export class WebhooksController {
  constructor(private readonly webhookService: WebhookService) {}

  @Get()
  async findAll(@Query('page') page?: string, @Query('limit') limit?: string) {
    return this.webhookService.findAll({ page: page ? parseInt(page,10) : 1, limit: limit ? parseInt(limit,10) : 30 });
  }

  @Get(':id')
  async findOne(@Param('id') id: string) { return this.webhookService.findOne(id); }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() data: any) { return this.webhookService.create(data); }

  @Put(':id')
  async update(@Param('id') id: string, @Body() data: any) { return this.webhookService.update(id, data); }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string) { await this.webhookService.remove(id); }
}
