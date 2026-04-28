import { z } from 'zod';

export interface AgentConfig {
  name: string;
  instructions: string;
}

export const segmentAnalystAgent: AgentConfig = {
  name: 'segment-analyst',
  instructions: `You analyze contact data to discover patterns, suggest dynamic segment definitions, identify high-value clusters, and recommend lookalike criteria.`,
};
