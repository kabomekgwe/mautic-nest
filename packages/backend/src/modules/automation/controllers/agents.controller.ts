import { Controller, Post, Body, Param, HttpCode, HttpStatus } from '@nestjs/common';
import { AgentsService } from '../services/agents.service';

@Controller('automation/agents')
export class AgentsController {
  constructor(private readonly agentsService: AgentsService) {}

  @Post(':agentId/chat')
  @HttpCode(HttpStatus.OK)
  async chat(@Param('agentId') agentId: string, @Body() data: { message: string; context?: any }) {
    return this.agentsService.chat(agentId, data.message, data.context);
  }
}
