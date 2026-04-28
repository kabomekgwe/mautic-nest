import { Controller, Get, Post, Param, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ChannelsService } from '../services/channels.service';

@Controller('channels')
export class ChannelsController {
  constructor(private readonly channelsService: ChannelsService) {}

  @Post('sms/send')
  @HttpCode(HttpStatus.ACCEPTED)
  async sendSms(@Body() data: { contactId: string; message: string }) {
    return this.channelsService.sendSms(data.contactId, data.message);
  }

  @Post('notification/send')
  @HttpCode(HttpStatus.ACCEPTED)
  async sendNotification(@Body() data: { contactId: string; message: string; url?: string }) {
    return this.channelsService.sendNotification(data.contactId, data.message, data.url);
  }

  @Get('providers')
  async getProviders() {
    return this.channelsService.getProviders();
  }
}
