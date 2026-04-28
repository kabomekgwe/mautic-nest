import { Controller, Post, Get, Req, Res, Param, Body } from '@nestjs/common';
import { TrackingService } from '../services/tracking.service';
import { Response, Request } from 'express';

@Controller('tracking')
export class TrackingController {
  constructor(private readonly trackingService: TrackingService) {}

  /** Contact tracking pixel - 1x1 transparent GIF, identifies contacts via unique URL */
  @Get('contact/:trackingId')
  async trackContact(@Param('trackingId') trackingId: string, @Req() req: Request, @Res() res: Response) {
    await this.trackingService.recordPageVisit(trackingId, {
      url: req.headers.referer ?? '/',
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });
    const pixel = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64');
    res.set('Content-Type', 'image/gif').send(pixel);
  }

  /** Manual page hit recording for JS SDK */
  @Post('hit')
  async recordHit(@Req() req: Request, @Body() body: { url: string; trackingId?: string; title?: string; referrer?: string }) {
    return this.trackingService.recordPageVisit(null, {
      url: body.url,
      trackingId: body.trackingId,
      title: body.title,
      referrer: body.referrer,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });
  }
}
