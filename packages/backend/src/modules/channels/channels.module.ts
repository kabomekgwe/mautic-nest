import { Module } from '@nestjs/common';
import { ChannelsController } from './controllers/channels.controller';
import { ChannelsService } from './services/channels.service';

@Module({ controllers: [ChannelsController], providers: [ChannelsService], exports: [ChannelsService] })
export class ChannelsModule {}
