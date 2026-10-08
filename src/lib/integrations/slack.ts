import { createAdminClient } from '@/lib/supabase/server';
import { decryptSecret, redactSecrets, validateSlackWebhookUrl } from '@/lib/security/encryption';
import type {
  SendSlackNotificationInput,
  SendSlackNotificationResult,
  IntegrationConnectionRecord,
  IntegrationActionAttemptRecord,
} from '@/types/integrations';

/**
 * Builds a structured Slack Block Kit payload for lead alerts.
 */
export function buildSlackLeadPayload(input: SendSlackNotificationInput, baseUrl: string) {
  const lead = input.leadContext;

  if (!lead) {
    return {
      text: input.text,
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: input.text,
          },
        },
      ],
    };
  }

  const scoreEmoji = (lead.qualificationScore || 0) >= 80 ? '🔥' : (lead.qualificationScore || 0) >= 60 ? '⚡' : '❄️';
  const tierBadge = (lead.leadTier || 'WARM').toUpperCase();
  const leadUrl = `${baseUrl}/leads/${lead.id}`;

  return {
    text: `New Lead Alert: ${lead.name} (${scoreEmoji} ${tierBadge} - Score: ${lead.qualificationScore || 'N/A'})`,
    blocks: [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: `${scoreEmoji} New Inbound Lead: ${lead.name}`,
          emoji: true,
        },
      },
      {
        type: 'section',
        fields: [
          {
            type: 'mrkdwn',
            text: `*Company:*\n${lead.company || 'Individual / Unknown'}`,
          },
          {
            type: 'mrkdwn',
            text: `*AI Qualification:*\n${scoreEmoji} *${tierBadge}* (${lead.qualificationScore || 0}/100)`,
          },
        ],
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*AI Summary & Intent:*\n${lead.summary || input.text}`,
        },
      },
      {
        type: 'actions',
        elements: [
          {
            type: 'button',
            text: {
              type: 'plain_text',
              text: 'View Lead in FlowPilot',
              emoji: true,
            },
            url: leadUrl,
            style: 'primary',
          },
        ],
      },
    ],
  };
}

/**
 * Sends a Slack notification via workspace incoming webhook.
 */
export async function sendSlackNotification(
  input: SendSlackNotificationInput
): Promise<SendSlackNotificationResult> {
  const startTime = performance.now();
  const supabase = createAdminClient();

  // 1. Check for existing idempotent attempt
  if (input.idempotencyKey) {
    const { data: attemptData } = await supabase
      .from('integration_action_attempts')
      .select('*')
      .eq('workspace_id', input.workspaceId)
      .eq('idempotency_key', input.idempotencyKey)
      .maybeSingle();

    const existingAttempt = attemptData as unknown as IntegrationActionAttemptRecord | null;

    if (existingAttempt && (existingAttempt.status === 'delivered' || existingAttempt.status === 'simulated')) {
      return {
        success: true,
        status: existingAttempt.status,
        isSimulated: existingAttempt.status === 'simulated',
        latencyMs: existingAttempt.latency_ms || 0,
      };
    }
  }

  // 2. Fetch workspace integration connection
  const { data: connectionData } = await supabase
    .from('integration_connections')
    .select('*')
    .eq('workspace_id', input.workspaceId)
    .eq('provider', 'slack')
    .maybeSingle();

  const connection = connectionData as unknown as IntegrationConnectionRecord | null;

  let webhookUrl: string | null = null;
  let channelName: string | null = null;

  if (connection && connection.encrypted_credentials && connection.is_active) {
    try {
      webhookUrl = decryptSecret(connection.encrypted_credentials);
    } catch {
      webhookUrl = null;
    }
    channelName = connection.settings?.channel || '#leads-notifications';
  }

  // Fallback to server environment if no DB connection
  if (!webhookUrl) {
    webhookUrl = process.env.SLACK_WEBHOOK_URL || null;
  }

  const isDemo = input.isDemoMode || !webhookUrl || webhookUrl.includes('example.com') || webhookUrl.startsWith('demo_');

  // 3. If in demo mode, record simulated Slack alert
  if (isDemo || !webhookUrl) {
    const latencyMs = Math.round(performance.now() - startTime);

    await supabase.from('integration_action_attempts').insert({
      workspace_id: input.workspaceId,
      connection_id: connection?.id || null,
      action_type: 'slack_notify',
      workflow_run_id: input.workflowRunId || null,
      workflow_step_id: input.workflowStepId || null,
      idempotency_key: input.idempotencyKey || null,
      status: 'simulated',
      recipient_or_target: channelName || '#demo-leads',
      payload_summary: {
        text: input.text,
        channel: channelName || '#demo-leads',
        has_lead_context: !!input.leadContext,
        is_demo: true,
      },
      latency_ms: latencyMs,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    } as unknown as never);

    return {
      success: true,
      status: 'simulated',
      isSimulated: true,
      latencyMs,
    };
  }

  // 4. Validate Slack webhook URL Host for SSRF security
  const validation = validateSlackWebhookUrl(webhookUrl);
  if (!validation.valid) {
    const errorMsg = `Security violation: ${validation.error}`;
    return {
      success: false,
      status: 'failed',
      error: errorMsg,
      latencyMs: 0,
    };
  }

  // 5. Build Block Kit Payload
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const payload = buildSlackLeadPayload(input, baseUrl);

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    const latencyMs = Math.round(performance.now() - startTime);

    if (!res.ok) {
      const errorText = await res.text();
      const sanitizedError = redactSecrets(errorText);

      await supabase.from('integration_action_attempts').insert({
        workspace_id: input.workspaceId,
        connection_id: connection?.id || null,
        action_type: 'slack_notify',
        workflow_run_id: input.workflowRunId || null,
        workflow_step_id: input.workflowStepId || null,
        idempotency_key: input.idempotencyKey || null,
        status: 'failed',
        recipient_or_target: channelName || '#slack-channel',
        payload_summary: { text: input.text },
        error_message: sanitizedError,
        latency_ms: latencyMs,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as unknown as never);

      return {
        success: false,
        status: 'failed',
        error: `Slack Webhook returned HTTP ${res.status}: ${sanitizedError}`,
        latencyMs,
      };
    }

    await supabase.from('integration_action_attempts').insert({
      workspace_id: input.workspaceId,
      connection_id: connection?.id || null,
      action_type: 'slack_notify',
      workflow_run_id: input.workflowRunId || null,
      workflow_step_id: input.workflowStepId || null,
      idempotency_key: input.idempotencyKey || null,
      status: 'delivered',
      recipient_or_target: channelName || '#slack-channel',
      payload_summary: {
        text: input.text,
        lead_id: input.leadContext?.id,
      },
      latency_ms: latencyMs,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    } as unknown as never);

    return {
      success: true,
      status: 'delivered',
      latencyMs,
    };
  } catch (err: any) {
    const latencyMs = Math.round(performance.now() - startTime);
    const errorMsg = redactSecrets(err.message || 'Slack dispatch failed');

    await supabase.from('integration_action_attempts').insert({
      workspace_id: input.workspaceId,
      connection_id: connection?.id || null,
      action_type: 'slack_notify',
      workflow_run_id: input.workflowRunId || null,
      workflow_step_id: input.workflowStepId || null,
      idempotency_key: input.idempotencyKey || null,
      status: 'failed',
      recipient_or_target: channelName || '#slack-channel',
      payload_summary: { text: input.text },
      error_message: errorMsg,
      latency_ms: latencyMs,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    } as unknown as never);

    return {
      success: false,
      status: 'failed',
      error: errorMsg,
      latencyMs,
    };
  }
}
