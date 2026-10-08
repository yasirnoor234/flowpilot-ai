import { inngest } from '../client';
import { createAdminClient } from '@/lib/supabase/server';
import { executeWorkflowSnapshot } from '@/lib/workflow/executor/workflow-engine';
import type { CompiledWorkflowGraph, WorkflowRecord, WorkflowVersionRecord } from '@/types/workflow';

export const workflowExecutor = inngest.createFunction(
  {
    id: 'workflow-durable-executor',
    name: 'Workflow Durable Snapshot Executor',
    retries: 3,
  },
  { event: 'workflow.execute' },
  async ({ event, step }) => {
    const { runId, workspaceId, workflowId, versionId, triggerPayload } = event.data;

    // 1. Step: Fetch and verify immutable version & run state
    const versionSnapshot = await step.run('fetch-version-snapshot', async () => {
      const supabase = createAdminClient();

      const { data: run, error: runError } = await supabase
        .from('workflow_runs')
        .select('*')
        .eq('id', runId)
        .single();

      if (runError || !run) {
        throw new Error(`Execution run ${runId} not found.`);
      }

      const { data: version, error: verError } = await supabase
        .from('workflow_versions')
        .select('*')
        .eq('id', versionId)
        .single();

      if (verError || !version) {
        throw new Error(`Immutable workflow version ${versionId} not found.`);
      }

      return (version as unknown as WorkflowVersionRecord).compiled_graph;
    });

    // 2. Step: Run the snapshot through the execution engine with Inngest durable delay hook
    const result = await executeWorkflowSnapshot(
      runId,
      workspaceId,
      workflowId,
      versionId,
      versionSnapshot as CompiledWorkflowGraph,
      triggerPayload || {},
      {
        checkCanceled: async () => {
          const supabase = createAdminClient();
          const { data } = await supabase
            .from('workflow_runs')
            .select('status')
            .eq('id', runId)
            .single();
          return (data as unknown as { status: string } | null)?.status === 'canceled';
        },
        onDelay: async (nodeId, delaySeconds) => {
          // Update run status to waiting
          const supabase = createAdminClient();
          await supabase
            .from('workflow_runs')
            .update({
              status: 'waiting',
              updated_at: new Date().toISOString(),
            } as unknown as never)
            .eq('id', runId);

          // Inngest durable sleep (no HTTP / CPU consumed during sleep)
          await step.sleep(`delay-node-${nodeId}`, `${delaySeconds}s`);

          // Restore run status to running
          await supabase
            .from('workflow_runs')
            .update({
              status: 'running',
              updated_at: new Date().toISOString(),
            } as unknown as never)
            .eq('id', runId);
        },
      }
    );

    return result;
  }
);
