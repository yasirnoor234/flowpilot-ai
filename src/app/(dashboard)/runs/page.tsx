import React from 'react';
import Link from 'next/link';
import { requireWorkspaceAuth } from '@/lib/auth/workspace-context';
import { createClient } from '@/lib/supabase/server';
import { RunList } from '@/components/runs/run-list';
import { EmptyState } from '@/components/ui/empty-state';
import { Button } from '@/components/ui/button';
import { Activity, RefreshCw, Play } from 'lucide-react';
import type { WorkflowRunRecord } from '@/types/execution';

export default async function RunsPage() {
  const context = await requireWorkspaceAuth();
  const supabase = await createClient();

  const { data: runs } = await supabase
    .from('workflow_runs')
    .select(`
      *,
      workflow:workflows(id, name)
    `)
    .eq('workspace_id', context.workspace.id)
    .order('created_at', { ascending: false })
    .limit(50);

  const typedRuns = (runs || []) as unknown as (WorkflowRunRecord & {
    workflow?: { id: string; name: string };
  })[];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Execution Runs & Logs</h2>
          <p className="text-xs text-zinc-400">
            Real-time audit trails and step-level execution logs for {context.workspace.name}.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/runs">
            <Button variant="secondary" size="sm">
              <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
              <span>Refresh</span>
            </Button>
          </Link>
        </div>
      </div>

      {typedRuns.length === 0 ? (
        <EmptyState
          icon={Activity}
          title="No workflow runs executed yet"
          description="When webhooks or manual triggers initiate your published workflows, durable Inngest background steps, inputs, outputs, and status logs will appear here in real-time."
          actionLabel="View Workflows"
          actionHref="/workflows"
        />
      ) : (
        <RunList runs={typedRuns} workspaceId={context.workspace.id} />
      )}
    </div>
  );
}
