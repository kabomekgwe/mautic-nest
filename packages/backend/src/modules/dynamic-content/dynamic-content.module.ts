import { Module } from '@nestjs/common';
import { DynamicContentController } from './controllers/dynamic-content.controller';
import { DynamicContentService } from './services/dynamic-content.service';

@Module({ controllers: [DynamicContentController], providers: [DynamicContentService], exports: [DynamicContentService] })
export class DynamicContentModule {}
