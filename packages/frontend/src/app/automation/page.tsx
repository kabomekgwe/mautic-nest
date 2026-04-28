'use client';
import { useState } from 'react';
import Link from 'next/link';

const AGENTS = [
  { id: 'campaign-optimizer', name: 'Campaign Optimizer', icon: 'O', model: 'claude-opus-4-6', color: 'blue', desc: 'Analyzes campaign performance and suggests improvements' },
  { id: 'content-writer', name: 'Content Writer', icon: 'W', model: 'claude-opus-4-6', color: 'emerald', desc: 'Generates email copy, subject lines, and landing page content' },
  { id: 'segment-analyst', name: 'Segment Analyst', icon: 'S', model: 'qwen3-30b', color: 'purple', desc: 'Discovers patterns and suggests new segment definitions' },
  { id: 'analytics-interpreter', name: 'Analytics Interpreter', icon: 'A', model: 'qwen3-30b', color: 'amber', desc: 'Explains campaign performance in plain English' },
  { id: 'email-personalizer', name: 'Email Personalizer', icon: 'P', model: 'claude-opus-4-6', color: 'rose', desc: 'Generates personalized content blocks per contact' },
  { id: 'automation-advisor', name: 'Automation Advisor', icon: 'R', model: 'qwen3-30b', color: 'cyan', desc: 'Reviews automation setups and identifies gaps' },
];

export default function AutomationPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">AI Agents</h1>
      </div>
      <p className="text-muted-foreground">Intelligent marketing agents to optimize campaigns, generate content, and discover insights.</p>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {AGENTS.map(agent => {
          const colorMap: Record<string, string> = {
            blue: 'border-blue-500/30 bg-blue-500/5',
            emerald: 'border-emerald-500/30 bg-emerald-500/5',
            purple: 'border-purple-500/30 bg-purple-500/5',
            amber: 'border-amber-500/30 bg-amber-500/5',
            rose: 'border-rose-500/30 bg-rose-500/5',
            cyan: 'border-cyan-500/30 bg-cyan-500/5',
          };
          const iconColorMap: Record<string, string> = {
            blue: 'bg-blue-500/20 text-blue-400',
            emerald: 'bg-emerald-500/20 text-emerald-400',
            purple: 'bg-purple-500/20 text-purple-400',
            amber: 'bg-amber-500/20 text-amber-400',
            rose: 'bg-rose-500/20 text-rose-400',
            cyan: 'bg-cyan-500/20 text-cyan-400',
          };
          return (
            <Link key={agent.id} href={`/automation/${agent.id}`}
              className={`rounded-lg border p-6 hover:bg-muted/50 transition-colors ${colorMap[agent.color] || 'border-muted'}`}
            >
              <div className="flex items-center gap-4">
                <div className={`flex h-12 w-12 items-center justify-center rounded-full text-lg font-bold ${iconColorMap[agent.color]}`}>
                  {agent.icon}
                </div>
                <div>
                  <h3 className="font-semibold">{agent.name}</h3>
                  <p className="text-xs text-muted-foreground">{agent.model}</p>
                </div>
              </div>
              <p className="mt-3 text-sm text-muted-foreground">{agent.desc}</p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
