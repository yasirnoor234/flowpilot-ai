'use server';

import { createClient } from '@/lib/supabase/server';
import { requireWorkspaceAuth } from '@/lib/auth/workspace-context';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { validateWorkflowForPublishing } from '@/lib/workflow/validator';
import { WORKFLOW_TEMPLATES } from '@/lib/workflow/templates';
import type { WorkflowGraph, WorkflowStatus, WorkflowRecord, WorkflowVersionRecord } from '@/types/workflow';

export interface WorkflowActionResult {
  error?: string;
  success?: boolean;
  workflowId?: string;
  versionId?: string;
  versionNumber?: number;
  validationErrors?: Array<{ rule: string; message: string }>;
}

/**
 * Creates a new draft workflow in the active workspace.
 */
export async function createWorkflowAction(formData: FormData): Promise<WorkflowActionResult> {
  const context = await requireWorkspaceAuth();

  const name = (formData.get('name') as string)?.trim() || 'Untitled Workflow';
  const description = (formData.get('description') as string)?.trim() || '';
  const templateId = formData.get('templateId') as string;

  // Selected template or blank draft
  const selectedTemplate = WORKFLOW_TEMPLATES.find((t) => t.id === templateId);
  const initialGraph: WorkflowGraph = selectedTemplate
    ? selectedTemplate.graph
    : {
        nodes: [
          {
            id: 'node_trigger',
            type: 'trigger_webhook',
            title: 'Inbound Webhook',
            schema_version: 1,
            config: {
              path_slug: 'inbound',
              http_method: 'POST',
              expected_fields: ['email', 'first_name'],
            },
          },
        ],
        edges: [],
      };

  const webhookSlug = `wf-${Math.random().toString(36).substring(2, 10)}`;
  const workflowId = crypto.randomUUID();

  const supabase = await createClient();

  const { error } = await supabase.from('workflows').insert({
    id: workflowId,
    workspace_id: context.workspace.id,
    name,
    description: description || null,
    status: 'draft',
    webhook_slug: webhookSlug,
    draft_graph: initialGraph as unknown as never,
    created_by: context.user.id,
  } as unknown as never);

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/workflows');
  redirect(`/workflows/${workflowId}`);
}

/**
 * Updates a workflow's metadata (Name & description).
 */
