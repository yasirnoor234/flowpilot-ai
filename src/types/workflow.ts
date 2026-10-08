import { z } from 'zod';

// -----------------------------------------------------------------------------
// 1. Node Types Enumeration
// -----------------------------------------------------------------------------
export const WORKFLOW_NODE_TYPES = [
  'trigger_manual',
  'trigger_webhook',
  'action_field_mapping',
  'condition_if_else',
  'action_crm_upsert',
  'action_ai_qualify',
  'action_send_email',
  'action_slack_notify',
  'action_delay',
] as const;

export type WorkflowNodeType = (typeof WORKFLOW_NODE_TYPES)[number];

export const WORKFLOW_STATUSES = ['draft', 'active', 'inactive', 'archived'] as const;
export type WorkflowStatus = (typeof WORKFLOW_STATUSES)[number];

// -----------------------------------------------------------------------------
// 2. Individual Node Configuration Schemas (Zod)
// -----------------------------------------------------------------------------

// 1. Manual Trigger
export const manualTriggerConfigSchema = z.object({
  description: z.string().optional(),
  sample_payload: z.record(z.string(), z.any()).default({
    email: 'alex@example.com',
    first_name: 'Alex',
    company: 'Acme Corp',
    budget: '$15,000',
    timeline: 'Immediate',
  }),
});
export type ManualTriggerConfig = z.infer<typeof manualTriggerConfigSchema>;

// 2. Webhook Trigger
export const webhookTriggerConfigSchema = z.object({
  path_slug: z.string().min(1, 'Webhook slug is required').regex(/^[a-z0-9-_]+$/, 'Slug must be alphanumeric with hyphens'),
  http_method: z.enum(['POST', 'GET']).default('POST'),
  secret_token: z.string().optional(),
  expected_fields: z.array(z.string()).default(['email', 'name', 'message']),
});
export type WebhookTriggerConfig = z.infer<typeof webhookTriggerConfigSchema>;

// 3. Field Mapping Action
export const fieldMappingItemSchema = z.object({
  source_field: z.string().min(1, 'Source field path is required'),
  target_field: z.string().min(1, 'Target field key is required'),
  fallback_value: z.any().optional(),
});

export const fieldMappingConfigSchema = z.object({
  mappings: z.array(fieldMappingItemSchema).min(1, 'At least one field mapping is required'),
});
export type FieldMappingConfig = z.infer<typeof fieldMappingConfigSchema>;

// 4. IF/ELSE Condition
export const conditionOperatorSchema = z.enum([
  'equals',
  'not_equals',
  'greater_than',
  'less_than',
  'contains',
  'starts_with',
  'exists',
  'is_empty',
]);
export type ConditionOperator = z.infer<typeof conditionOperatorSchema>;

export const ifElseConditionConfigSchema = z.object({
  field_path: z.string().min(1, 'Field path is required (e.g. ai_qualify.score or trigger.email)'),
  operator: conditionOperatorSchema,
  compare_value: z.string().optional().default(''),
});
export type IfElseConditionConfig = z.infer<typeof ifElseConditionConfigSchema>;

// 5. CRM Upsert Action
export const crmUpsertConfigSchema = z.object({
  email_field: z.string().min(1, 'Email field reference is required'),
  first_name_field: z.string().optional(),
  last_name_field: z.string().optional(),
  phone_field: z.string().optional(),
  company_field: z.string().optional(),
  status: z.enum(['new', 'contacted', 'qualified', 'unqualified', 'converted']).default('new'),
  tags: z.array(z.string()).default([]),
  custom_attributes: z.record(z.string(), z.string()).optional().default({}),
});
export type CrmUpsertConfig = z.infer<typeof crmUpsertConfigSchema>;

// 6. AI Qualification Action
export const aiQualifyConfigSchema = z.object({
  model: z.enum(['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo']).default('gpt-4o-mini'),
  prompt_template: z.string().min(10, 'Prompt template must be at least 10 characters long'),
  temperature: z.number().min(0).max(1).default(0.2),
  output_format: z.enum(['structured_json', 'boolean_decision']).default('structured_json'),
  target_fields: z.array(z.string()).default(['qualification_score', 'lead_tier', 'reasoning', 'recommended_action']),
});
export type AiQualifyConfig = z.infer<typeof aiQualifyConfigSchema>;

// 7. Email Send Action (Resend)
export const sendEmailConfigSchema = z.object({
  to: z.string().min(1, 'Recipient address or template tag (e.g. {{trigger.email}}) is required'),
  subject: z.string().min(1, 'Subject line is required'),
  body_markdown: z.string().min(1, 'Email body is required'),
  reply_to: z.string().optional(),
  from_name: z.string().optional().default('FlowPilot Automation'),
});
export type SendEmailConfig = z.infer<typeof sendEmailConfigSchema>;

