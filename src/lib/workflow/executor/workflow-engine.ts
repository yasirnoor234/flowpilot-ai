import { createAdminClient } from '@/lib/supabase/server';
import type { CompiledWorkflowGraph, WorkflowNode } from '@/types/workflow';
import type {
  WorkflowRunRecord,
  WorkflowStepRunRecord,
  ExecutionContext,
  WorkflowRunStatus,
  WorkflowStepRunStatus,
} from '@/types/execution';
import { DEFAULT_EXECUTION_LIMITS } from '@/types/execution';
import { NODE_EXECUTORS } from './node-executors';
import { resolveConfigExpressions } from './expression-resolver';

export interface WorkflowEngineResult {
  status: WorkflowRunStatus;
  runId: string;
  error?: string;
  stepResults: Record<string, { status: WorkflowStepRunStatus; output?: any; error?: string }>;
  context: ExecutionContext;
}

export interface StepRunnerHooks {
  onStepStart?: (nodeId: string, node: WorkflowNode) => Promise<void>;
  onStepComplete?: (nodeId: string, output: any, durationMs: number) => Promise<void>;
  onStepSkipped?: (nodeId: string, reason: string) => Promise<void>;
  onStepFailed?: (nodeId: string, error: string) => Promise<void>;
  onDelay?: (nodeId: string, delaySeconds: number) => Promise<void>;
  checkCanceled?: () => Promise<boolean>;
}

/**
 * Core server-side workflow execution engine.
 * Executes a linearized DAG snapshot against immutable version graph with step memoization, safe field resolution, and cancellation checks.
 */
