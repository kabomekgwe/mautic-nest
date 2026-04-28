import { z } from 'zod';

export interface AgentConfig {
  name: string;
  instructions: string;
}

export const analyticsInterpreterAgent: AgentConfig = {
  name: 'analytics-interpreter',
  instructions: `You read report data and generate natural language summaries. Explain campaign performance, identify trends, and detect anomalies.`,
};
