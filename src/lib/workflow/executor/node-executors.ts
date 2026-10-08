import type { WorkflowNode, WorkflowNodeType } from '@/types/workflow';
import type { ExecutionContext } from '@/types/execution';
import { getNestedValue } from './expression-resolver';

export interface NodeExecutionResult {
  output: Record<string, any>;
  branchOutcome?: boolean; // For condition nodes: true branch taken or false branch taken
  delaySeconds?: number; // For delay nodes
  idempotencyKey?: string;
}

export interface NodeExecutor {
  execute(
    node: WorkflowNode,
    resolvedConfig: any,
    context: ExecutionContext
  ): Promise<NodeExecutionResult>;
}

// -----------------------------------------------------------------------------
// 1. Triggers Executor (Manual & Webhook)
// -----------------------------------------------------------------------------
export const triggerExecutor: NodeExecutor = {
  async execute(_node, _resolvedConfig, context) {
    return {
      output: {
        ...context.triggerPayload,
        _received_at: new Date().toISOString(),
      },
    };
  },
};

// -----------------------------------------------------------------------------
// 2. Field Mapping Executor
// -----------------------------------------------------------------------------
export const fieldMappingExecutor: NodeExecutor = {
  async execute(_node, resolvedConfig, context) {
    const mappings = resolvedConfig.mappings || [];
    const output: Record<string, any> = {};

    for (const item of mappings) {
      const sourceField = item.source_field?.trim();
      const targetField = item.target_field?.trim();

      if (!sourceField || !targetField) continue;

      let value: any;
      if (sourceField.startsWith('trigger.')) {
        value = getNestedValue(context.triggerPayload, sourceField.replace('trigger.', ''));
      } else {
        const parts = sourceField.split('.');
        const nodeNamespace = parts[0];
        const subPath = parts.slice(1).join('.');
        if (context.nodeOutputs[nodeNamespace]) {
          value = getNestedValue(context.nodeOutputs[nodeNamespace], subPath);
        }
      }

      if (value === undefined && item.fallback_value !== undefined) {
        value = item.fallback_value;
      }

      output[targetField] = value;
    }

    return { output };
  },
};

// -----------------------------------------------------------------------------
// 3. IF/ELSE Condition Executor
// -----------------------------------------------------------------------------
export const ifElseConditionExecutor: NodeExecutor = {
  async execute(_node, resolvedConfig, context) {
    const fieldPath = resolvedConfig.field_path?.trim() || '';
    const operator = resolvedConfig.operator || 'equals';
    const compareValue = resolvedConfig.compare_value !== undefined ? String(resolvedConfig.compare_value) : '';

    let actualValue: any;

    if (fieldPath.startsWith('trigger.')) {
      actualValue = getNestedValue(context.triggerPayload, fieldPath.replace('trigger.', ''));
    } else {
      const parts = fieldPath.split('.');
      const nodeNamespace = parts[0];
      const subPath = parts.slice(1).join('.');
      if (context.nodeOutputs[nodeNamespace]) {
        actualValue = getNestedValue(context.nodeOutputs[nodeNamespace], subPath);
      } else {
        // Search through all node outputs
        for (const out of Object.values(context.nodeOutputs)) {
          const val = getNestedValue(out, fieldPath);
          if (val !== undefined) {
            actualValue = val;
            break;
          }
        }
      }
    }

    let branchOutcome = false;
    const actualStr = actualValue !== undefined && actualValue !== null ? String(actualValue) : '';

    switch (operator) {
      case 'equals':
        branchOutcome = actualStr.toLowerCase() === compareValue.toLowerCase();
        break;
      case 'not_equals':
        branchOutcome = actualStr.toLowerCase() !== compareValue.toLowerCase();
        break;
      case 'greater_than': {
        const numActual = parseFloat(actualStr.replace(/[^0-9.-]+/g, ''));
        const numCompare = parseFloat(compareValue.replace(/[^0-9.-]+/g, ''));
        branchOutcome = !isNaN(numActual) && !isNaN(numCompare) && numActual > numCompare;
        break;
      }
      case 'less_than': {
        const numActual = parseFloat(actualStr.replace(/[^0-9.-]+/g, ''));
        const numCompare = parseFloat(compareValue.replace(/[^0-9.-]+/g, ''));
        branchOutcome = !isNaN(numActual) && !isNaN(numCompare) && numActual < numCompare;
        break;
      }
      case 'contains':
        branchOutcome = actualStr.toLowerCase().includes(compareValue.toLowerCase());
        break;
      case 'starts_with':
        branchOutcome = actualStr.toLowerCase().startsWith(compareValue.toLowerCase());
        break;
      case 'exists':
        branchOutcome = actualValue !== undefined && actualValue !== null && actualStr.trim() !== '';
        break;
      case 'is_empty':
        branchOutcome = actualValue === undefined || actualValue === null || actualStr.trim() === '';
        break;
      default:
        branchOutcome = false;
    }

    return {
      output: {
        field_path: fieldPath,
        actual_value: actualValue,
        operator,
        compare_value: compareValue,
        branch_taken: branchOutcome ? 'true' : 'false',
      },
      branchOutcome,
    };
  },
};

