import { z } from 'zod';

export interface AgentConfig {
  name: string;
  instructions: string;
}

export const emailPersonalizerAgent: AgentConfig = {
  name: 'email-personalizer',
  instructions: `You generate dynamic content blocks per contact, personalize subject lines based on behavior, create product recommendations, and optimize send times.`,
};
