import type { WorkflowGraph } from '@/types/workflow';

export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  graph: WorkflowGraph;
}

export const WORKFLOW_TEMPLATES: WorkflowTemplate[] = [
  {
    id: 'primary-mvp-lead-pipeline',
    name: 'Primary MVP: Autonomous Lead Pipeline',
    description:
      'Inbound Webhook → AI Qualification (GPT-4o) → CRM Upsert → Personalized Email → Slack Alert → 48h Delay → Conditional Follow-up.',
    category: 'Sales Automation',
    graph: {
      nodes: [
        {
          id: 'node_trigger_webhook',
          type: 'trigger_webhook',
          title: 'Inbound Webhook Trigger',
          schema_version: 1,
          config: {
            path_slug: 'inbound-lead',
            http_method: 'POST',
            expected_fields: ['email', 'first_name', 'company', 'budget', 'message'],
          },
        },
        {
          id: 'node_ai_qualify',
          type: 'action_ai_qualify',
          title: 'AI Lead Qualification (GPT-4o)',
          schema_version: 1,
          config: {
            model: 'gpt-4o-mini',
            prompt_template:
              'Evaluate the inbound lead payload: {{trigger.message}} with budget: {{trigger.budget}}. Return structured qualification_score (0-100), lead_tier (hot/warm/cold), and reasoning.',
            temperature: 0.2,
            output_format: 'structured_json',
            target_fields: ['qualification_score', 'lead_tier', 'reasoning', 'recommended_action'],
          },
        },
        {
          id: 'node_crm_upsert',
          type: 'action_crm_upsert',
          title: 'Sync to Built-in CRM',
          schema_version: 1,
          config: {
            email_field: '{{trigger.email}}',
            first_name_field: '{{trigger.first_name}}',
            company_field: '{{trigger.company}}',
            status: 'qualified',
            tags: ['inbound-web', 'ai-evaluated'],
          },
        },
        {
          id: 'node_send_email',
          type: 'action_send_email',
          title: 'Send Instant Auto-Reply',
          schema_version: 1,
          config: {
            to: '{{trigger.email}}',
            subject: 'Thank you for reaching out to us!',
            body_markdown:
              'Hi {{trigger.first_name}},\n\nThanks for your interest! Our team has received your request regarding {{trigger.company}}.\n\nWe will follow up shortly.',
            from_name: 'FlowPilot Automation',
          },
        },
        {
          id: 'node_slack_notify',
          type: 'action_slack_notify',
          title: 'Notify Sales Team on Slack',
          schema_version: 1,
          config: {
            channel_name: '#leads-alerts',
            message_template:
              '🚀 *New Lead Ingested*\n• *Name:* {{trigger.first_name}}\n• *Company:* {{trigger.company}}\n• *AI Score:* {{ai_qualify.qualification_score}}\n• *Tier:* {{ai_qualify.lead_tier}}',
            include_lead_summary: true,
          },
        },
        {
          id: 'node_delay',
          type: 'action_delay',
          title: 'Durable Follow-up Wait',
          schema_version: 1,
          config: {
            duration: 48,
            unit: 'hours',
          },
        },
        {
          id: 'node_condition_check',
          type: 'condition_if_else',
          title: 'Check Lead Status',
          schema_version: 1,
          config: {
            field_path: 'ai_qualify.lead_tier',
            operator: 'equals',
            compare_value: 'hot',
          },
        },
        {
          id: 'node_vip_followup',
          type: 'action_send_email',
          title: 'VIP Touchpoint Email',
          schema_version: 1,
          config: {
            to: '{{trigger.email}}',
            subject: 'Exclusive Consultation for {{trigger.company}}',
            body_markdown: 'Hi {{trigger.first_name}},\n\nWanted to check in and see if you had 10 minutes to discuss your project.',
            from_name: 'Executive Sales Team',
          },
        },
        {
          id: 'node_standard_followup',
          type: 'action_send_email',
          title: 'Standard Follow-up Email',
          schema_version: 1,
          config: {
            to: '{{trigger.email}}',
            subject: 'Helpful resources for your business',
            body_markdown: 'Hi {{trigger.first_name}},\n\nSharing some case studies that might be relevant.',
            from_name: 'Support Team',
          },
        },
      ],
      edges: [
        {
          id: 'e1',
          source: 'node_trigger_webhook',
          target: 'node_ai_qualify',
        },
        {
          id: 'e2',
          source: 'node_ai_qualify',
          target: 'node_crm_upsert',
        },
        {
          id: 'e3',
          source: 'node_crm_upsert',
          target: 'node_send_email',
        },
        {
          id: 'e4',
          source: 'node_send_email',
          target: 'node_slack_notify',
        },
        {
          id: 'e5',
          source: 'node_slack_notify',
          target: 'node_delay',
        },
        {
          id: 'e6',
          source: 'node_delay',
          target: 'node_condition_check',
        },
        {
          id: 'e7_true',
          source: 'node_condition_check',
          target: 'node_vip_followup',
          source_handle: 'true',
        },
        {
          id: 'e8_false',
          source: 'node_condition_check',
          target: 'node_standard_followup',
          source_handle: 'false',
        },
      ],
    },
  },
  {
    id: 'simple-manual-lead-responder',
    name: 'Manual Test: Instant Lead Responder',
    description: 'Manual Trigger → Field Mapping → Resend Email → Slack Notification.',
    category: 'Testing & Development',
    graph: {
      nodes: [
        {
          id: 'node_manual_trigger',
          type: 'trigger_manual',
          title: 'Manual Test Trigger',
          schema_version: 1,
          config: {
            sample_payload: {
              email: 'test@example.com',
              first_name: 'Sam',
              company: 'Beta Industries',
            },
          },
        },
        {
          id: 'node_field_mapping',
          type: 'action_field_mapping',
          title: 'Map Response Fields',
          schema_version: 1,
          config: {
            mappings: [
              { source_field: 'trigger.email', target_field: 'recipient_email' },
              { source_field: 'trigger.first_name', target_field: 'contact_name' },
            ],
          },
        },
        {
          id: 'node_email',
          type: 'action_send_email',
          title: 'Send Confirmation Email',
          schema_version: 1,
          config: {
            to: '{{trigger.email}}',
            subject: 'Test Workflow Dispatched',
            body_markdown: 'Hello {{trigger.first_name}}, this is a test notification from FlowPilot AI.',
          },
        },
      ],
      edges: [
        { id: 'e1', source: 'node_manual_trigger', target: 'node_field_mapping' },
        { id: 'e2', source: 'node_field_mapping', target: 'node_email' },
      ],
    },
  },
];
