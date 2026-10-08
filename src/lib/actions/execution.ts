'use server';

import { createClient } from '@/lib/supabase/server';
import { requireWorkspaceAuth } from '@/lib/auth/workspace-context';
import { revalidatePath } from 'next/cache';
import { dispatchWorkflowExecution } from '@/lib/inngest/dispatch';
import type { WorkflowRunRecord, WorkflowStepRunRecord } from '@/types/execution';
import type { WorkflowRecord } from '@/types/workflow';

export interface ExecutionActionResult {
  error?: string;
  success?: boolean;
  runId?: string;
  isDuplicate?: boolean;
}

/**
 * Triggers a manual test run for a published workflow.
 */
export async function triggerManualRunAction(
  workflowId: string,
  customPayload?: Record<string, any>
): Promise<ExecutionActionResult> {
  const context = await requireWorkspaceAuth();
  const supabase = await createClient();

  // 1. Fetch workflow and its active published version
  const { data: workflow, error: wfError } = await supabase
    .from('workflows')
    .select('*, active_version_id')
    .eq('id', workflowId)
    .eq('workspace_id', context.workspace.id)
    .single();

  if (wfError || !workflow) {
    return { error: 'Workflow not found or access denied.' };
  }

  const activeVersionId = (workflow as unknown as WorkflowRecord).active_version_id;
  if (!activeVersionId) {
    return { error: 'Cannot run workflow: No published version found. Please publish a version first.' };
  }

  // Use draft sample payload or custom provided payload
  const draftGraph = (workflow as unknown as WorkflowRecord).draft_graph;
  const manualTriggerNode = draftGraph?.nodes?.find((n) => n.type === 'trigger_manual' || n.type === 'trigger_webhook');
  const defaultPayload = manualTriggerNode?.config?.sample_payload || {
    email: 'alex@example.com',
    first_name: 'Alex',
    company: 'Acme Corp',
    budget: '$15,000',
    message: 'Interested in automation consulting services.',
  };

  const payload = customPayload && Object.keys(customPayload).length > 0 ? customPayload : defaultPayload;

  // 2. Dispatch execution
  try {
    const result = await dispatchWorkflowExecution({
      workspaceId: context.workspace.id,
      workflowId,
      versionId: activeVersionId,
      triggerType: 'manual',
      triggerPayload: payload,
    });

    revalidatePath(`/workflows/${workflowId}`);
    revalidatePath('/runs');
    return {
      success: true,
      runId: result.runId,
      isDuplicate: result.isDuplicate,
    };
  } catch (err: unknown) {
    return { error: err instanceof Error ? err.message : 'Failed to dispatch workflow execution.' };
  }
}

/**
 * Cancels an in-flight or queued workflow run.
 */
