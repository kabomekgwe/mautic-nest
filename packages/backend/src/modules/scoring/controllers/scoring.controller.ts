import { Controller, Get, Post, Put, Delete, Param, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ScoringService } from '../services/scoring.service';

@Controller('scoring')
export class ScoringController {
  constructor(private readonly scoringService: ScoringService) {}

  @Get('points/actions')
  async getPointActions() { return this.scoringService.getPointActions(); }

  @Post('points/actions')
  @HttpCode(HttpStatus.CREATED)
  async createPointAction(@Body() data: any) { return this.scoringService.createPointAction(data); }

  @Put('points/actions/:id')
  async updatePointAction(@Param('id') id: string, @Body() data: any) { return this.scoringService.updatePointAction(id, data); }

  @Delete('points/actions/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async removePointAction(@Param('id') id: string) { await this.scoringService.removePointAction(id); }

  @Get('points/triggers')
  async getPointTriggers() { return this.scoringService.getPointTriggers(); }

  @Post('points/triggers')
  @HttpCode(HttpStatus.CREATED)
  async createPointTrigger(@Body() data: any) { return this.scoringService.createPointTrigger(data); }

  @Put('points/triggers/:id')
  async updatePointTrigger(@Param('id') id: string, @Body() data: any) { return this.scoringService.updatePointTrigger(id, data); }

  @Delete('points/triggers/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async removePointTrigger(@Param('id') id: string) { await this.scoringService.removePointTrigger(id); }

  @Get('stages')
  async getStages() { return this.scoringService.getStages(); }

  @Post('stages')
  @HttpCode(HttpStatus.CREATED)
  async createStage(@Body() data: any) { return this.scoringService.createStage(data); }

  @Put('stages/:id')
  async updateStage(@Param('id') id: string, @Body() data: any) { return this.scoringService.updateStage(id, data); }

  @Delete('stages/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeStage(@Param('id') id: string) { await this.scoringService.removeStage(id); }
}