export async function executeWorkflowSnapshot(
  runId: string,
  workspaceId: string,
  workflowId: string,
  versionId: string,
  compiledGraph: CompiledWorkflowGraph,
  triggerPayload: Record<string, any>,
  hooks?: StepRunnerHooks,
  options: { persist?: boolean } = { persist: true }
): Promise<WorkflowEngineResult> {
  const limits = DEFAULT_EXECUTION_LIMITS;
  const executionOrder = compiledGraph.execution_order || [];
  const shouldPersist = options.persist !== false;

  // Enforce Max Node Count Limit
  if (executionOrder.length > limits.maxNodes) {
    throw new Error(`Workflow exceeds maximum limit of ${limits.maxNodes} nodes.`);
  }

  // Enforce Max Trigger Payload Size Limit (1MB)
  const payloadSize = JSON.stringify(triggerPayload || {}).length;
  if (payloadSize > limits.maxPayloadSizeBytes) {
    throw new Error(`Trigger payload exceeds maximum size limit of 1MB.`);
  }

  const context: ExecutionContext = {
    runId,
    workspaceId,
    workflowId,
    versionId,
    triggerPayload,
    nodeOutputs: {},
    activeBranch: {},
  };

  const stepResults: Record<string, { status: WorkflowStepRunStatus; output?: any; error?: string }> = {};

  // Track nodes to skip (e.g. from untaken condition branches)
  const skippedNodes = new Set<string>();

  const getSupabase = () => {
    try {
      return createAdminClient();
    } catch {
      return null;
    }
  };

  const supabase = shouldPersist ? getSupabase() : null;

  // 1. Mark run as running
  if (supabase) {
    await supabase
      .from('workflow_runs')
      .update({
        status: 'running',
        started_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as unknown as never)
      .eq('id', runId);
  }

  // 2. Iterate through execution order
  for (const nodeId of executionOrder) {
    // Check if cancellation was requested mid-flight
    const isCanceled = hooks?.checkCanceled ? await hooks.checkCanceled() : false;
    if (isCanceled) {
      if (supabase) {
        await supabase
          .from('workflow_runs')
          .update({
            status: 'canceled',
            finished_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          } as unknown as never)
          .eq('id', runId);
      }

      return {
        status: 'canceled',
        runId,
        error: 'Execution canceled by user.',
        stepResults,
        context,
      };
    }

    const node = compiledGraph.nodes[nodeId];
    if (!node) continue;

    // Check if this node is on a skipped branch
    if (skippedNodes.has(nodeId)) {
      stepResults[nodeId] = { status: 'skipped' };
      if (hooks?.onStepSkipped) {
        await hooks.onStepSkipped(nodeId, 'Alternate conditional branch');
      }

      // Persist skipped step in DB
      if (supabase) {
        await supabase.from('workflow_step_runs').insert({
          id: crypto.randomUUID(),
          run_id: runId,
          workspace_id: workspaceId,
          node_id: nodeId,
          node_type: node.type,
          node_title: node.title,
          status: 'skipped',
          error_message: 'Skipped due to condition branch',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        } as unknown as never);
      }

      continue;
    }

    // Step Execution
    const startTime = Date.now();
    if (hooks?.onStepStart) {
      await hooks.onStepStart(nodeId, node);
    }

    // Resolve inputs only from trigger and permitted upstream outputs
    const resolvedConfig = resolveConfigExpressions(node.config, context);

    const executor = NODE_EXECUTORS[node.type];
    if (!executor) {
      const errMsg = `No executor registered for node type "${node.type}".`;
      stepResults[nodeId] = { status: 'failed', error: errMsg };

      if (supabase) {
        await supabase.from('workflow_step_runs').insert({
          id: crypto.randomUUID(),
          run_id: runId,
          workspace_id: workspaceId,
          node_id: nodeId,
          node_type: node.type,
          node_title: node.title,
          status: 'failed',
          input_data: resolvedConfig,
          error_message: errMsg,
          started_at: new Date(startTime).toISOString(),
          finished_at: new Date().toISOString(),
        } as unknown as never);

        await supabase
          .from('workflow_runs')
          .update({
            status: 'failed',
            error_message: errMsg,
            finished_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          } as unknown as never)
          .eq('id', runId);
      }

      return {
        status: 'failed',
        runId,
        error: errMsg,
        stepResults,
        context,
      };
    }

    try {
      const result = await executor.execute(node, resolvedConfig, context);
      const durationMs = Date.now() - startTime;

      // Record output in context for downstream nodes
      context.nodeOutputs[nodeId] = result.output;
      // Also alias by node type name for user convenience (e.g. {{ai_qualify.score}})
      const typeAlias = node.type.replace('action_', '').replace('trigger_', '');
      context.nodeOutputs[typeAlias] = result.output;

      stepResults[nodeId] = { status: 'succeeded', output: result.output };

      if (hooks?.onStepComplete) {
        await hooks.onStepComplete(nodeId, result.output, durationMs);
      }

      // Handle Delay Node if present
      if (node.type === 'action_delay' && result.delaySeconds && result.delaySeconds > 0) {
        if (hooks?.onDelay) {
          await hooks.onDelay(nodeId, result.delaySeconds);
        }
      }

      // Handle Condition Branching: Add untaken branch nodes to skippedNodes set
      if (node.type === 'condition_if_else' && result.branchOutcome !== undefined) {
        context.activeBranch[nodeId] = result.branchOutcome;
        const branchInfo = compiledGraph.branch_map[nodeId];

        const untakenTargetId = result.branchOutcome ? branchInfo?.false_target : branchInfo?.true_target;

        if (untakenTargetId) {
          // Add untaken target and all its subtree descendants to skipped set
          const queue = [untakenTargetId];
          while (queue.length > 0) {
            const current = queue.shift()!;
            skippedNodes.add(current);
            const childEdges = (compiledGraph.edges || []).filter((e) => e.source === current);
            for (const ce of childEdges) {
              queue.push(ce.target);
            }
          }
        }
      }

      // Persist successful step run in DB
      if (supabase) {
        await supabase.from('workflow_step_runs').insert({
          id: crypto.randomUUID(),
          run_id: runId,
          workspace_id: workspaceId,
          node_id: nodeId,
          node_type: node.type,
          node_title: node.title,
          status: 'succeeded',
          input_data: resolvedConfig,
          output_data: result.output,
          duration_ms: durationMs,
          started_at: new Date(startTime).toISOString(),
          finished_at: new Date().toISOString(),
        } as unknown as never);
      }
    } catch (err: unknown) {
      const durationMs = Date.now() - startTime;
      const errorMessage = err instanceof Error ? err.message : 'Unknown execution error occurred.';

      stepResults[nodeId] = { status: 'failed', error: errorMessage };

      if (hooks?.onStepFailed) {
        await hooks.onStepFailed(nodeId, errorMessage);
      }

      // Persist failed step run in DB
      if (supabase) {
        await supabase.from('workflow_step_runs').insert({
          id: crypto.randomUUID(),
          run_id: runId,
          workspace_id: workspaceId,
          node_id: nodeId,
          node_type: node.type,
          node_title: node.title,
          status: 'failed',
          input_data: resolvedConfig,
          error_message: errorMessage,
          duration_ms: durationMs,
          started_at: new Date(startTime).toISOString(),
          finished_at: new Date().toISOString(),
        } as unknown as never);

        // Mark workflow run as failed
        await supabase
          .from('workflow_runs')
          .update({
            status: 'failed',
            error_message: errorMessage,
            finished_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          } as unknown as never)
          .eq('id', runId);
      }

      return {
        status: 'failed',
        runId,
        error: errorMessage,
        stepResults,
        context,
      };
    }
  }

  // 3. Mark run as succeeded
  if (supabase) {
    await supabase
      .from('workflow_runs')
      .update({
        status: 'succeeded',
        finished_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as unknown as never)
      .eq('id', runId);
  }

  return {
    status: 'succeeded',
    runId,
    stepResults,
    context,
  };
}
