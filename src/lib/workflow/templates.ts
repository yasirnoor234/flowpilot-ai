import type { WorkflowGraph, WorkflowNode, WorkflowEdge } from '@/types/workflow';

export interface WorkflowTemplate {
  id: string;
  name: string;
  category: 'Lead Capture' | 'Customer Support' | 'Sales Pipeline';
  description: string;
  icon: string;
  tags: string[];
  requiredConnections: ('openai' | 'resend' | 'slack')[];
  graph: WorkflowGraph;
  graphData?: WorkflowGraph;
}

export const WORKFLOW_TEMPLATES: WorkflowTemplate[] = [
  // ---------------------------------------------------------------------------
  // 1. Lead Qualification and Instant Response
  // ---------------------------------------------------------------------------
  {
    id: 'lead-qualification-and-response',
    name: 'Lead Qualification & Automated Response',
    category: 'Lead Capture',
    description:
      'Ingests inbound leads via webhook, performs GPT-4o qualification scoring, synchronizes CRM, routes Slack alerts, dispatches confirmation email, and schedules a 24-hr follow-up with state re-reading.',
    icon: 'Sparkles',
    tags: ['Webhook', 'OpenAI', 'CRM', 'Resend', 'Slack', 'Delay'],
    requiredConnections: ['openai', 'resend', 'slack'],
    graph: {
      nodes: [
        {
          id: 'node-trigger',
          type: 'trigger_webhook',
          title: 'Inbound Lead Webhook',
          schema_version: 1,
          position: { x: 100, y: 150 },
          config: {
            method: 'POST',
            path_slug: 'inbound-lead-intake',
          },
        },
        {
          id: 'node-ai-qualify',
          type: 'action_ai_qualify',
          title: 'AI Lead Qualification',
          schema_version: 1,
          position: { x: 400, y: 150 },
          config: {
            model: 'gpt-4o-mini',
            prompt_template: '{{trigger.message}}',
            temperature: 0.1,
          },
        },
        {
          id: 'node-crm-upsert',
          type: 'action_crm_upsert',
          title: 'Sync Built-in CRM Record',
          schema_version: 1,
          position: { x: 700, y: 150 },
          config: {
            email_field: '{{trigger.email}}',
            first_name_field: '{{trigger.name}}',
            company_field: '{{trigger.company}}',
            status: 'new',
            tags: ['inbound-lead', 'ai-scored'],
          },
        },
        {
          id: 'node-condition-tier',
          type: 'condition_if_else',
          title: 'Is Hot Lead?',
          schema_version: 1,
          position: { x: 1000, y: 150 },
          config: {
            field_path: 'ai_qualify.lead_tier',
            operator: 'equals',
            compare_value: 'hot',
          },
        },
        {
          id: 'node-slack-alert',
          type: 'action_slack_notify',
          title: 'Priority Slack Alert',
          schema_version: 1,
          position: { x: 1300, y: 50 },
          config: {
            channel_name: '#hot-leads-vip',
            message_template: '🚨 Priority Inbound Lead: {{trigger.name}} from {{trigger.company}} (Score: {{ai_qualify.qualification_score}})',
          },
        },
        {
          id: 'node-send-email',
          type: 'action_send_email',
          title: 'Send Instant Welcome Email',
          schema_version: 1,
          position: { x: 1300, y: 250 },
          config: {
            to: '{{trigger.email}}',
            subject: 'Thank you for contacting FlowPilot AI',
            body_markdown: '<p>Hi {{trigger.name}},</p><p>We received your inquiry regarding <strong>{{trigger.service_interest}}</strong> and our solutions architect will review your project requirements shortly.</p>',
            from_name: 'FlowPilot Solutions Team',
          },
        },
        {
          id: 'node-delay-followup',
          type: 'action_delay',
          title: '24-Hour Follow-up Timer',
          schema_version: 1,
          position: { x: 1600, y: 150 },
          config: {
            duration: 24,
            unit: 'hours',
            follow_up_eligibility_check: true,
          },
        },
        {
          id: 'node-internal-reminder',
          type: 'action_slack_notify',
          title: 'Internal Follow-up Check',
          schema_version: 1,
          position: { x: 1900, y: 150 },
          config: {
            channel_name: '#leads-notifications',
            message_template: '⏰ Follow-up reminder for lead: {{trigger.name}} (Status: Check CRM for response)',
          },
        },
      ],
      edges: [
        { id: 'e1', source: 'node-trigger', target: 'node-ai-qualify' },
        { id: 'e2', source: 'node-ai-qualify', target: 'node-crm-upsert' },
        { id: 'e3', source: 'node-crm-upsert', target: 'node-condition-tier' },
        { id: 'e4', source: 'node-condition-tier', target: 'node-slack-alert', source_handle: 'true' },
        { id: 'e5', source: 'node-condition-tier', target: 'node-send-email', source_handle: 'false' },
        { id: 'e6', source: 'node-slack-alert', target: 'node-delay-followup' },
        { id: 'e7', source: 'node-send-email', target: 'node-delay-followup' },
        { id: 'e8', source: 'node-delay-followup', target: 'node-internal-reminder' },
      ],
    },
  },

  // ---------------------------------------------------------------------------
  // 2. Customer Inquiry Classification and Notification
  // ---------------------------------------------------------------------------
  {
    id: 'customer-inquiry-classification',
    name: 'Customer Inquiry Classification & Routing',
    category: 'Customer Support',
    description:
      'Categorizes incoming customer questions into technical, billing, or general inquiries using AI and routes notification cards to the appropriate team.',
    icon: 'MessageSquare',
    tags: ['Webhook', 'Text Classifier', 'Slack', 'CRM Note'],
    requiredConnections: ['openai', 'slack'],
    graph: {
      nodes: [
        {
          id: 'node-trigger',
          type: 'trigger_webhook',
          title: 'Support Webhook',
          schema_version: 1,
          position: { x: 100, y: 150 },
          config: {
            method: 'POST',
            path_slug: 'support-intake',
          },
        },
        {
          id: 'node-ai-classify',
          type: 'action_ai_qualify',
          title: 'Classify Inquiry Intent',
          schema_version: 1,
          position: { x: 400, y: 150 },
          config: {
            model: 'gpt-4o-mini',
            prompt_template: 'Classify the inquiry: {{trigger.message}}',
          },
        },
        {
          id: 'node-crm-note',
          type: 'action_crm_upsert',
          title: 'Log In CRM Activity',
          schema_version: 1,
          position: { x: 700, y: 150 },
          config: {
            email_field: '{{trigger.email}}',
            status: 'contacted',
            tags: ['support-ticket', 'classified'],
          },
        },
        {
          id: 'node-slack-notify',
          type: 'action_slack_notify',
          title: 'Route Team Alert',
          schema_version: 1,
          position: { x: 1000, y: 150 },
          config: {
            channel_name: '#support-queue',
            message_template: '💬 New Support Request from {{trigger.name}}: Category "{{ai_qualify.category}}"',
          },
        },
      ],
      edges: [
        { id: 'e1', source: 'node-trigger', target: 'node-ai-classify' },
        { id: 'e2', source: 'node-ai-classify', target: 'node-crm-note' },
        { id: 'e3', source: 'node-crm-note', target: 'node-slack-notify' },
      ],
    },
  },

  // ---------------------------------------------------------------------------
  // 3. Proposal Follow-up Reminder
  // ---------------------------------------------------------------------------
  {
    id: 'proposal-followup-reminder',
    name: 'Proposal Follow-up & Status Re-check',
    category: 'Sales Pipeline',
    description:
      'Waits 3 days following proposal submission, re-evaluates lead status from the CRM database, and skips follow-up if already converted or closed.',
    icon: 'Clock',
    tags: ['CRM Status', 'Delay', 'Eligibility Check', 'Email', 'Slack'],
    requiredConnections: ['resend', 'slack'],
    graph: {
      nodes: [
        {
          id: 'node-trigger',
          type: 'trigger_manual',
          title: 'Proposal Sent Trigger',
          schema_version: 1,
          position: { x: 100, y: 150 },
          config: {},
        },
        {
          id: 'node-delay-3days',
          type: 'action_delay',
          title: '3-Day Re-check Delay',
          schema_version: 1,
          position: { x: 400, y: 150 },
          config: {
            duration: 72,
            unit: 'hours',
            follow_up_eligibility_check: true,
          },
        },
        {
          id: 'node-condition-status',
          type: 'condition_if_else',
          title: 'Is Still Open?',
          schema_version: 1,
          position: { x: 700, y: 150 },
          config: {
            field_path: 'trigger.status',
            operator: 'not_equals',
            compare_value: 'converted',
          },
        },
        {
          id: 'node-internal-alert',
          type: 'action_slack_notify',
          title: 'Executive Follow-up Task',
          schema_version: 1,
          position: { x: 1000, y: 50 },
          config: {
            channel_name: '#sales-pipeline',
            message_template: '📋 Follow up on pending proposal for {{trigger.name}} (Company: {{trigger.company}})',
          },
        },
      ],
      edges: [
        { id: 'e1', source: 'node-trigger', target: 'node-delay-3days' },
        { id: 'e2', source: 'node-delay-3days', target: 'node-condition-status' },
        { id: 'e3', source: 'node-condition-status', target: 'node-internal-alert', source_handle: 'true' },
      ],
    },
  },
];
