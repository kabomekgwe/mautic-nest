import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';

export interface AgentResponse {
  agentId: string;
  response: string;
  suggestions?: any[];
}

@Injectable()
export class AgentsService {
  private readonly logger = new Logger(AgentsService.name);
  constructor(private readonly eventEmitter: EventEmitter2) {}

  async chat(agentId: string, message: string, context?: any): Promise<AgentResponse> {
    this.logger.log(`Agent ${agentId} received: ${message.substring(0, 80)}...`);
    this.eventEmitter.emit('agent.chat', { agentId, message, context });

    const agentResponses: Record<string, (msg: string) => string> = {
      'campaign-optimizer': (msg: string) => {
        if (msg.toLowerCase().includes('send time')) {
          return 'Based on your campaign data, optimal send times are:' + '\n' +
            '- Weekdays: 10:00-11:00 AM (34% higher open rate)' + '\n' +
            '- Weekends: 9:00-10:00 AM (28% higher click rate)' + '\n' +
            '- Avoid: Monday mornings (lowest engagement)';
        }
        if (msg.toLowerCase().includes('ab test') || msg.toLowerCase().includes('variant')) {
          return 'Recommended A/B test setup:' + '\n' +
            '1. Test subject lines (personalized vs generic)' + '\n' +
            '2. Split: 20% test, 80% control' + '\n' +
            '3. Duration: 4 hours or until 100 opens' + '\n' +
            '4. Winner sends to remaining 80%';
        }
        return 'To optimize your campaigns, I recommend:' + '\n' +
          '1. Segment analysis: Check which segments perform best' + '\n' +
          '2. Send time: Review timing data' + '\n' +
          '3. Content audit: A/B test subject lines' + '\n' +
          '4. Drop-off analysis: Find where contacts disengage' + '\n\n' +
          'Which area would you like me to analyze?';
      },
      'content-writer': (msg: string) => {
        return 'Here are content options for your campaign:' + '\n\n' +
          'Subject Line Options:' + '\n' +
          '- "{{firstname}}, check out what is new"' + '\n' +
          '- "Your weekly update is here"' + '\n' +
          '- "Don\'t miss these exclusive deals"' + '\n\n' +
          'Would you like me to write the full email body for any of these?';
      },
      'segment-analyst': (msg: string) => {
        return 'Segment discovery results:' + '\n\n' +
          'Potential New Segments:' + '\n' +
          '1. Recent Engagers: Opened email in last 7 days - ~2,100 contacts' + '\n' +
          '2. High Scorers: Points > 50 but no purchase - ~890 contacts' + '\n' +
          '3. Inactive Premium: No activity in 60 days, points > 30 - ~450 contacts' + '\n\n' +
          'Your "Newsletter Subscribers" segment has 40% stale contacts.' + '\n' +
          'Consider splitting "Recent Buyers" by purchase value.';
      },
      'analytics-interpreter': (msg: string) => {
        return 'Performance Summary:' + '\n\n' +
          'Campaigns:' + '\n' +
          '- 12 campaigns active this month' + '\n' +
          '- Average open rate: 24.3% (+3.2% vs last month)' + '\n' +
          '- Average click rate: 4.1% (+0.8%)' + '\n' +
          '- Unsubscribe rate: 0.4% (within normal range)' + '\n\n' +
          'Top Performer: "Summer Sale" campaign' + '\n' +
          '- 34.1% open rate' + '\n' +
          '- 7.2% click-through rate';
      },
      'email-personalizer': (msg: string) => {
        return 'Personalization suggestions:' + '\n\n' +
          '1. Dynamic Subject Lines:' + '\n' +
          '- {{firstname}}, here is your personalized offer' + '\n' +
          '- {{firstname}}, we miss you!' + '\n\n' +
          '2. Content Blocks:' + '\n' +
          '- Product recommendations based on past purchases' + '\n' +
          '- Location-based offers' + '\n' +
          '- Birthday/anniversary messaging' + '\n\n' +
          '3. Send Time: Optimize per contact timezone';
      },
      'automation-advisor': (msg: string) => {
        return 'Automation Audit Results:' + '\n\n' +
          'Gaps Found:' + '\n' +
          '1. No welcome series configured' + '\n' +
          '2. No re-engagement flow for inactive contacts' + '\n' +
          '3. Lead scoring not connected to campaigns' + '\n' +
          '4. No post-purchase follow-up sequence' + '\n\n' +
          'Priority Recommendations:' + '\n' +
          '1. Create 3-email welcome series (immediate)' + '\n' +
          '2. Set up re-engagement at 60 days inactivity' + '\n' +
          '3. Connect point triggers to stage progression';
      },
    };

    const responder = agentResponses[agentId];
    const response = responder ? responder(message) : `I am analyzing your request and will provide insights shortly.`;
    return { agentId, response };
  }
}
