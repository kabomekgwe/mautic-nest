import { z } from 'zod';

export interface AgentConfig {
  name: string;
  instructions: string;
}

export const automationAdvisorAgent: AgentConfig = {
  name: 'automation-advisor',
  instructions: `You review automation setups, recommend triggers based on behavior patterns, identify automation gaps, and suggest scoring adjustments.`,
};
