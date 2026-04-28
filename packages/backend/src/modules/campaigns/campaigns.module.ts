import { Module } from '@nestjs/common';
import { CampaignsController } from './controllers/campaigns.controller';
import { CampaignService } from './services/campaign.service';

@Module({
  controllers: [CampaignsController],
  providers: [CampaignService],
  exports: [CampaignService],
})
export class CampaignsModule {}
