import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ScheduleModule } from '@nestjs/schedule';

import { CoreModule } from './modules/core/core.module';
import { AuthModule } from './modules/auth/auth.module';
import { DatabaseModule } from './database/database.module';

import { ContactsModule } from './modules/contacts/contacts.module';
import { SegmentsModule } from './modules/segments/segments.module';
import { CampaignsModule } from './modules/campaigns/campaigns.module';
import { EmailModule } from './modules/email-marketing/email.module';
import { FormsModule } from './modules/forms/forms.module';
import { PagesModule } from './modules/pages/pages.module';
import { AssetsModule } from './modules/assets/assets.module';
import { ScoringModule } from './modules/scoring/scoring.module';
import { DynamicContentModule } from './modules/dynamic-content/dynamic-content.module';
import { WebhooksModule } from './modules/webhooks/webhooks.module';
import { ChannelsModule } from './modules/channels/channels.module';
import { ReportingModule } from './modules/reporting/reporting.module';
import { TrackingModule } from './modules/tracking/tracking.module';
import { IntegrationsModule } from './modules/integrations/integrations.module';
import { PluginsModule } from './modules/plugins/plugins.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env.local' }),
    EventEmitterModule.forRoot({ wildcard: false, delimiter: '.', maxListeners: 20 }),
    ScheduleModule.forRoot(),
    CoreModule,
    DatabaseModule,
    AuthModule,
    ContactsModule,
    SegmentsModule,
    CampaignsModule,
    EmailModule,
    FormsModule,
    PagesModule,
    AssetsModule,
    ScoringModule,
    DynamicContentModule,
    WebhooksModule,
    ChannelsModule,
    ReportingModule,
    TrackingModule,
    IntegrationsModule,
    PluginsModule,
  ],
})
export class AppModule {}
