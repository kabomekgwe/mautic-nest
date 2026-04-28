import { z } from 'zod';

export interface AgentConfig {
  name: string;
  instructions: string;
}

export const contentWriterAgent: AgentConfig = {
  name: 'content-writer',
  instructions: `You generate marketing content including email subject lines, body copy, landing page content, form copy, and CTAs. Adapt tone to brand voice guides.`,
};
