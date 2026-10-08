import { inngest } from './client';
import { createAdminClient } from '@/lib/supabase/server';
import { executeWorkflowSnapshot } from '@/lib/workflow/executor/workflow-engine';
import type { CompiledWorkflowGraph, WorkflowVersionRecord } from '@/types/workflow';

export interface DispatchWorkflowOptions {
  workspaceId: string;
  workflowId: string;
  versionId: string;
  triggerType: 'manual' | 'webhook';
  triggerPayload: Record<string, any>;
  idempotencyKey?: string;
  parentRunId?: string;
}

export interface DispatchResult {
  runId: string;
  isDuplicate: boolean;
  status: 'queued' | 'running' | 'succeeded' | 'failed';
  error?: string;
}

/**
 * Dispatches a workflow execution event with strict idempotency and failure recovery.
 */
export async function dispatchWorkflowExecution(options: DispatchWorkflowOptions): Promise<DispatchResult> {
  const {
    workspaceId,
    workflowId,
    versionId,
    triggerType,
    triggerPayload,
    idempotencyKey = `evt_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    parentRunId,
  } = options;

  const supabase = createAdminClient();

  // 1. Check for duplicate trigger event (Idempotency Enforcement)
  const { data: existingEvent } = await supabase
    .from('trigger_events')
    .select('run_id, status')
    .eq('workspace_id', workspaceId)
    .eq('idempotency_key', idempotencyKey)
    .maybeSingle();

  if (existingEvent && (existingEvent as any).run_id) {
    return {
      runId: (existingEvent as any).run_id,
      isDuplicate: true,
      status: 'queued',
    };
  }

  // 2. Insert Trigger Event Record
  const eventId = crypto.randomUUID();
  const runId = crypto.randomUUID();

  const { error: eventError } = await supabase.from('trigger_events').insert({
    id: eventId,
    workspace_id: workspaceId,
    workflow_id: workflowId,
    event_type: triggerType === 'manual' ? 'workflow.manual' : 'workflow.webhook',
    idempotency_key: idempotencyKey,
    payload: triggerPayload,
    status: 'received',
    run_id: runId,
  } as unknown as never);

  if (eventError && (eventError as any).code === '23505') {
    // Race condition caught by unique index
    const { data: raceEvent } = await supabase
      .from('trigger_events')
      .select('run_id')
      .eq('workspace_id', workspaceId)
      .eq('idempotency_key', idempotencyKey)
      .single();

    return {
      runId: (raceEvent as any)?.run_id || runId,
      isDuplicate: true,
      status: 'queued',
    };
  }

  // 3. Insert Workflow Run Record
  const { error: runInsertError } = await supabase.from('workflow_runs').insert({
    id: runId,
    workspace_id: workspaceId,
    workflow_id: workflowId,
    workflow_version_id: versionId,
    trigger_type: triggerType,
    trigger_payload: triggerPayload,
    idempotency_key: idempotencyKey,
    status: 'queued',
    parent_run_id: parentRunId || null,
  } as unknown as never);

  if (runInsertError) {
    await supabase
      .from('trigger_events')
      .update({ status: 'failed' } as unknown as never)
      .eq('id', eventId);

    throw new Error(`Failed to initialize workflow run: ${runInsertError.message}`);
  }

  // 4. Dispatch to Inngest Event Bus
  let inngestDispatched = false;
  try {
    await inngest.send({
      name: 'workflow.execute',
      data: {
        runId,
        workspaceId,
        workflowId,
        versionId,
        triggerPayload,
      },
    });
    inngestDispatched = true;

    await supabase
      .from('trigger_events')
      .update({ status: 'dispatched' } as unknown as never)
      .eq('id', eventId);
  } catch (inngestErr: unknown) {
    console.warn('Inngest dispatch warning (falling back to direct async runner):', inngestErr);
  }

  // 5. Recovery / Direct Async Fallback:
  // If Inngest is not running locally or fails dispatch, execute immediately in background
  if (!inngestDispatched) {
    // Run asynchronously without blocking HTTP response
    (async () => {
      try {
        const { data: versionData } = await supabase
          .from('workflow_versions')
          .select('compiled_graph')
          .eq('id', versionId)
          .single();

        if (versionData) {
          const compiledGraph = (versionData as unknown as WorkflowVersionRecord).compiled_graph;
          await executeWorkflowSnapshot(
            runId,
            workspaceId,
            workflowId,
            versionId,
            compiledGraph as CompiledWorkflowGraph,
            triggerPayload
          );
        }
      } catch (err: unknown) {
        console.error('Direct async workflow runner error:', err);
      }
    })();
  }

  return {
    runId,
    isDuplicate: false,
    status: 'queued',
  };
}