export async function renameWorkflowAction(
  workflowId: string,
  name: string,
  description?: string
): Promise<WorkflowActionResult> {
  const context = await requireWorkspaceAuth();

  const trimmedName = name.trim();
  if (!trimmedName) {
    return { error: 'Workflow name cannot be empty.' };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from('workflows')
    .update({
      name: trimmedName,
      description: description ? description.trim() : null,
      updated_at: new Date().toISOString(),
    } as unknown as never)
    .eq('id', workflowId)
    .eq('workspace_id', context.workspace.id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/workflows/${workflowId}`);
  revalidatePath('/workflows');
  return { success: true };
}

/**
 * Saves draft graph JSON for a workflow.
 */
export async function saveDraftGraphAction(
  workflowId: string,
  draftGraph: WorkflowGraph
): Promise<WorkflowActionResult> {
  const context = await requireWorkspaceAuth();

  const supabase = await createClient();
  const { error } = await supabase
    .from('workflows')
    .update({
      draft_graph: draftGraph as unknown as never,
      updated_at: new Date().toISOString(),
    } as unknown as never)
    .eq('id', workflowId)
    .eq('workspace_id', context.workspace.id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/workflows/${workflowId}`);
  return { success: true };
}

/**
 * Validates draft graph and publishes an immutable version.
 */
export async function publishWorkflowVersionAction(
  workflowId: string,
  changeSummary?: string
): Promise<WorkflowActionResult> {
  const context = await requireWorkspaceAuth();

  const supabase = await createClient();

  // 1. Fetch current draft workflow
  const { data: workflow, error: fetchError } = await supabase
    .from('workflows')
    .select('*')
    .eq('id', workflowId)
    .eq('workspace_id', context.workspace.id)
    .single();

  if (fetchError || !workflow) {
    return { error: 'Workflow not found or access denied.' };
  }

  const draftGraph = (workflow as unknown as WorkflowRecord).draft_graph;

  // 2. Validate DAG and all 8 publication constraints
  const validation = validateWorkflowForPublishing(draftGraph);
  if (!validation.isValid || !validation.compiledGraph) {
    return {
      error: 'Workflow publication validation failed. Please address all errors.',
      validationErrors: validation.errors,
    };
  }

  // 3. Determine next version number
  const { data: lastVersion } = await supabase
    .from('workflow_versions')
    .select('version_number')
    .eq('workflow_id', workflowId)
    .order('version_number', { ascending: false })
    .limit(1)
    .maybeSingle();

  const nextVersionNumber = lastVersion ? ((lastVersion as unknown as { version_number: number }).version_number + 1) : 1;
  const versionId = crypto.randomUUID();

  // 4. Insert immutable version snapshot
  const { error: versionInsertError } = await supabase.from('workflow_versions').insert({
    id: versionId,
    workspace_id: context.workspace.id,
    workflow_id: workflowId,
    version_number: nextVersionNumber,
    compiled_graph: validation.compiledGraph as unknown as never,
    raw_graph: draftGraph as unknown as never,
    change_summary: changeSummary || `Version ${nextVersionNumber} published`,
    published_by: context.user.id,
  } as unknown as never);

  if (versionInsertError) {
    return { error: versionInsertError.message };
  }

  // 5. Update active_version_id and set status to active on workflow
  const { error: updateWfError } = await supabase
    .from('workflows')
    .update({
      active_version_id: versionId,
      status: 'active',
      updated_at: new Date().toISOString(),
    } as unknown as never)
    .eq('id', workflowId)
    .eq('workspace_id', context.workspace.id);

  if (updateWfError) {
    return { error: updateWfError.message };
  }

  revalidatePath(`/workflows/${workflowId}`);
  revalidatePath('/workflows');
  return {
    success: true,
    versionId,
    versionNumber: nextVersionNumber,
  };
}

/**
 * Activates or deactivates a workflow.
 */
export async function toggleWorkflowStatusAction(
  workflowId: string,
  newStatus: WorkflowStatus
): Promise<WorkflowActionResult> {
  const context = await requireWorkspaceAuth();

  const supabase = await createClient();

  // If activating, ensure workflow has an active published version
  if (newStatus === 'active') {
    const { data: wf } = await supabase
      .from('workflows')
      .select('active_version_id')
      .eq('id', workflowId)
      .eq('workspace_id', context.workspace.id)
      .single();

    if (!wf || !(wf as unknown as { active_version_id: string | null }).active_version_id) {
      return { error: 'Cannot activate a workflow without at least one published version.' };
    }
  }

  const { error } = await supabase
    .from('workflows')
    .update({
      status: newStatus,
      updated_at: new Date().toISOString(),
    } as unknown as never)
    .eq('id', workflowId)
    .eq('workspace_id', context.workspace.id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/workflows/${workflowId}`);
  revalidatePath('/workflows');
  return { success: true };
}

/**
 * Duplicates an existing workflow definition as a new draft.
 */
export async function duplicateWorkflowAction(workflowId: string): Promise<WorkflowActionResult> {
  const context = await requireWorkspaceAuth();

  const supabase = await createClient();

  const { data: source, error: fetchError } = await supabase
    .from('workflows')
    .select('*')
    .eq('id', workflowId)
    .eq('workspace_id', context.workspace.id)
    .single();

  if (fetchError || !source) {
    return { error: 'Source workflow not found.' };
  }

  const sourceWf = source as unknown as WorkflowRecord;
  const newWorkflowId = crypto.randomUUID();
  const newWebhookSlug = `wf-${Math.random().toString(36).substring(2, 10)}`;

  const { error: insertError } = await supabase.from('workflows').insert({
    id: newWorkflowId,
    workspace_id: context.workspace.id,
    name: `${sourceWf.name} (Copy)`,
    description: sourceWf.description,
    status: 'draft',
    webhook_slug: newWebhookSlug,
    draft_graph: sourceWf.draft_graph as unknown as never,
    created_by: context.user.id,
  } as unknown as never);

  if (insertError) {
    return { error: insertError.message };
  }

  revalidatePath('/workflows');
  redirect(`/workflows/${newWorkflowId}`);
}

/**
 * Deletes a workflow and all its associated versions.
 */
export async function deleteWorkflowAction(workflowId: string): Promise<WorkflowActionResult> {
  const context = await requireWorkspaceAuth();

  const supabase = await createClient();

  const { error } = await supabase
    .from('workflows')
    .delete()
    .eq('id', workflowId)
    .eq('workspace_id', context.workspace.id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/workflows');
  redirect('/workflows');
}

/**
 * Fetches all published versions of a workflow.
 */
export async function getWorkflowVersions(workflowId: string): Promise<WorkflowVersionRecord[]> {
  const context = await requireWorkspaceAuth();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('workflow_versions')
    .select('*')
    .eq('workflow_id', workflowId)
    .eq('workspace_id', context.workspace.id)
    .order('version_number', { ascending: false });

  if (error || !data) {
    return [];
  }

  return data as unknown as WorkflowVersionRecord[];
}
