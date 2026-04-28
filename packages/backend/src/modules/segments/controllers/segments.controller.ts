import { Controller, Get, Post, Put, Delete, Param, Query, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { SegmentService } from '../services/segment.service';

@Controller('segments')
export class SegmentsController {
  constructor(private readonly segmentService: SegmentService) {}

  @Get()
  async findAll(@Query('page') page?: string, @Query('limit') limit?: string, @Query('search') search?: string) {
    return this.segmentService.findAll({
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 30,
      search,
    });
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.segmentService.findOne(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() data: any) {
    return this.segmentService.create(data);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() data: any) {
    return this.segmentService.update(id, data);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string) {
    await this.segmentService.remove(id);
  }

  @Get(':id/contacts')
  async getContacts(
    @Param('id') id: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.segmentService.getSegmentContacts(id, {
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 30,
    });
  }

  @Post(':id/contacts/:contactId')
  async addContact(@Param('id') id: string, @Param('contactId') contactId: string) {
    return this.segmentService.addContact(id, contactId);
  }

  @Delete(':id/contacts/:contactId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeContact(@Param('id') id: string, @Param('contactId') contactId: string) {
    await this.segmentService.removeContact(id, contactId);
  }

  @Post(':id/rebuild')
  async rebuild(@Param('id') id: string) {
    return this.segmentService.rebuildMembership(id);
  }

  @Post('preview')
  async previewFilters(@Body() data: { filters: any[] }) {
    return this.segmentService.estimateMembership(data.filters);
  }
}
