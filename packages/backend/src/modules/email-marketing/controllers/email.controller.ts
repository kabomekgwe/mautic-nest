import { Controller, Get, Post, Put, Delete, Param, Query, Body, HttpCode, HttpStatus, Res, Req } from '@nestjs/common';
import { EmailService } from '../services/email.service';
import { Response, Request } from 'express';

@Controller('emails')
export class EmailController {
  constructor(private readonly emailService: EmailService) {}

  @Get()
  async findAll(@Query('page') page?: string, @Query('limit') limit?: string) {
    return this.emailService.findAll({ page: page ? parseInt(page,10) : 1, limit: limit ? parseInt(limit,10) : 30 });
  }

  @Get(':id')
  async findOne(@Param('id') id: string) { return this.emailService.findOne(id); }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() data: any) { return this.emailService.create(data); }

  @Put(':id')
  async update(@Param('id') id: string, @Body() data: any) { return this.emailService.update(id, data); }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string) { await this.emailService.remove(id); }

  @Post(':id/send')
  async send(@Param('id') id: string, @Body() data: { contactIds?: string[]; segmentId?: string }) {
    return this.emailService.send(id, data.contactIds, data.segmentId);
  }

  /** Open tracking pixel - 1x1 transparent GIF */
  @Get('track/open/:trackingId')
  async trackOpen(@Param('trackingId') trackingId: string, @Req() req: Request, @Res() res: Response) {
    await this.emailService.recordOpen(trackingId, {
      ipAddress: req.ip, userAgent: req.headers['user-agent'],
    });
    // 1x1 transparent GIF
    const pixel = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64');
    res.set('Content-Type', 'image/gif').send(pixel);
  }

  /** Click tracking redirect */
  @Get('track/click/:trackingId')
  async trackClick(@Param('trackingId') trackingId: string, @Query('url') url: string, @Req() req: Request, @Res() res: Response) {
    await this.emailService.recordClick(trackingId, {
      url, ipAddress: req.ip, userAgent: req.headers['user-agent'],
    });
    res.redirect(302, url || '/');
  }
}
