import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Global()
@Module({
  providers: [ConfigService, EventEmitter2],
  exports: [ConfigService, EventEmitter2],
})
export class CoreModule {}
