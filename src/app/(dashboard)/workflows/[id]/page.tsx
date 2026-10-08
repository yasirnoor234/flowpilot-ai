import React from 'react';
import { redirect } from 'next/navigation';
import { requireWorkspaceAuth } from '@/lib/auth/workspace-context';
import { createClient } from '@/lib/supabase/server';
import { WorkflowDetail } from '@/components/workflow/workflow-detail';
import { getWorkflowVersions } from '@/lib/actions/workflows';
import type { WorkflowRecord } from '@/types/workflow';

interface WorkflowDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function WorkflowDetailPage({ params }: WorkflowDetailPageProps) {
  const { id } = await params;
  const context = await requireWorkspaceAuth();
  const supabase = await createClient();

  // Query workflow scoped strictly to workspace
  const { data: workflowData, error } = await supabase
    .from('workflows')
    .select('*')
    .eq('id', id)
    .eq('workspace_id', context.workspace.id)
    .single();

  if (error || !workflowData) {
    redirect('/workflows');
  }

  const raw = workflowData as unknown as WorkflowRecord;

  const workflow: WorkflowRecord = {
    id: raw.id,
    workspace_id: raw.workspace_id,
    name: raw.name,
    description: raw.description,
    status: raw.status,
    webhook_slug: raw.webhook_slug,
    draft_graph: raw.draft_graph || { nodes: [], edges: [] },
    active_version_id: raw.active_version_id,
    created_by: raw.created_by,
    created_at: raw.created_at,
    updated_at: raw.updated_at,
  };

  const versions = await getWorkflowVersions(id);

  return (
    <WorkflowDetail
      workflow={workflow}
      versions={versions}
      workspaceName={context.workspace.name}
    />
  );
}
