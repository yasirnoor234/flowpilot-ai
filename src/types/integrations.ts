export type IntegrationProvider = 'resend' | 'slack' | 'openai' | 'webhook' | 'custom';

export type IntegrationStatus = 'unconfigured' | 'configured' | 'active' | 'error' | 'disabled';

export interface IntegrationConnectionRecord {
  id: string;
  workspace_id: string;
  provider: IntegrationProvider;
  name: string;
  status: IntegrationStatus;
  encrypted_credentials?: string;
  masked_key?: string;
  settings: Record<string, any>;
  is_active: boolean;
  last_tested_at: string | null;
  last_error: string | null;
  created_at: string;
  updated_at: string;
}

export type ActionAttemptStatus = 'pending' | 'submitted' | 'delivered' | 'failed' | 'simulated';

export interface IntegrationActionAttemptRecord {
  id: string;
  workspace_id: string;
  connection_id: string | null;
  action_type: 'email_send' | 'slack_notify' | 'ai_qualify' | 'webhook_dispatch';
  workflow_run_id: string | null;
  workflow_step_id: string | null;
  idempotency_key: string | null;
  status: ActionAttemptStatus;
  provider_message_id: string | null;
  recipient_or_target: string | null;
  payload_summary: Record<string, any>;
  error_message: string | null;
  latency_ms: number | null;
  created_at: string;
  updated_at: string;
}

export interface SendEmailInput {
  workspaceId: string;
  to: string;
  subject: string;
  html?: string;
  text?: string;
  from?: string;
  idempotencyKey?: string;
  workflowRunId?: string;
  workflowStepId?: string;
  isDemoMode?: boolean;
}

export interface SendEmailResult {
  success: boolean;
  messageId?: string;
  status: ActionAttemptStatus;
  isSimulated?: boolean;
  error?: string;
  latencyMs?: number;
}

export interface SendSlackNotificationInput {
  workspaceId: string;
  text: string;
  blocks?: any[];
  attachments?: any[];
  channelOverride?: string;
  idempotencyKey?: string;
  workflowRunId?: string;
  workflowStepId?: string;
  leadContext?: {
    id: string;
    name: string;
    company?: string | null;
    qualificationScore?: number | null;
    leadTier?: string | null;
    summary?: string | null;
  };
  isDemoMode?: boolean;
}

export interface SendSlackNotificationResult {
  success: boolean;
  status: ActionAttemptStatus;
  isSimulated?: boolean;
  error?: string;
  latencyMs?: number;
}
