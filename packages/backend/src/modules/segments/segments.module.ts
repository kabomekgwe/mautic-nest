import { Module } from '@nestjs/common';
import { SegmentsController } from './controllers/segments.controller';
import { SegmentService } from './services/segment.service';

@Module({
  controllers: [SegmentsController],
  providers: [SegmentService],
  exports: [SegmentService],
})
export class SegmentsModule {}
