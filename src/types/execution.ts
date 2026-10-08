import type { Json } from './database';
import type { WorkflowRecord, WorkflowVersionRecord, WorkflowNodeType } from './workflow';

export type WorkflowRunStatus =
  | 'queued'
  | 'running'
  | 'waiting'
  | 'succeeded'
  | 'failed'
  | 'canceled';

export type WorkflowStepRunStatus =
  | 'pending'
  | 'running'
  | 'waiting'
  | 'succeeded'
  | 'failed'
  | 'skipped';

export interface WorkflowRunRecord {
  id: string;
  workspace_id: string;
  workflow_id: string;
  workflow_version_id: string;
  trigger_type: 'manual' | 'webhook';
  trigger_payload: Record<string, any>;
  idempotency_key: string | null;
  status: WorkflowRunStatus;
  error_message: string | null;
  parent_run_id: string | null;
  started_at: string | null;
  finished_at: string | null;
  created_at: string;
  updated_at: string;
  workflow?: WorkflowRecord;
  version?: WorkflowVersionRecord;
  step_runs?: WorkflowStepRunRecord[];
}

export interface WorkflowStepRunRecord {
  id: string;
  run_id: string;
  workspace_id: string;
  node_id: string;
  node_type: WorkflowNodeType | string;
  node_title: string;
  status: WorkflowStepRunStatus;
  input_data: Record<string, any> | null;
  output_data: Record<string, any> | null;
  error_message: string | null;
  retry_count: number;
  duration_ms: number | null;
  started_at: string | null;
  finished_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface TriggerEventRecord {
  id: string;
  workspace_id: string;
  workflow_id: string | null;
  event_type: 'workflow.manual' | 'workflow.webhook';
  idempotency_key: string;
  payload: Record<string, any>;
  status: 'received' | 'dispatched' | 'failed';
  run_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface ExecutionContext {
  runId: string;
  workspaceId: string;
  workflowId: string;
  versionId: string;
  triggerPayload: Record<string, any>;
  nodeOutputs: Record<string, any>; // node_id -> output payload
  activeBranch: Record<string, boolean>; // condition node_id -> boolean outcome
}

export interface ExecutionLimits {
  maxNodes: number;
  maxExecutionDurationSeconds: number;
  maxPayloadSizeBytes: number;
  maxRetries: number;
}

export const DEFAULT_EXECUTION_LIMITS: ExecutionLimits = {
  maxNodes: 50,
  maxExecutionDurationSeconds: 300,
  maxPayloadSizeBytes: 1024 * 1024, // 1MB
  maxRetries: 3,
};
