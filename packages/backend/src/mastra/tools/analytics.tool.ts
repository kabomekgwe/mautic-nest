import { z } from 'zod';

export interface ToolConfig {
  id: string;
  description: string;
  inputSchema: z.ZodObject<any>;
  execute: (args: { context: Record<string, unknown> }) => Promise<Record<string, unknown>>;
}

export const analyticsLookupTool: ToolConfig = {
  id: 'analytics_lookup',
  description: 'Query aggregated analytics data',
  inputSchema: z.object({
    entity: z.enum(['campaigns', 'emails', 'forms', 'contacts', 'segments']),
    metric: z.string(),
    dateRange: z.object({ start: z.string(), end: z.string() }),
  }),
  execute: async ({ context }) => {
    return { data: [] };
  },
};
