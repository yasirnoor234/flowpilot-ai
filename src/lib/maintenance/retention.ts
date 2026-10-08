import { createAdminClient } from '@/lib/supabase/server';

export interface RetentionPolicy {
  retentionDays: number;
  workspaceId?: string;
  dryRun?: boolean;
}

export interface RetentionPruneResult {
  success: boolean;
  prunedRuns: number;
  prunedStepRuns: number;
  prunedTriggerEvents: number;
  durationMs: number;
  timestamp: string;
}

/**
 * Prunes execution logs, step records, and trigger payloads older than the specified retention window.
 * Complies with enterprise data minimization and privacy policies.
 */
export async function pruneExecutionLogs(
  policy: RetentionPolicy = { retentionDays: 30, dryRun: false }
): Promise<RetentionPruneResult> {
  const startTime = Date.now();
  const supabase = createAdminClient();
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - policy.retentionDays);
  const cutoffIso = cutoffDate.toISOString();

  let prunedRuns = 0;
  let prunedStepRuns = 0;
  let prunedTriggerEvents = 0;

  try {
    // 1. Identify runs to prune
    let runsQuery = supabase
      .from('workflow_runs')
      .select('id, workspace_id')
      .lt('created_at', cutoffIso)
      .in('status', ['succeeded', 'failed', 'canceled']);

    if (policy.workspaceId) {
      runsQuery = runsQuery.eq('workspace_id', policy.workspaceId);
    }

    const { data: runsToPrune, error: runsFetchError } = await runsQuery;

    if (runsFetchError) {
      throw new Error(`Failed to query runs for pruning: ${runsFetchError.message}`);
    }

    const runIds = ((runsToPrune as any[]) || []).map((r) => r.id);

    if (runIds.length > 0 && !policy.dryRun) {
      // 2. Delete associated step runs
      const { error: stepDeleteError, count: stepCount } = await supabase
        .from('workflow_step_runs')
        .delete({ count: 'exact' })
        .in('run_id', runIds);

      if (!stepDeleteError) {
        prunedStepRuns = stepCount || 0;
      }

      // 3. Delete the workflow runs
      const { error: runDeleteError, count: runCount } = await supabase
        .from('workflow_runs')
        .delete({ count: 'exact' })
        .in('id', runIds);

      if (!runDeleteError) {
        prunedRuns = runCount || 0;
      }
    } else {
      prunedRuns = runIds.length;
    }

    // 4. Clean up old processed trigger events
    let triggerQuery = supabase
      .from('trigger_events')
      .delete({ count: 'exact' })
      .lt('created_at', cutoffIso)
      .eq('status', 'processed');

    if (policy.workspaceId) {
      triggerQuery = triggerQuery.eq('workspace_id', policy.workspaceId);
    }

    if (!policy.dryRun) {
      const { error: triggerError, count: triggerCount } = await triggerQuery;
      if (!triggerError) {
        prunedTriggerEvents = triggerCount || 0;
      }
    }

    return {
      success: true,
      prunedRuns,
      prunedStepRuns,
      prunedTriggerEvents,
      durationMs: Date.now() - startTime,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Error during execution log retention cleanup:', error);
    return {
      success: false,
      prunedRuns: 0,
      prunedStepRuns: 0,
      prunedTriggerEvents: 0,
      durationMs: Date.now() - startTime,
      timestamp: new Date().toISOString(),
    };
  }
}
