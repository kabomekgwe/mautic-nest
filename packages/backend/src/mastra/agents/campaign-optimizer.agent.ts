import { z } from 'zod';

export interface AgentConfig {
  name: string;
  instructions: string;
}

export const campaignOptimizerAgent: AgentConfig = {
  name: 'campaign-optimizer',
  instructions: `You analyze campaign performance data and suggest optimal send times, audience segments, and message variants. Identify bottlenecks and recommend A/B tests.`,
};
