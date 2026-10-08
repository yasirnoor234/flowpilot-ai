import React from 'react';
import { notFound } from 'next/navigation';
import { requireWorkspaceAuth } from '@/lib/auth/workspace-context';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { RunDetail } from '@/components/runs/run-detail';
import type { WorkflowRunRecord, WorkflowStepRunRecord } from '@/types/execution';

interface RunDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function RunDetailPage({ params }: RunDetailPageProps) {
  const { id } = await params;
  const context = await requireWorkspaceAuth();
  const supabase = await createServerSupabaseClient();

  // 1. Fetch Run Record with Workflow & Version details
  const { data: run, error: runError } = await supabase
    .from('workflow_runs')
    .select(`
      *,
      workflow:workflows(id, name),
      workflow_version:workflow_versions(id, version_number, changelog)
    `)
    .eq('id', id)
    .eq('workspace_id', context.workspace.id)
    .single();

  if (runError || !run) {
    notFound();
  }

  // 2. Fetch Step Runs in chronological order
  const { data: steps } = await supabase
    .from('workflow_step_runs')
    .select('*')
    .eq('run_id', id)
    .eq('workspace_id', context.workspace.id)
    .order('started_at', { ascending: true, nullsFirst: false })
    .order('created_at', { ascending: true });

  const typedRun = run as unknown as (WorkflowRunRecord & {
    workflow?: { id: string; name: string };
    workflow_version?: { id: string; version_number: number; changelog: string };
  });

  const typedSteps = (steps || []) as unknown as WorkflowStepRunRecord[];

  return (
    <RunDetail
      run={typedRun}
      steps={typedSteps}
      workspaceId={context.workspace.id}
    />
  );
}
