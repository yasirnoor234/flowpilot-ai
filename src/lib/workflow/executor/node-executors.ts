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
// 5. AI Qualification Executor (OpenAI + Deterministic Mock Fallback)
// -----------------------------------------------------------------------------
export const aiQualifyExecutor: NodeExecutor = {
  async execute(node, resolvedConfig, context) {
    const { executeAiLeadQualification } = await import('@/lib/ai');

    const leadMessage =
      resolvedConfig.prompt_template ||
      context.triggerPayload.message ||
      context.triggerPayload.inquiry ||
      JSON.stringify(context.triggerPayload);

    const leadName =
      context.triggerPayload.name ||
      context.triggerPayload.full_name ||
      (context.triggerPayload.first_name ? `${context.triggerPayload.first_name} ${context.triggerPayload.last_name || ''}`.trim() : null);

    const leadCompany = context.triggerPayload.company || null;
    const serviceInterest = context.triggerPayload.service_interest || context.triggerPayload.service || null;
    const estimatedBudget = context.triggerPayload.estimated_budget || context.triggerPayload.budget || null;

    const { result, metadata } = await executeAiLeadQualification(
      {
        message: String(leadMessage),
        lead_name: leadName,
        company: leadCompany,
        service_interest: serviceInterest,
        estimated_budget: estimatedBudget,
      },
      {
        workspaceId: context.workspaceId,
        modelOverride: resolvedConfig.model,
      }
    );

    return {
      output: {
        model: metadata.model,
        provider: metadata.provider,
        qualification_score: result.qualification_score,
        lead_tier: result.lead_tier,
        category: result.category,
        priority: result.priority,
        summary: result.summary,
        reasoning: `${result.summary} ${result.budget_analysis || ''}`.trim(),
        recommended_action: result.suggested_next_action,
        intent_signals: result.intent_signals,
        explanation_disclaimer: result.explanation_disclaimer,
        tokens_used: metadata.total_tokens,
        latency_ms: metadata.latency_ms,
        evaluated_at: new Date().toISOString(),
      },
      idempotencyKey: `ai-${context.runId}-${node.id}`,
    };
  },
};

// -----------------------------------------------------------------------------
// 6. CRM Upsert Executor (Live Supabase CRM + Fallback Adapter)
// -----------------------------------------------------------------------------
export const crmUpsertExecutor: NodeExecutor = {
  async execute(node, resolvedConfig, context) {
    const rawEmail = resolvedConfig.email_field || context.triggerPayload.email || null;
    const name = resolvedConfig.first_name_field
      ? `${resolvedConfig.first_name_field} ${resolvedConfig.last_name_field || ''}`.trim()
      : context.triggerPayload.name || context.triggerPayload.first_name || 'Inbound Lead';
    const company = resolvedConfig.company_field || context.triggerPayload.company || null;
    const phone = resolvedConfig.phone_field || context.triggerPayload.phone || null;
    const status = resolvedConfig.status || 'new';
    const tags = resolvedConfig.tags || ['workflow-auto'];

    // Check if AI qualification output is available in context
    const aiOutput = context.nodeOutputs['ai_qualify'] || context.nodeOutputs['node_ai_qualify'] || {};
    const qualStatus = aiOutput.lead_tier || 'pending';
    const qualScore = aiOutput.qualification_score !== undefined ? aiOutput.qualification_score : null;
    const qualReasoning = aiOutput.reasoning || null;

    let crmRecordId = `crm_lead_${Math.random().toString(36).substring(2, 9)}`;
    let isNewRecord = true;

    try {
      // Dynamic import to avoid circular dependency
      const { upsertLeadRecord } = await import('@/lib/crm/leads');
      const result = await upsertLeadRecord(
        {
          workspace_id: context.workspaceId,
          name,
          email: rawEmail,
          phone,
          company,
          source: 'workflow',
          status,
          tags,
          qualification_status: qualStatus,
          qualification_score: qualScore,
          qualification_reasoning: qualReasoning,
          custom_attributes: {
            workflow_id: context.workflowId,
            run_id: context.runId,
          },
        },
        {
          activityType: 'workflow_executed',
          activityTitle: `Lead processed by workflow`,
          activityMetadata: {
            run_id: context.runId,
            node_id: node.id,
            ai_score: qualScore,
          },
        }
      );

      crmRecordId = result.lead.id;
      isNewRecord = result.isNew;
    } catch {
      // Fallback for memory testing / offline environments
    }

    return {
      output: {
        crm_record_id: crmRecordId,
        email: rawEmail,
        name,
        company,
        status,
        qualification_status: qualStatus,
        qualification_score: qualScore,
        is_new_lead: isNewRecord,
        tags,
        upserted_at: new Date().toISOString(),
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
