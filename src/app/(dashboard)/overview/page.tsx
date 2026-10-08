import React from 'react';
import { requireWorkspaceAuth } from '@/lib/auth/workspace-context';
import { createClient } from '@/lib/supabase/server';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  GitFork,
  Users,
  Activity,
  Bot,
  Sparkles,
  Flame,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ArrowUpRight,
  Send,
  Zap,
  ShieldCheck,
  TrendingUp,
  MessageSquare,
  HelpCircle,
} from 'lucide-react';
import Link from 'next/link';
import { WORKFLOW_TEMPLATES } from '@/lib/workflow/templates';

export default async function OverviewPage() {
  const context = await requireWorkspaceAuth();
  const supabase = await createClient();

  // 1. Query Real Database Metrics
  const [
    { count: totalRunsCount },
    { count: succeededRunsCount },
    { count: failedRunsCount },
    { count: waitingRunsCount },
    { count: totalLeadsCount },
    { count: qualifiedLeadsCount },
    { count: hotLeadsCount },
    { count: activeWorkflowsCount },
    { data: recentFailedRuns },
    { data: integrationConnections },
  ] = await Promise.all([
    supabase.from('workflow_runs').select('*', { count: 'exact', head: true }).eq('workspace_id', context.workspace.id),
    supabase.from('workflow_runs').select('*', { count: 'exact', head: true }).eq('workspace_id', context.workspace.id).eq('status', 'succeeded'),
    supabase.from('workflow_runs').select('*', { count: 'exact', head: true }).eq('workspace_id', context.workspace.id).eq('status', 'failed'),
    supabase.from('workflow_runs').select('*', { count: 'exact', head: true }).eq('workspace_id', context.workspace.id).in('status', ['waiting', 'running', 'queued']),
    supabase.from('leads').select('*', { count: 'exact', head: true }).eq('workspace_id', context.workspace.id),
    supabase.from('leads').select('*', { count: 'exact', head: true }).eq('workspace_id', context.workspace.id).in('qualification_status', ['hot', 'warm', 'qualified']),
    supabase.from('leads').select('*', { count: 'exact', head: true }).eq('workspace_id', context.workspace.id).eq('qualification_status', 'hot'),
    supabase.from('workflows').select('*', { count: 'exact', head: true }).eq('workspace_id', context.workspace.id).eq('status', 'active'),
    supabase.from('workflow_runs').select('id, workflow_id, status, error_message, created_at, workflows(name)').eq('workspace_id', context.workspace.id).eq('status', 'failed').order('created_at', { ascending: false }).limit(3),
    supabase.from('integration_connections').select('provider, status, name, last_error').eq('workspace_id', context.workspace.id),
  ]);

  const totalRuns = totalRunsCount || 0;
  const succeededRuns = succeededRunsCount || 0;
  const failedRuns = failedRunsCount || 0;
  const waitingRuns = waitingRunsCount || 0;
  const totalLeads = totalLeadsCount || 0;
  const qualifiedLeads = qualifiedLeadsCount || 0;
  const hotLeads = hotLeadsCount || 0;
  const activeWorkflows = activeWorkflowsCount || 0;

  // Formula: 12 minutes saved per successful lead qualification, CRM entry, email response, and alert cycle
  const estimatedHoursSaved = ((succeededRuns * 12) / 60).toFixed(1);

  const connectionsList = (integrationConnections || []) as unknown as Array<{
    provider: string;
    status: string;
    name: string;
    last_error: string | null;
  }>;

  const integrationErrors = connectionsList.filter((c) => c.status === 'error' || c.last_error);

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-purple-500/20 bg-gradient-to-r from-purple-950/40 via-indigo-950/30 to-zinc-950 p-6 backdrop-blur-xl shadow-2xl">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-purple-500/15 border border-purple-500/30 text-purple-300 text-xs font-semibold mb-1">
              <Sparkles className="h-3 w-3" />
              <span>FlowPilot AI Platform • Active Monitoring</span>
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Workspace Overview: {context.workspace.name}
            </h1>
            <p className="text-xs text-zinc-400 max-w-2xl leading-relaxed">
              Real-time operational dashboard monitoring automated lead ingestion, AI qualification, durable workflow runs, and external integration health.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Link href="/integrations">
              <Button variant="outline" size="sm" className="text-xs border-zinc-800">
                <Zap className="mr-1.5 h-3.5 w-3.5 text-purple-400" />
                Integration Settings
              </Button>
            </Link>
            <Link href="/workflows">
              <Button size="sm" className="text-xs bg-purple-600 hover:bg-purple-500">
                <GitFork className="mr-1.5 h-3.5 w-3.5" />
                Workflow Builder
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Primary Real Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Leads */}
        <Card className="border-zinc-800 bg-zinc-900/50 p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-400">Total Captured Leads</span>
            <div className="h-7 w-7 rounded-lg bg-indigo-500/15 text-indigo-400 flex items-center justify-center">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-white font-mono">{totalLeads}</div>
            <div className="text-[11px] text-zinc-400 mt-1 flex items-center gap-1">
              <span className="text-purple-400 font-semibold">{qualifiedLeads} Qualified</span> •{' '}
              <span className="text-rose-400 font-semibold flex items-center gap-0.5">
                <Flame className="h-3 w-3 inline" /> {hotLeads} Hot
              </span>
            </div>
          </div>
        </Card>

        {/* Durable Execution Runs */}
        <Card className="border-zinc-800 bg-zinc-900/50 p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-400">Workflow Runs</span>
            <div className="h-7 w-7 rounded-lg bg-cyan-500/15 text-cyan-400 flex items-center justify-center">
              <Activity className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-white font-mono">{totalRuns}</div>
            <div className="text-[11px] text-zinc-400 mt-1 flex items-center gap-1.5">
              <span className="text-emerald-400 font-medium">{succeededRuns} Succeeded</span> •{' '}
              <span className="text-rose-400 font-medium">{failedRuns} Failed</span> •{' '}
              <span className="text-amber-400 font-medium">{waitingRuns} In-Flight</span>
            </div>
          </div>
        </Card>

        {/* Estimated Time Saved */}
        <Card className="border-zinc-800 bg-zinc-900/50 p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-400 flex items-center gap-1">
              <span>Estimated Time Saved</span>
              <span title="Calculated formula: (Completed Autonomous Runs × 12 min) / 60">
                <HelpCircle className="h-3 w-3 text-zinc-500 inline cursor-help" />
              </span>
            </span>
            <div className="h-7 w-7 rounded-lg bg-emerald-500/15 text-emerald-400 flex items-center justify-center">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-white font-mono">{estimatedHoursSaved} <span className="text-xs font-sans text-zinc-400 font-normal">hours</span></div>
            <div className="text-[10px] text-zinc-500 mt-1">
              Formula: (Succeeded Runs × 12m) ÷ 60
            </div>
          </div>
        </Card>

        {/* Active Pipelines */}
        <Card className="border-zinc-800 bg-zinc-900/50 p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-400">Active Pipelines</span>
            <div className="h-7 w-7 rounded-lg bg-purple-500/15 text-purple-400 flex items-center justify-center">
              <GitFork className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-white font-mono">{activeWorkflows}</div>
            <div className="text-[11px] text-zinc-400 mt-1">
              Published & executing triggers
            </div>
          </div>
        </Card>
      </div>

      {/* Configuration & Failure Alerts (if any) */}
      {integrationErrors.length > 0 && (
        <div className="p-4 rounded-2xl border border-rose-500/30 bg-rose-950/20 text-xs text-rose-300 space-y-2 shadow-lg">
          <div className="flex items-center gap-2 font-bold">
            <AlertTriangle className="h-4 w-4 text-rose-400" />
            <span>Integration Configuration Warnings</span>
          </div>
          <p className="text-zinc-300 text-[11px]">
            The following connectors encountered delivery errors during recent attempts:
          </p>
          <div className="space-y-1 font-mono text-[11px]">
            {integrationErrors.map((err, i) => (
              <div key={i} className="flex items-center justify-between bg-zinc-950/80 p-2 rounded-lg border border-rose-900/40">
                <span className="font-semibold text-rose-300 capitalize">{err.name || err.provider}</span>
                <span className="text-zinc-400 truncate max-w-md">{err.last_error || 'Configuration required'}</span>
                <Link href="/integrations">
                  <Button variant="ghost" size="sm" className="h-6 text-[10px] text-purple-400 hover:text-purple-300">
                    Fix Connector
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Workflow Templates Launcher Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-purple-400" />
              <span>Production Workflow Templates</span>
            </h3>
            <p className="text-xs text-zinc-400">
              Instantiate complete, pre-configured DAG pipelines with durable delays and state re-reading.
            </p>
          </div>
          <Link href="/workflows">
            <Button variant="ghost" size="sm" className="text-xs text-purple-400 hover:text-purple-300">
              View All Workflows →
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {WORKFLOW_TEMPLATES.map((tpl) => (
            <Card key={tpl.id} className="border-zinc-800 bg-zinc-900/50 p-5 flex flex-col justify-between shadow-lg hover:border-purple-500/40 transition-colors">
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-purple-500/15 border border-purple-500/30 text-purple-300">
                    {tpl.category}
                  </span>
                  <div className="flex items-center gap-1">
                    {tpl.requiredConnections.map((req) => (
                      <span key={req} className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400">
                        {req}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-bold text-white">{tpl.name}</h4>
                  <p className="text-xs text-zinc-400 mt-1 leading-relaxed line-clamp-3">
                    {tpl.description}
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t border-zinc-800/80 mt-4 flex items-center justify-between">
                <span className="text-[11px] font-mono text-zinc-500">{tpl.graph.nodes.length} Nodes</span>
                <Link href={`/workflows/new?templateId=${tpl.id}`}>
                  <Button size="sm" className="h-7 text-xs bg-purple-600 hover:bg-purple-500 gap-1">
                    <span>Use Template</span>
                    <ArrowUpRight className="h-3 w-3" />
                  </Button>
                </Link>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
