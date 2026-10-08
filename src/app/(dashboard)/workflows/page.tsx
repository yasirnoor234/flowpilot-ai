import React from 'react';
import { requireWorkspaceAuth } from '@/lib/auth/workspace-context';
import { createClient } from '@/lib/supabase/server';
import { WorkflowList } from '@/components/workflow/workflow-list';
import type { WorkflowRecord } from '@/types/workflow';

export default async function WorkflowsPage() {
  const context = await requireWorkspaceAuth();
  const supabase = await createClient();

  // Query workflows scoped strictly to active workspace (enforced by RLS)
  const { data: workflowsData } = await supabase
    .from('workflows')
    .select('*')
    .eq('workspace_id', context.workspace.id)
    .order('updated_at', { ascending: false });

  const rawRows = (workflowsData || []) as unknown as WorkflowRecord[];

  const workflows: WorkflowRecord[] = rawRows.map((row) => ({
    id: row.id,
    workspace_id: row.workspace_id,
    name: row.name,
    description: row.description,
    status: row.status,
    webhook_slug: row.webhook_slug,
    draft_graph: row.draft_graph || { nodes: [], edges: [] },
    active_version_id: row.active_version_id,
    created_by: row.created_by,
    created_at: row.created_at,
    updated_at: row.updated_at,
  }));

  return (
    <WorkflowList
      workflows={workflows}
      workspaceName={context.workspace.name}
    />
  );
}
