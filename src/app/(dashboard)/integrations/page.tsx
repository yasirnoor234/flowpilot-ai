import React from 'react';
import { requireWorkspaceAuth } from '@/lib/auth/workspace-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Bot, Mail, MessageSquare, Webhook, ShieldCheck } from 'lucide-react';

export default async function IntegrationsPage() {
  const context = await requireWorkspaceAuth();
  const isDemo = context.workspace.is_demo_mode;

  const integrations: Array<{
    id: string;
    name: string;
    category: string;
    description: string;
    icon: React.ComponentType<{ className?: string }>;
    status: string;
    badgeVariant: 'secondary' | 'success' | 'default';
    demoDetails: string;
  }> = [
    {
      id: 'openai',
      name: 'OpenAI GPT-4o',
      category: 'AI Qualification',
      description: 'Parses incoming lead requests, evaluates budget and timeline, and produces structured qualification scores.',
      icon: Bot,
      status: isDemo ? 'Demo Mode' : 'Connected',
      badgeVariant: isDemo ? 'secondary' : 'success',
      demoDetails: 'Returns deterministic structured qualification mock data in development.',
    },
    {
      id: 'resend',
      name: 'Resend',
      category: 'Transactional Email',
      description: 'Sends dynamic, personalized confirmation and follow-up emails directly to leads.',
      icon: Mail,
      status: isDemo ? 'Demo Mode' : 'Connected',
      badgeVariant: isDemo ? 'secondary' : 'success',
      demoDetails: 'Logs dispatched emails to workflow run execution logs without sending live emails.',
    },
    {
      id: 'slack',
      name: 'Slack Incoming Webhook',
      category: 'Team Alerts',
      description: 'Posts real-time alert cards with lead tier badges directly into your designated Slack channels.',
      icon: MessageSquare,
      status: isDemo ? 'Demo Mode' : 'Connected',
      badgeVariant: isDemo ? 'secondary' : 'success',
      demoDetails: 'Simulates Slack payload payloads in execution step logs.',
    },
    {
      id: 'webhook',
      name: 'Inbound Webhook Endpoint',
      category: 'Trigger Source',
      description: 'Accepts HTTP POST lead submissions from landing pages, Typeform, Webflow, or custom forms.',
      icon: Webhook,
      status: 'Ready',
      badgeVariant: 'success',
      demoDetails: 'Unique workspace URL automatically generated upon workflow publishing.',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Integration Adapters</h2>
          <p className="text-xs text-zinc-400">
            Configure live third-party credentials or utilize zero-dependency demo adapters for {context.workspace.name}.
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-indigo-500/20 bg-indigo-950/20 p-4 text-xs text-indigo-300 flex items-start gap-3">
        <ShieldCheck className="h-5 w-5 text-indigo-400 shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-white">Credential Security Rule:</span> All API keys and secrets are encrypted and kept exclusively on the server. They are never sent to or displayed in client browsers.
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {integrations.map((item) => {
          const Icon = item.icon;
          return (
            <Card key={item.id} className="border-zinc-800 bg-zinc-900/50 flex flex-col justify-between">
              <div>
                <CardHeader className="flex flex-row items-start justify-between pb-2">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-zinc-800 border border-zinc-700/80 flex items-center justify-center text-zinc-100 shadow-sm">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle className="text-base text-white">{item.name}</CardTitle>
                      <CardDescription className="text-xs">{item.category}</CardDescription>
                    </div>
                  </div>
                  <Badge variant={item.badgeVariant}>{item.status}</Badge>
                </CardHeader>
                <CardContent className="pt-2 space-y-3">
                  <p className="text-xs text-zinc-400 leading-relaxed">{item.description}</p>
                  <div className="rounded-lg bg-zinc-950/50 border border-zinc-800/80 p-2.5 text-[11px] text-zinc-400">
                    <span className="text-zinc-300 font-medium">Adapter Mode: </span>
                    {item.demoDetails}
                  </div>
                </CardContent>
              </div>

              <div className="p-6 pt-0 flex items-center justify-end border-t border-zinc-800/60 mt-4">
                <Button variant="secondary" size="sm">
                  Configure Adapter
                </Button>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
