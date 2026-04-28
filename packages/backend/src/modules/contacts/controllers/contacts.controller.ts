import {
  Controller, Get, Post, Put, Delete, Param, Query, Body, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ContactService } from '../services/contact.service';

@Controller('contacts')
export class ContactsController {
  constructor(private readonly contactService: ContactService) {}

  @Get()
  async findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
  ) {
    return this.contactService.findAll({
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 30,
      search,
    });
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.contactService.findOne(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() data: Record<string, unknown>) {
    return this.contactService.create(data);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() data: Record<string, unknown>) {
    return this.contactService.update(id, data);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string) {
    await this.contactService.remove(id);
  }

  @Post(':id/merge/:mergeIntoId')
  async merge(@Param('id') id: string, @Param('mergeIntoId') mergeIntoId: string) {
    return this.contactService.merge(id, mergeIntoId);
  }

  @Get(':id/timeline')
  async timeline(@Param('id') id: string) {
    return this.contactService.getTimeline(id);
  }
}
