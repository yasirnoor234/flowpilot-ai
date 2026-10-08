import React from 'react';
import { requireWorkspaceAuth } from '@/lib/auth/workspace-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  GitFork,
  Users,
  Activity,
  Bot,
  Sparkles,
} from 'lucide-react';
import Link from 'next/link';

export default async function OverviewPage() {
  const context = await requireWorkspaceAuth();

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-indigo-500/20 bg-gradient-to-r from-indigo-950/40 via-purple-950/20 to-zinc-900/40 p-6 backdrop-blur-xl">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 text-xs font-medium mb-1">
              <Sparkles className="h-3 w-3" />
              <span>FlowPilot AI Platform Active</span>
            </div>
            <h2 className="text-2xl font-bold text-white tracking-tight">
              Welcome back, {context.user.fullName || context.user.email.split('@')[0]}
            </h2>
            <p className="text-xs text-zinc-400 max-w-2xl">
              Workspace: <span className="text-zinc-200 font-semibold">{context.workspace.name}</span>.
              Ready to automate lead qualification, CRM persistence, and multi-step follow-ups.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Link href="/workflows">
              <Button size="sm">
                <GitFork className="mr-1.5 h-3.5 w-3.5" />
                Build New Workflow
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-zinc-800 bg-zinc-900/50">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-400">Total Leads</span>
            <div className="h-7 w-7 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-white">0</div>
            <div className="text-[11px] text-zinc-500 mt-1 flex items-center gap-1">
              <span>Ready for webhook ingest</span>
            </div>
          </div>
        </Card>

        <Card className="border-zinc-800 bg-zinc-900/50">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-400">AI Qualified</span>
            <div className="h-7 w-7 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <Bot className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-white">0</div>
            <div className="text-[11px] text-zinc-500 mt-1">
              <span>OpenAI structured scoring</span>
            </div>
          </div>
        </Card>

        <Card className="border-zinc-800 bg-zinc-900/50">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-400">Active Workflows</span>
            <div className="h-7 w-7 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center">
              <GitFork className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-white">0</div>
            <div className="text-[11px] text-zinc-500 mt-1">
              <span>Published DAG flows</span>
            </div>
          </div>
        </Card>

        <Card className="border-zinc-800 bg-zinc-900/50">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-400">Execution Runs</span>
            <div className="h-7 w-7 rounded-lg bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
              <Activity className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-white">0</div>
            <div className="text-[11px] text-zinc-500 mt-1">
              <span>Durable Inngest runs</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Target MVP Pipeline Blueprint */}
      <Card className="border-zinc-800 bg-zinc-900/40">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div>
            <CardTitle className="text-base font-semibold text-white flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-indigo-400" />
              <span>Target MVP Pipeline Blueprint</span>
            </CardTitle>
            <CardDescription className="text-xs mt-1">
              The primary autonomous business automation flow supported out-of-the-box.
            </CardDescription>
          </div>
          <Badge variant="default" className="text-[10px]">
            Primary MVP Flow
          </Badge>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-6 gap-3 pt-2">
            <div className="p-3.5 rounded-xl border border-zinc-800 bg-zinc-950/60 flex flex-col justify-between">
              <div className="flex items-center gap-2 text-indigo-400 text-xs font-semibold">
                <span className="h-5 w-5 rounded-md bg-indigo-500/15 flex items-center justify-center text-[10px]">1</span>
                <span>Lead Ingest</span>
              </div>
              <p className="text-[11px] text-zinc-400 mt-2">Webhook or Manual test payload</p>
            </div>

            <div className="p-3.5 rounded-xl border border-zinc-800 bg-zinc-950/60 flex flex-col justify-between">
              <div className="flex items-center gap-2 text-purple-400 text-xs font-semibold">
                <span className="h-5 w-5 rounded-md bg-purple-500/15 flex items-center justify-center text-[10px]">2</span>
                <span>AI Qualify</span>
              </div>
              <p className="text-[11px] text-zinc-400 mt-2">OpenAI GPT scores budget & intent</p>
            </div>

            <div className="p-3.5 rounded-xl border border-zinc-800 bg-zinc-950/60 flex flex-col justify-between">
              <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold">
                <span className="h-5 w-5 rounded-md bg-emerald-500/15 flex items-center justify-center text-[10px]">3</span>
                <span>CRM Sync</span>
              </div>
              <p className="text-[11px] text-zinc-400 mt-2">Create / update lead in built-in CRM</p>
            </div>

            <div className="p-3.5 rounded-xl border border-zinc-800 bg-zinc-950/60 flex flex-col justify-between">
              <div className="flex items-center gap-2 text-amber-400 text-xs font-semibold">
                <span className="h-5 w-5 rounded-md bg-amber-500/15 flex items-center justify-center text-[10px]">4</span>
                <span>Auto Reply</span>
              </div>
              <p className="text-[11px] text-zinc-400 mt-2">Resend personalized confirmation</p>
            </div>

            <div className="p-3.5 rounded-xl border border-zinc-800 bg-zinc-950/60 flex flex-col justify-between">
              <div className="flex items-center gap-2 text-sky-400 text-xs font-semibold">
                <span className="h-5 w-5 rounded-md bg-sky-500/15 flex items-center justify-center text-[10px]">5</span>
                <span>Slack Alert</span>
              </div>
              <p className="text-[11px] text-zinc-400 mt-2">Instant team webhook channel alert</p>
            </div>

            <div className="p-3.5 rounded-xl border border-zinc-800 bg-zinc-950/60 flex flex-col justify-between">
              <div className="flex items-center gap-2 text-rose-400 text-xs font-semibold">
                <span className="h-5 w-5 rounded-md bg-rose-500/15 flex items-center justify-center text-[10px]">6</span>
                <span>Follow-up</span>
              </div>
              <p className="text-[11px] text-zinc-400 mt-2">Durable Inngest 48h delay timer</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
