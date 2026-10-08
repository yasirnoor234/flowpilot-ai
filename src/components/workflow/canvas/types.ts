import type { Node, Edge } from '@xyflow/react';
import type { WorkflowNode, WorkflowNodeType, WorkflowEdge } from '@/types/workflow';
import type { WorkflowStepRunStatus } from '@/types/execution';

export interface WorkflowNodeData extends Record<string, unknown> {
  nodeId: string;
  type: WorkflowNodeType;
  title: string;
  config: Record<string, any>;
  hasErrors?: boolean;
  errorMessages?: string[];
  executionStatus?: WorkflowStepRunStatus;
  executionDurationMs?: number;
  isSelected?: boolean;
  onSelectNode?: (nodeId: string) => void;
  onDeleteNode?: (nodeId: string) => void;
  onDuplicateNode?: (nodeId: string) => void;
  onOpenConfig?: (nodeId: string) => void;
  hasValidationError?: boolean;
  validationErrorMessage?: string;
}

export type ReactFlowWorkflowNode = Node<WorkflowNodeData>;
export type ReactFlowWorkflowEdge = Edge;

export interface NodePaletteItem {
  type: WorkflowNodeType;
  title: string;
  category: 'trigger' | 'logic' | 'ai' | 'integration';
  description: string;
  iconName: string;
  defaultConfig: Record<string, any>;
}

export const PALETTE_CATEGORIES = [
  { id: 'trigger', label: 'Triggers', description: 'Events that start the workflow' },
  { id: 'logic', label: 'Logic & Control', description: 'Transformations, branching & delays' },
  { id: 'ai', label: 'AI Automation', description: 'LLM reasoning & scoring' },
  { id: 'integration', label: 'Integrations', description: 'External actions & notifications' },
] as const;

export const PALETTE_ITEMS: NodePaletteItem[] = [
  // Triggers
  {
    type: 'trigger_manual',
    title: 'Manual Trigger',
    category: 'trigger',
    description: 'Trigger workflow manually or for test runs with sample payload',
    iconName: 'Play',
    defaultConfig: {
      description: 'Manual dashboard test trigger',
      sample_payload: {
        email: 'alex@example.com',
        first_name: 'Alex',
        company: 'Acme Corp',
        budget: '$25,000',
        message: 'Interested in automation consulting',
      },
    },
  },
  {
    type: 'trigger_webhook',
    title: 'Webhook Trigger',
    category: 'trigger',
    description: 'Receive real-time lead submissions from webhooks & forms',
    iconName: 'Webhook',
    defaultConfig: {
      path_slug: 'lead-intake',
      http_method: 'POST',
      expected_fields: ['email', 'first_name', 'company', 'budget', 'message'],
    },
  },

  // Logic
  {
    type: 'action_field_mapping',
    title: 'Field Mapping',
    category: 'logic',
    description: 'Extract and transform nested payload data into clean keys',
    iconName: 'Sliders',
    defaultConfig: {
      mappings: [
        { source_field: 'trigger.email', target_field: 'lead_email' },
        { source_field: 'trigger.company', target_field: 'company_name' },
      ],
    },
  },
  {
    type: 'condition_if_else',
    title: 'IF / ELSE Branch',
    category: 'logic',
    description: 'Route execution down TRUE or FALSE branches based on rules',
    iconName: 'GitFork',
    defaultConfig: {
      field_path: 'ai_qualify.lead_tier',
      operator: 'equals',
      compare_value: 'hot',
    },
  },
  {
    type: 'action_delay',
    title: 'Durable Delay',
    category: 'logic',
    description: 'Pause execution reliably for minutes, hours, or days',
    iconName: 'Clock',
    defaultConfig: {
      duration: 24,
      unit: 'hours',
    },
  },

  // AI
  {
    type: 'action_ai_qualify',
    title: 'AI Lead Qualification',
    category: 'ai',
    description: 'Evaluate intent, calculate score (0-100), and categorize tier',
    iconName: 'Bot',
    defaultConfig: {
      model: 'gpt-4o-mini',
      prompt_template: 'Analyze lead from {{trigger.company}} with budget {{trigger.budget}} and message: {{trigger.message}}',
      temperature: 0.2,
      output_format: 'structured_json',
      target_fields: ['qualification_score', 'lead_tier', 'reasoning', 'recommended_action'],
    },
  },

  // Integrations
  {
    type: 'action_crm_upsert',
    title: 'CRM Lead Upsert',
    category: 'integration',
    description: 'Create or update lead record with AI score and custom tags',
    iconName: 'Database',
    defaultConfig: {
      email_field: '{{trigger.email}}',
      first_name_field: '{{trigger.first_name}}',
      company_field: '{{trigger.company}}',
      status: 'new',
      tags: ['ai-qualified', 'mvp-flow'],
    },
  },
  {
    type: 'action_send_email',
    title: 'Send Email (Resend)',
    category: 'integration',
    description: 'Dispatch personalized transactional email response',
    iconName: 'Mail',
    defaultConfig: {
      to: '{{trigger.email}}',
      subject: 'Thank you for reaching out, {{trigger.first_name}}!',
      body_markdown: 'Hi {{trigger.first_name}},\n\nWe received your inquiry regarding {{trigger.company}}. Our team will follow up promptly.\n\nBest regards,\nFlowPilot AI',
      from_name: 'FlowPilot Automation',
    },
  },
  {
    type: 'action_slack_notify',
    title: 'Slack Notification',
    category: 'integration',
    description: 'Post real-time team alerts to Slack sales/ops channels',
    iconName: 'MessageSquare',
    defaultConfig: {
      channel_name: '#sales-leads',
      message_template: '🚨 *New Lead Qualified*: {{trigger.first_name}} from *{{trigger.company}}* (Tier: `{{ai_qualify.lead_tier}}`, Score: `{{ai_qualify.qualification_score}}`)',
      include_lead_summary: true,
    },
  },
];