// -----------------------------------------------------------------------------
// 4. Durable Delay Executor
// -----------------------------------------------------------------------------
export const delayExecutor: NodeExecutor = {
  async execute(_node, resolvedConfig) {
    const duration = resolvedConfig.duration || 1;
    const unit = resolvedConfig.unit || 'hours';

    let delaySeconds = duration;
    if (unit === 'minutes') {
      delaySeconds = duration * 60;
    } else if (unit === 'hours') {
      delaySeconds = duration * 3600;
    } else if (unit === 'days') {
      delaySeconds = duration * 86400;
    }

    return {
      output: {
        duration,
        unit,
        delay_seconds: delaySeconds,
        resumed_at: new Date().toISOString(),
      },
      delaySeconds,
    };
  },
};

// -----------------------------------------------------------------------------
// 5. AI Qualification Executor (Demo / Live Adapter)
// -----------------------------------------------------------------------------
export const aiQualifyExecutor: NodeExecutor = {
  async execute(node, resolvedConfig, context) {
    const prompt = resolvedConfig.prompt_template || '';
    const model = resolvedConfig.model || 'gpt-4o-mini';

    // Extract budget / numeric hints if present
    const budgetStr = JSON.stringify(context.triggerPayload).match(/\$?[0-9,]+(\.[0-9]{2})?/)?.[0] || '';
    const numericBudget = parseFloat(budgetStr.replace(/[^0-9.]/g, '')) || 0;

    let qualificationScore = 75;
    let leadTier = 'warm';

    if (numericBudget >= 10000 || prompt.toLowerCase().includes('enterprise') || prompt.toLowerCase().includes('immediate')) {
      qualificationScore = 92;
      leadTier = 'hot';
    } else if (numericBudget > 0 && numericBudget < 3000) {
      qualificationScore = 45;
      leadTier = 'cold';
    }

    return {
      output: {
        model,
        qualification_score: qualificationScore,
        lead_tier: leadTier,
        reasoning: `AI evaluated lead with intent indicators. Budget estimate: $${numericBudget || 'standard'}. Assigned tier: ${leadTier.toUpperCase()}.`,
        recommended_action: leadTier === 'hot' ? 'immediate_executive_followup' : 'standard_email_sequence',
        evaluated_at: new Date().toISOString(),
        adapter_mode: 'demo_structured_output',
      },
      idempotencyKey: `ai-${context.runId}-${node.id}`,
    };
  },
};

// -----------------------------------------------------------------------------
// 6. CRM Upsert Executor (Demo / Live Adapter)
// -----------------------------------------------------------------------------
export const crmUpsertExecutor: NodeExecutor = {
  async execute(node, resolvedConfig, context) {
    const email = resolvedConfig.email_field || context.triggerPayload.email || 'lead@example.com';
    const status = resolvedConfig.status || 'qualified';

    return {
      output: {
        crm_record_id: `crm_lead_${Math.random().toString(36).substring(2, 9)}`,
        email,
        status,
        tags: resolvedConfig.tags || ['inbound-flow'],
        upserted_at: new Date().toISOString(),
        adapter_mode: 'demo_crm',
      },
      idempotencyKey: `crm-${context.runId}-${node.id}`,
    };
  },
};

// -----------------------------------------------------------------------------
// 7. Email Send Executor (Demo Resend Adapter)
// -----------------------------------------------------------------------------
export const sendEmailExecutor: NodeExecutor = {
  async execute(node, resolvedConfig, context) {
    const to = resolvedConfig.to || 'recipient@example.com';
    const subject = resolvedConfig.subject || 'Automated Update';
    const idempotencyKey = `email-${context.runId}-${node.id}`;

    return {
      output: {
        provider_message_id: `msg_resend_mock_${Math.random().toString(36).substring(2, 10)}`,
        to,
        subject,
        from: resolvedConfig.from_name || 'FlowPilot AI',
        sent_at: new Date().toISOString(),
        idempotency_key: idempotencyKey,
        adapter_mode: 'demo_resend',
      },
      idempotencyKey,
    };
  },
};

// -----------------------------------------------------------------------------
// 8. Slack Notification Executor (Demo Slack Adapter)
// -----------------------------------------------------------------------------
export const slackNotifyExecutor: NodeExecutor = {
  async execute(node, resolvedConfig, context) {
    const channel = resolvedConfig.channel_name || '#general';
    const message = resolvedConfig.message_template || 'FlowPilot AI notification';
    const idempotencyKey = `slack-${context.runId}-${node.id}`;

    return {
      output: {
        channel,
        message,
        delivered: true,
        posted_at: new Date().toISOString(),
        idempotency_key: idempotencyKey,
        adapter_mode: 'demo_slack',
      },
      idempotencyKey,
    };
  },
};

// -----------------------------------------------------------------------------
// Registry Map
// -----------------------------------------------------------------------------
export const NODE_EXECUTORS: Record<WorkflowNodeType, NodeExecutor> = {
  trigger_manual: triggerExecutor,
  trigger_webhook: triggerExecutor,
  action_field_mapping: fieldMappingExecutor,
  condition_if_else: ifElseConditionExecutor,
  action_delay: delayExecutor,
  action_ai_qualify: aiQualifyExecutor,
  action_crm_upsert: crmUpsertExecutor,
  action_send_email: sendEmailExecutor,
  action_slack_notify: slackNotifyExecutor,
};
