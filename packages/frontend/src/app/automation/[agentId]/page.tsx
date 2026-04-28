'use client';
import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';

const AGENT_INFO: Record<string, { name: string; icon: string; color: string }> = {
  'campaign-optimizer': { name: 'Campaign Optimizer', icon: 'O', color: 'blue' },
  'content-writer': { name: 'Content Writer', icon: 'W', color: 'emerald' },
  'segment-analyst': { name: 'Segment Analyst', icon: 'S', color: 'purple' },
  'analytics-interpreter': { name: 'Analytics Interpreter', icon: 'A', color: 'amber' },
  'email-personalizer': { name: 'Email Personalizer', icon: 'P', color: 'rose' },
  'automation-advisor': { name: 'Automation Advisor', icon: 'R', color: 'cyan' },
};

interface Message {
  id: string;
  role: 'user' | 'agent';
  content: string;
  timestamp: Date;
}

export default function AgentChatPage() {
  const params = useParams();
  const agentId = params.agentId as string;
  const agent = AGENT_INFO[agentId] ?? { name: agentId, icon: '?', color: 'gray' };
  const [messages, setMessages] = useState<Message[]>([
    { id: 'welcome', role: 'agent', content: `Hello! I'm the ${agent.name}. How can I help you with your marketing automation today?`, timestamp: new Date() },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const userMsg: Message = { id: crypto.randomUUID(), role: 'user', content: input, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    // Simulated agent response (will be wired to Mastra backend)
    setTimeout(() => {
      const responses: Record<string, string> = {
        'campaign-optimizer': "I've analyzed your campaign data. Here are my recommendations:
\n1. **Send Time Optimization**: Your best open rates are between 10-11am on weekdays\n2. **Subject Line A/B Test**: Try personalizing with first names - we've seen 23% higher open rates\n3. **Segment Performance**: The 'recent buyers' segment has 3x higher click-through rates than average\n4. **Drop-off Point**: 45% of contacts drop off after the second email in your drip sequence - consider adding a re-engagement email",
        'content-writer': "Here are 3 subject line variants for your campaign:\n\n1. **\"{{firstname}}, your exclusive offer awaits\"** - Personal + curiosity-driven\n2. **\"Don't miss out on this week's deals\"** - Urgency + FOMO\n3. **\"We've got something special for you\"** - Intrigue + warm\n\nWould you like me to generate email body copy for any of these?",
        'segment-analyst': "I've analyzed your contact data and found 3 potential new segments:\n\n1. **High-Value Inactives** - Contacts with >50 points but no activity in 30 days\n   - Estimated size: 1,240 contacts\n   - Opportunity: Re-engagement campaign\n\n2. **Product Page Browsers** - Visited product pages but never purchased\n   - Estimated size: 3,500 contacts\n   - Opportunity: Abandoned browse email\n\n3. **Multi-Channel Engagers** - Active on email AND social\n   - Estimated size: 890 contacts\n   - Opportunity: Cross-channel upsell",
        'analytics-interpreter': "Here's your campaign performance summary for this month:\n\n**Overall**: Sent 12,450 emails with a 24.3% open rate (↑3.2% vs last month) and 4.1% click rate (↑0.8%).\n\n**Top Campaign**: 'Summer Sale Launch' - 34.1% open rate, 7.2% click rate\n**Needs Improvement**: 'Weekly Newsletter' - 18.2% open rate, 2.1% click rate\n\n**Anomaly Detected**: A spike in unsubscribes on Tuesday afternoons - check your send timing.",
        'email-personalizer': "I've prepared personalized content blocks for your next campaign:\n\n**Subject Line Variants**:\n- Returning customers: \"{{firstname}}, welcome back! Here's what's new\"\n- New subscribers: \"Welcome to the family, {{firstname}}!\"\n- VIP segment: \"Exclusive preview for our valued members\"\n\n**Dynamic Content Suggestions**:\n- Product recommendations based on past purchases\n- Location-specific offers (weather-based or local events)\n- Abandoned cart recovery with specific items shown",
        'automation-advisor': "I've reviewed your current automation setup. Here's what I found:\n\n**Gaps Identified**:\n1. No welcome series for new contacts (missing first-impression automation)\n2. No re-engagement campaign for inactive contacts (90+ days)\n3. Lead scoring not connected to any campaign triggers\n\n**Recommendations**:\n1. Create a 3-email welcome series triggered on contact creation\n2. Set up a re-engagement campaign with 2 reminder emails + 1 final offer\n3. Connect point triggers to stage progression for lifecycle automation",
      };
      const reply = responses[agentId] ?? "Thanks for your question! I'm analyzing the data and will provide recommendations shortly.";
      const agentMsg: Message = { id: crypto.randomUUID(), role: 'agent', content: reply, timestamp: new Date() };
      setMessages(prev => [...prev, agentMsg]);
      setLoading(false);
    }, 1500);
  };

  const colorMap: Record<string, string> = {
    blue: 'border-blue-500 text-blue-400', emerald: 'border-emerald-500 text-emerald-400',
    purple: 'border-purple-500 text-purple-400', amber: 'border-amber-500 text-amber-400',
    rose: 'border-rose-500 text-rose-400', cyan: 'border-cyan-500 text-cyan-400',
    gray: 'border-gray-500 text-gray-400',
  };

  const agentColor = colorMap[agent.color] ?? colorMap['gray'];

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      {/* Chat */}
      <div className="flex-1 flex flex-col">
        {/* Agent header */}
        <div className="border-b bg-card px-6 py-4">
          <div className="flex items-center gap-3">
            <div className={`flex h-10 w-10 items-center justify-center rounded-full border-2 text-sm font-bold ${agentColor}`}>
              {agent.icon}
            </div>
            <div>
              <h2 className="font-semibold">{agent.name}</h2>
              <p className="text-xs text-muted-foreground">Ask me anything about marketing automation</p>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.map(msg => (
            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[70%] rounded-lg px-4 py-3 ${
                msg.role === 'user'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-card border'
              }`}>
                <div className="whitespace-pre-wrap text-sm">{msg.content}</div>
                <p className="mt-1 text-xs opacity-50">
                  {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="max-w-[70%] rounded-lg border bg-card px-4 py-3">
                <div className="flex gap-1">
                  <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground" style={{ animationDelay: '0ms' }}></span>
                  <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground" style={{ animationDelay: '150ms' }}></span>
                  <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground" style={{ animationDelay: '300ms' }}></span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="border-t bg-card p-4">
          <div className="flex gap-3">
            <input
              className="flex-1 rounded-md border border-input bg-background px-4 py-2 text-sm"
              placeholder={`Ask the ${agent.name} something...`}
              value={input} onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
              disabled={loading}
            />
            <button onClick={sendMessage} disabled={loading || !input.trim()}
              className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground disabled:opacity-50"
            >
              Send
            </button>
          </div>
        </div>
      </div>

      {/* Side panel */}
      <div className="hidden lg:block w-80 border-l bg-card p-4 overflow-y-auto">
        <h3 className="font-semibold mb-4">Suggested Questions</h3>
        <div className="space-y-2">
          {[
            'How can I improve my campaign performance?',
            'Generate email subject lines for a sale',
            'What new segments should I create?',
            'Summarize this month's performance',
            'Review my automation gaps',
            'Personalize content for VIP contacts',
          ].map(q => (
            <button key={q} onClick={() => { setInput(q); }}
              className="w-full text-left rounded-md border border-input px-3 py-2 text-xs text-muted-foreground hover:bg-muted transition-colors"
            >
              {q}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