// 8. Slack Notification Action
export const slackNotifyConfigSchema = z.object({
  webhook_url: z.string().url().optional().or(z.literal('')), // Optional when workspace integration preset is used
  channel_name: z.string().optional().default('#general'),
  message_template: z.string().min(1, 'Message template is required'),
  include_lead_summary: z.boolean().default(true),
});
export type SlackNotifyConfig = z.infer<typeof slackNotifyConfigSchema>;

// 9. Durable Delay Action (Inngest)
export const delayConfigSchema = z.object({
  duration: z.number().int().positive('Duration must be a positive integer'),
  unit: z.enum(['seconds', 'minutes', 'hours', 'days']).default('hours'),
});
export type DelayConfig = z.infer<typeof delayConfigSchema>;

// -----------------------------------------------------------------------------
// 3. Union Node Config Schema
// -----------------------------------------------------------------------------
export const nodeConfigSchemas = {
  trigger_manual: manualTriggerConfigSchema,
  trigger_webhook: webhookTriggerConfigSchema,
  action_field_mapping: fieldMappingConfigSchema,
  condition_if_else: ifElseConditionConfigSchema,
  action_crm_upsert: crmUpsertConfigSchema,
  action_ai_qualify: aiQualifyConfigSchema,
  action_send_email: sendEmailConfigSchema,
  action_slack_notify: slackNotifyConfigSchema,
  action_delay: delayConfigSchema,
};

export type AnyNodeConfig =
  | ManualTriggerConfig
  | WebhookTriggerConfig
  | FieldMappingConfig
  | IfElseConditionConfig
  | CrmUpsertConfig
  | AiQualifyConfig
  | SendEmailConfig
  | SlackNotifyConfig
  | DelayConfig;

// -----------------------------------------------------------------------------
// 4. Workflow Node & Edge Schemas
// -----------------------------------------------------------------------------
export const workflowNodeSchema = z.object({
  id: z.string().min(1, 'Node ID is required'),
  type: z.enum(WORKFLOW_NODE_TYPES),
  title: z.string().min(1, 'Node title is required'),
  config: z.record(z.string(), z.any()),
  schema_version: z.number().int().default(1),
  position: z
    .object({
      x: z.number(),
      y: z.number(),
    })
    .optional(),
});
export type WorkflowNode = z.infer<typeof workflowNodeSchema>;

export const branchHandleSchema = z.enum(['true', 'false']);
export type BranchHandle = z.infer<typeof branchHandleSchema>;

export const workflowEdgeSchema = z.object({
  id: z.string().min(1, 'Edge ID is required'),
  source: z.string().min(1, 'Source node ID is required'),
  target: z.string().min(1, 'Target node ID is required'),
  source_handle: branchHandleSchema.nullable().optional(),
  target_handle: z.string().nullable().optional(),
});
export type WorkflowEdge = z.infer<typeof workflowEdgeSchema>;

export const workflowGraphSchema = z.object({
  nodes: z.array(workflowNodeSchema),
  edges: z.array(workflowEdgeSchema),
  viewport: z
    .object({
      x: z.number(),
      y: z.number(),
      zoom: z.number(),
    })
    .optional(),
});
export type WorkflowGraph = z.infer<typeof workflowGraphSchema>;

// -----------------------------------------------------------------------------
// 5. Compiled Immutable Graph Definition
// -----------------------------------------------------------------------------
export interface CompiledWorkflowGraph {
  trigger_node_id: string;
  trigger_type: 'trigger_manual' | 'trigger_webhook';
  nodes: Record<string, WorkflowNode>;
  edges: WorkflowEdge[];
  execution_order: string[];
  branch_map: Record<string, { true_target?: string; false_target?: string }>;
  ancestor_map: Record<string, string[]>; // Node ID -> list of upstream ancestor node IDs
  compiled_at: string;
}

// -----------------------------------------------------------------------------
// 6. Workflow & Version Database Entities
// -----------------------------------------------------------------------------
export interface WorkflowRecord {
  id: string;
  workspace_id: string;
  name: string;
  description: string | null;
  status: WorkflowStatus;
  webhook_slug: string | null;
  draft_graph: WorkflowGraph;
  active_version_id: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  active_version?: WorkflowVersionRecord | null;
}

export interface WorkflowVersionRecord {
  id: string;
  workspace_id: string;
  workflow_id: string;
  version_number: number;
  compiled_graph: CompiledWorkflowGraph;
  raw_graph: WorkflowGraph;
  change_summary: string | null;
  published_by: string | null;
  published_at: string;
}
