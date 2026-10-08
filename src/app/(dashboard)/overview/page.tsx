import React from 'react';
import { requireWorkspaceAuth } from '@/lib/auth/workspace-context';
import { createClient } from '@/lib/supabase/server';
import { PageHeader } from '@/components/ui/page-header';
import { MetricCard } from '@/components/ui/metric-card';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Users,
  GitFork,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowRight,
  Plus,
  PlugZap,
  Activity,
  Bot,
  Mail,
  MessageSquare,
  ShieldCheck,
  Check,
} from 'lucide-react';
import Link from 'next/link';
import { WORKFLOW_TEMPLATES } from '@/lib/workflow/templates';

export const dynamic = 'force-dynamic';

export default async function OverviewPage() {
  const context = await requireWorkspaceAuth();
  const supabase = await createClient();

  // Query Real Operational Metrics
  const [
    { count: totalLeadsCount },
    { count: activeWorkflowsCount },
    { count: totalWorkflowsCount },
    { count: succeededRunsCount },
    { count: failedRunsCount },
    { data: recentRunsData },
    { data: recentLeadsData },
    { data: integrationConnectionsData },
  ] = await Promise.all([
    supabase.from('leads').select('*', { count: 'exact', head: true }).eq('workspace_id', context.workspace.id),
    supabase.from('workflows').select('*', { count: 'exact', head: true }).eq('workspace_id', context.workspace.id).eq('status', 'active'),
    supabase.from('workflows').select('*', { count: 'exact', head: true }).eq('workspace_id', context.workspace.id),
    supabase.from('workflow_runs').select('*', { count: 'exact', head: true }).eq('workspace_id', context.workspace.id).eq('status', 'succeeded'),
    supabase.from('workflow_runs').select('*', { count: 'exact', head: true }).eq('workspace_id', context.workspace.id).eq('status', 'failed'),
    supabase
      .from('workflow_runs')
      .select('id, workflow_id, status, started_at, finished_at, created_at, workflows(name)')
      .eq('workspace_id', context.workspace.id)
      .order('created_at', { ascending: false })
      .limit(5),
    supabase
      .from('leads')
      .select('id, name, company, email, qualification_status, qualification_score, status, created_at')
      .eq('workspace_id', context.workspace.id)
      .order('created_at', { ascending: false })
      .limit(5),
    supabase
      .from('integration_connections')
      .select('provider, status, name, last_error, updated_at')
      .eq('workspace_id', context.workspace.id),
  ]);

  const totalLeads = totalLeadsCount || 0;
  const activeWorkflows = activeWorkflowsCount || 0;
  const totalWorkflows = totalWorkflowsCount || 0;
  const succeededRuns = succeededRunsCount || 0;
  const failedRuns = failedRunsCount || 0;
  const totalRuns = succeededRuns + failedRuns;

  const recentRuns = (recentRunsData || []) as unknown as Array<{
    id: string;
    workflow_id: string;
    status: string;
    started_at: string | null;
    finished_at: string | null;
    created_at: string;
    workflows?: { name: string } | null;
  }>;

  const recentLeads = recentLeadsData || [];
  const connections = (integrationConnectionsData || []) as unknown as Array<{
    provider: string;
    status: string;
    name: string;
    last_error: string | null;
  }>;

  // Onboarding derivation
  const hasConnectedIntegration = connections.some((c) => c.status === 'active' || c.status === 'configured');
  const hasCreatedWorkflow = totalWorkflows > 0;
  const hasRunWorkflow = totalRuns > 0;
  const hasActiveWorkflow = activeWorkflows > 0;

  const showOnboardingChecklist = totalWorkflows === 0 && totalRuns === 0;

  // Estimated time saved calculation: 12 minutes per successful workflow execution
  const estimatedHoursSaved = ((succeededRuns * 12) / 60).toFixed(1);

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <PageHeader
        title="Overview"
        description="Monitor your workflows, leads, and recent activity."
      >
        <Link href="/workflows/new">
          <Button size="sm">
            <Plus className="h-4 w-4" />
            <span>Create workflow</span>
          </Button>
        </Link>
      </PageHeader>

      {/* 1. Metric Cards (4 Real Metrics) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Leads Captured"
          value={totalLeads}
          description="Total inbound leads in CRM"
          period="All-time"
          icon={<Users className="h-4 w-4" />}
        />

        <MetricCard
          label="Active Workflows"
          value={activeWorkflows}
          description={`${totalWorkflows} total configured`}
          period="Current"
          icon={<GitFork className="h-4 w-4" />}
        />

        <MetricCard
          label="Successful Runs"
          value={succeededRuns}
          description="Executed without errors"
          period="All-time"
          icon={<CheckCircle2 className="h-4 w-4 text-emerald-600" />}
        />

        <MetricCard
          label="Failed Runs"
          value={failedRuns}
          description="Errors requiring review"
          period="All-time"
          icon={<AlertCircle className="h-4 w-4 text-red-600" />}
        />
      </div>

      {/* Optional secondary note on estimated time saved */}
      {succeededRuns > 0 && (
        <div className="px-4 py-2.5 rounded-lg bg-zinc-50 border border-zinc-200/80 text-xs text-zinc-600 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-zinc-400" />
            <span>
              <strong>Estimated time saved:</strong> ~{estimatedHoursSaved} hours across {succeededRuns} automated lead qualification and follow-up cycles.
            </span>
          </div>
          <span className="text-[11px] text-zinc-400">Formula: 12 min per successful run</span>
        </div>
      )}

      {/* 2. Onboarding Checklist (Shown when 0 workflows exist) */}
      {showOnboardingChecklist && (
        <Card className="p-6 border-indigo-100 bg-indigo-50/30">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-indigo-100/60 mb-4">
            <div>
              <h3 className="text-base font-semibold text-zinc-900">Getting Started with FlowPilot</h3>
              <p className="text-xs text-zinc-600 mt-0.5">Complete these four steps to activate your first autonomous business pipeline.</p>
            </div>
            <Link href="/workflows/new">
              <Button size="sm">Start First Workflow</Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-lg bg-white border border-zinc-200/80 flex items-start gap-3">
              <div className={`h-5 w-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${hasConnectedIntegration ? 'bg-emerald-600 text-white' : 'bg-zinc-100 text-zinc-400'}`}>
                {hasConnectedIntegration ? <Check className="h-3 w-3" /> : '1'}
              </div>
              <div>
                <div className="text-xs font-semibold text-zinc-900">1. Connect Integrations</div>
                <div className="text-[11px] text-zinc-500 mt-0.5">Add OpenAI, Resend, or Slack keys</div>
              </div>
            </div>

            <div className="p-3.5 rounded-lg bg-white border border-zinc-200/80 flex items-start gap-3">
              <div className={`h-5 w-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${hasCreatedWorkflow ? 'bg-emerald-600 text-white' : 'bg-zinc-100 text-zinc-400'}`}>
                {hasCreatedWorkflow ? <Check className="h-3 w-3" /> : '2'}
              </div>
              <div>
                <div className="text-xs font-semibold text-zinc-900">2. Choose Template</div>
                <div className="text-[11px] text-zinc-500 mt-0.5">Instantiate an editable draft</div>
              </div>
            </div>

            <div className="p-3.5 rounded-lg bg-white border border-zinc-200/80 flex items-start gap-3">
              <div className={`h-5 w-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${hasRunWorkflow ? 'bg-emerald-600 text-white' : 'bg-zinc-100 text-zinc-400'}`}>
                {hasRunWorkflow ? <Check className="h-3 w-3" /> : '3'}
              </div>
              <div>
                <div className="text-xs font-semibold text-zinc-900">3. Run Test Event</div>
                <div className="text-[11px] text-zinc-500 mt-0.5">Verify node logic with test trigger</div>
              </div>
            </div>

            <div className="p-3.5 rounded-lg bg-white border border-zinc-200/80 flex items-start gap-3">
              <div className={`h-5 w-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${hasActiveWorkflow ? 'bg-emerald-600 text-white' : 'bg-zinc-100 text-zinc-400'}`}>
                {hasActiveWorkflow ? <Check className="h-3 w-3" /> : '4'}
              </div>
              <div>
                <div className="text-xs font-semibold text-zinc-900">4. Activate Workflow</div>
                <div className="text-[11px] text-zinc-500 mt-0.5">Publish immutable version to go live</div>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* 3. Operational Grid: Recent Runs & Integration Status */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Recent Runs (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle>Recent Runs</CardTitle>
                <CardDescription>Latest workflow executions</CardDescription>
              </div>
              <Link href="/runs" className="text-xs text-indigo-600 hover:text-indigo-700 font-medium">
                View all runs →
              </Link>
            </CardHeader>
            <CardContent>
              {recentRuns.length === 0 ? (
                <div className="text-center py-8 text-xs text-zinc-500">
                  No workflow executions recorded yet.
                </div>
              ) : (
                <div className="overflow-x-auto -mx-6">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-zinc-50 border-y border-zinc-100 text-zinc-500 font-medium">
                      <tr>
                        <th className="py-2.5 px-6">Workflow</th>
                        <th className="py-2.5 px-3">Status</th>
                        <th className="py-2.5 px-3">Started</th>
                        <th className="py-2.5 px-6 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100">
                      {recentRuns.map((run) => (
                        <tr key={run.id} className="hover:bg-zinc-50/50">
                          <td className="py-3 px-6 font-medium text-zinc-900">
                            {run.workflows?.name || 'Untitled Workflow'}
                          </td>
                          <td className="py-3 px-3">
                            <Badge
                              variant={
                                run.status === 'succeeded'
                                  ? 'success'
                                  : run.status === 'failed'
                                  ? 'destructive'
                                  : run.status === 'waiting'
                                  ? 'warning'
                                  : 'secondary'
                              }
                              size="sm"
                            >
                              {run.status}
                            </Badge>
                          </td>
                          <td className="py-3 px-3 text-zinc-500">
                            {new Date(run.created_at).toLocaleDateString([], {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </td>
                          <td className="py-3 px-6 text-right">
                            <Link
                              href={`/runs/${run.id}`}
                              className="text-xs text-indigo-600 hover:text-indigo-700 font-medium"
                            >
                              Inspect
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Integration Status (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle>Integration Status</CardTitle>
                <CardDescription>Connected third-party tools</CardDescription>
              </div>
              <Link href="/integrations" className="text-xs text-indigo-600 hover:text-indigo-700 font-medium">
                Configure →
              </Link>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="p-3 rounded-lg border border-zinc-200/80 bg-zinc-50/50 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2.5">
                  <Bot className="h-4 w-4 text-indigo-600" />
                  <div>
                    <div className="font-medium text-zinc-900">OpenAI (GPT-4o)</div>
                    <div className="text-[11px] text-zinc-500">Lead qualification & scoring</div>
                  </div>
                </div>
                <Badge variant={process.env.OPENAI_API_KEY ? 'success' : 'secondary'} size="sm">
                  {process.env.OPENAI_API_KEY ? 'Configured' : 'Demo Adapter'}
                </Badge>
              </div>

              <div className="p-3 rounded-lg border border-zinc-200/80 bg-zinc-50/50 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2.5">
                  <Mail className="h-4 w-4 text-zinc-800" />
                  <div>
                    <div className="font-medium text-zinc-900">Resend Email</div>
                    <div className="text-[11px] text-zinc-500">Transactional lead responses</div>
                  </div>
                </div>
                <Badge variant={process.env.RESEND_API_KEY ? 'success' : 'secondary'} size="sm">
                  {process.env.RESEND_API_KEY ? 'Configured' : 'Demo Adapter'}
                </Badge>
              </div>

              <div className="p-3 rounded-lg border border-zinc-200/80 bg-zinc-50/50 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2.5">
                  <MessageSquare className="h-4 w-4 text-emerald-600" />
                  <div>
                    <div className="font-medium text-zinc-900">Slack Webhooks</div>
                    <div className="text-[11px] text-zinc-500">Team channel notification cards</div>
                  </div>
                </div>
                <Badge variant={process.env.SLACK_WEBHOOK_URL ? 'success' : 'secondary'} size="sm">
                  {process.env.SLACK_WEBHOOK_URL ? 'Configured' : 'Demo Adapter'}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 4. Recent Leads Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div>
            <CardTitle>Recent Leads</CardTitle>
            <CardDescription>Latest contacts ingested into CRM</CardDescription>
          </div>
          <Link href="/leads" className="text-xs text-indigo-600 hover:text-indigo-700 font-medium">
            View all leads →
          </Link>
        </CardHeader>
        <CardContent>
          {recentLeads.length === 0 ? (
            <div className="text-center py-8 text-xs text-zinc-500">
              No leads recorded in CRM yet.
            </div>
          ) : (
            <div className="overflow-x-auto -mx-6">
              <table className="w-full text-xs text-left">
                <thead className="bg-zinc-50 border-y border-zinc-100 text-zinc-500 font-medium">
                  <tr>
                    <th className="py-2.5 px-6">Name</th>
                    <th className="py-2.5 px-3">Company</th>
                    <th className="py-2.5 px-3">Qualification</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-6 text-right">Received</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {recentLeads.map((lead: any) => (
                    <tr key={lead.id} className="hover:bg-zinc-50/50">
                      <td className="py-3 px-6">
                        <Link href={`/leads/${lead.id}`} className="font-medium text-zinc-900 hover:text-indigo-600">
                          {lead.name}
                        </Link>
                        <div className="text-[11px] text-zinc-400">{lead.email}</div>
                      </td>
                      <td className="py-3 px-3 text-zinc-600">{lead.company || '—'}</td>
                      <td className="py-3 px-3">
                        <Badge
                          variant={
                            lead.qualification_status === 'hot' || (lead.qualification_score && lead.qualification_score >= 80)
                              ? 'success'
                              : lead.qualification_status === 'warm'
                              ? 'primary'
                              : 'secondary'
                          }
                          size="sm"
                        >
                          {lead.qualification_score ? `${lead.qualification_score}/100` : lead.qualification_status || 'Pending'}
                        </Badge>
                      </td>
                      <td className="py-3 px-3 capitalize text-zinc-600">
                        {lead.status.replace('_', ' ')}
                      </td>
                      <td className="py-3 px-6 text-right text-zinc-500">
                        {new Date(lead.created_at).toLocaleDateString([], {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 5. Prebuilt Templates (Moved Below Operational Information) */}
      <div className="space-y-4 pt-4 border-t border-zinc-200/80">
        <div>
          <h3 className="text-base font-semibold text-zinc-900">Prebuilt Workflow Templates</h3>
          <p className="text-xs text-zinc-500 mt-0.5">Start with an established template or create a custom workflow.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {WORKFLOW_TEMPLATES.map((tpl) => (
            <Card key={tpl.id} className="p-5 flex flex-col justify-between hover:border-zinc-300 transition-colors">
              <div className="space-y-2">
                <Badge variant="secondary" size="sm">{tpl.category}</Badge>
                <h4 className="text-sm font-semibold text-zinc-900">{tpl.name}</h4>
                <p className="text-xs text-zinc-500 leading-relaxed line-clamp-3">
                  {tpl.description}
                </p>
              </div>

              <div className="pt-4 border-t border-zinc-100 mt-4 flex items-center justify-between">
                <span className="text-[11px] text-zinc-400 font-medium">{tpl.requiredConnections.join(' · ')}</span>
                <Link href={`/workflows/new?templateId=${tpl.id}`}>
                  <Button size="sm" variant="outline">
                    Use Template
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
