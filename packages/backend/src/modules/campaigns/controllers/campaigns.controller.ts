import { Controller, Get, Post, Put, Delete, Param, Query, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { CampaignService } from '../services/campaign.service';

@Controller('campaigns')
export class CampaignsController {
  constructor(private readonly campaignService: CampaignService) {}

  @Get()
  async findAll(@Query('page') page?: string, @Query('limit') limit?: string, @Query('search') search?: string) {
    return this.campaignService.findAll({
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 30,
      search,
    });
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.campaignService.findOne(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() data: any) {
    return this.campaignService.create(data);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() data: any) {
    return this.campaignService.update(id, data);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string) {
    await this.campaignService.remove(id);
  }

  @Get(':id/contacts')
  async getContacts(@Param('id') id: string, @Query('page') page?: string, @Query('limit') limit?: string) {
    return this.campaignService.getCampaignContacts(id, {
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 30,
    });
  }

  @Post(':id/contacts/:contactId')
  async addContact(@Param('id') id: string, @Param('contactId') contactId: string) {
    return this.campaignService.addContact(id, contactId);
  }

  @Delete(':id/contacts/:contactId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeContact(@Param('id') id: string, @Param('contactId') contactId: string) {
    await this.campaignService.removeContact(id, contactId);
  }

  @Post(':id/events')
  @HttpCode(HttpStatus.CREATED)
  async addEvent(@Param('id') id: string, @Body() data: any) {
    return this.campaignService.addEvent(id, data);
  }

  @Put(':id/events/:eventId')
  async updateEvent(@Param('id') id: string, @Param('eventId') eventId: string, @Body() data: any) {
    return this.campaignService.updateEvent(id, eventId, data);
  }

  @Delete(':id/events/:eventId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeEvent(@Param('id') id: string, @Param('eventId') eventId: string) {
    await this.campaignService.removeEvent(id, eventId);
  }

  @Post(':id/activate')
  async activate(@Param('id') id: string) {
    return this.campaignService.activate(id);
  }

  @Post(':id/deactivate')
  async deactivate(@Param('id') id: string) {
    return this.campaignService.deactivate(id);
  }
}