export async function cancelWorkflowRunAction(runId: string): Promise<ExecutionActionResult> {
  const context = await requireWorkspaceAuth();
  const supabase = await createClient();

  const { error } = await supabase
    .from('workflow_runs')
    .update({
      status: 'canceled',
      finished_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    } as unknown as never)
    .eq('id', runId)
    .eq('workspace_id', context.workspace.id)
    .in('status', ['queued', 'running', 'waiting']);

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/runs/${runId}`);
  revalidatePath('/runs');
  return { success: true };
}

/**
 * Reruns a completed or failed workflow run, creating a new linked run referencing the original published version.
 */
export async function rerunWorkflowAction(runId: string): Promise<ExecutionActionResult> {
  const context = await requireWorkspaceAuth();
  const supabase = await createClient();

  // Fetch original run
  const { data: originalRun, error: fetchError } = await supabase
    .from('workflow_runs')
    .select('*')
    .eq('id', runId)
    .eq('workspace_id', context.workspace.id)
    .single();

  if (fetchError || !originalRun) {
    return { error: 'Original execution run not found.' };
  }

  const runRecord = originalRun as unknown as WorkflowRunRecord;

  // Dispatch new linked run with original version and payload
  try {
    const result = await dispatchWorkflowExecution({
      workspaceId: context.workspace.id,
      workflowId: runRecord.workflow_id,
      versionId: runRecord.workflow_version_id,
      triggerType: runRecord.trigger_type,
      triggerPayload: runRecord.trigger_payload,
      parentRunId: runId,
    });

    revalidatePath('/runs');
    return {
      success: true,
      runId: result.runId,
    };
  } catch (err: unknown) {
    return { error: err instanceof Error ? err.message : 'Failed to trigger rerun.' };
  }
}

/**
 * Fetches all execution runs in the workspace.
 */
export async function getWorkspaceRuns(workflowId?: string): Promise<WorkflowRunRecord[]> {
  const context = await requireWorkspaceAuth();
  const supabase = await createClient();

  let query = supabase
    .from('workflow_runs')
    .select(`
      id,
      workspace_id,
      workflow_id,
      workflow_version_id,
      trigger_type,
      trigger_payload,
      idempotency_key,
      status,
      error_message,
      parent_run_id,
      started_at,
      finished_at,
      created_at,
      updated_at,
      workflows (
        id,
        name,
        status
      ),
      workflow_versions (
        id,
        version_number
      )
    `)
    .eq('workspace_id', context.workspace.id)
    .order('created_at', { ascending: false });

  if (workflowId) {
    query = query.eq('workflow_id', workflowId);
  }

  const { data, error } = await query;
  if (error || !data) {
    return [];
  }

  return (data as any[]).map((row) => ({
    id: row.id,
    workspace_id: row.workspace_id,
    workflow_id: row.workflow_id,
    workflow_version_id: row.workflow_version_id,
    trigger_type: row.trigger_type,
    trigger_payload: row.trigger_payload || {},
    idempotency_key: row.idempotency_key,
    status: row.status,
    error_message: row.error_message,
    parent_run_id: row.parent_run_id,
    started_at: row.started_at,
    finished_at: row.finished_at,
    created_at: row.created_at,
    updated_at: row.updated_at,
    workflow: row.workflows,
    version: row.workflow_versions,
  }));
}

/**
 * Fetches detailed step runs and metadata for a specific run.
 */
export async function getRunDetail(runId: string): Promise<{ run: WorkflowRunRecord; stepRuns: WorkflowStepRunRecord[] } | null> {
  const context = await requireWorkspaceAuth();
  const supabase = await createClient();

  const { data: runData, error: runError } = await supabase
    .from('workflow_runs')
    .select(`
      id,
      workspace_id,
      workflow_id,
      workflow_version_id,
      trigger_type,
      trigger_payload,
      idempotency_key,
      status,
      error_message,
      parent_run_id,
      started_at,
      finished_at,
      created_at,
      updated_at,
      workflows (
        id,
        name,
        status
      ),
      workflow_versions (
        id,
        version_number,
        change_summary
      )
    `)
    .eq('id', runId)
    .eq('workspace_id', context.workspace.id)
    .single();

  if (runError || !runData) {
    return null;
  }

  const { data: stepData } = await supabase
    .from('workflow_step_runs')
    .select('*')
    .eq('run_id', runId)
    .eq('workspace_id', context.workspace.id)
    .order('created_at', { ascending: true });

  const rawRun = runData as any;
  const run: WorkflowRunRecord = {
    id: rawRun.id,
    workspace_id: rawRun.workspace_id,
    workflow_id: rawRun.workflow_id,
    workflow_version_id: rawRun.workflow_version_id,
    trigger_type: rawRun.trigger_type,
    trigger_payload: rawRun.trigger_payload || {},
    idempotency_key: rawRun.idempotency_key,
    status: rawRun.status,
    error_message: rawRun.error_message,
    parent_run_id: rawRun.parent_run_id,
    started_at: rawRun.started_at,
    finished_at: rawRun.finished_at,
    created_at: rawRun.created_at,
    updated_at: rawRun.updated_at,
    workflow: rawRun.workflows,
    version: rawRun.workflow_versions,
  };

  const stepRuns: WorkflowStepRunRecord[] = (stepData || []).map((row: any) => ({
    id: row.id,
    run_id: row.run_id,
    workspace_id: row.workspace_id,
    node_id: row.node_id,
    node_type: row.node_type,
    node_title: row.node_title,
    status: row.status,
    input_data: row.input_data,
    output_data: row.output_data,
    error_message: row.error_message,
    retry_count: row.retry_count || 0,
    duration_ms: row.duration_ms,
    started_at: row.started_at,
    finished_at: row.finished_at,
    created_at: row.created_at,
    updated_at: row.updated_at,
  }));

  return { run, stepRuns };
}
