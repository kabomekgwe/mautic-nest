import { Controller, Get, Post, Put, Delete, Param, Query, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { DynamicContentService } from '../services/dynamic-content.service';

@Controller('dynamic-content')
export class DynamicContentController {
  constructor(private readonly dcService: DynamicContentService) {}

  @Get()
  async findAll(@Query('page') page?: string, @Query('limit') limit?: string) {
    return this.dcService.findAll({ page: page ? parseInt(page,10) : 1, limit: limit ? parseInt(limit,10) : 30 });
  }

  @Get(':id')
  async findOne(@Param('id') id: string) { return this.dcService.findOne(id); }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() data: any) { return this.dcService.create(data); }

  @Put(':id')
  async update(@Param('id') id: string, @Body() data: any) { return this.dcService.update(id, data); }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string) { await this.dcService.remove(id); }

  @Post('render')
  async render(@Body() data: { content: string; contactId: string }) {
    return this.dcService.render(data.content, data.contactId);
  }

  @Post('slot/:slotName')
  async getForSlot(@Param('slotName') slotName: string, @Body() data: { contactId: string }) {
    return this.dcService.getContentForSlot(slotName, data.contactId);
  }
}
