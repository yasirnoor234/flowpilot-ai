import { createAdminClient } from '@/lib/supabase/server';
import { decryptSecret, redactSecrets } from '@/lib/security/encryption';
import type {
  SendEmailInput,
  SendEmailResult,
  IntegrationConnectionRecord,
  IntegrationActionAttemptRecord,
} from '@/types/integrations';

/**
 * Sends an email using the workspace's configured Resend credentials or demo mode.
 */
export async function sendResendEmail(input: SendEmailInput): Promise<SendEmailResult> {
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

    if (existingAttempt && (existingAttempt.status === 'submitted' || existingAttempt.status === 'delivered' || existingAttempt.status === 'simulated')) {
      return {
        success: true,
        messageId: existingAttempt.provider_message_id || undefined,
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
    .eq('provider', 'resend')
    .maybeSingle();

  const connection = connectionData as unknown as IntegrationConnectionRecord | null;

  let apiKey: string | null = null;
  let fromEmail = 'FlowPilot <onboarding@resend.dev>';
  let testRecipient: string | null = null;

  if (connection && connection.encrypted_credentials && connection.is_active) {
    try {
      apiKey = decryptSecret(connection.encrypted_credentials);
    } catch {
      apiKey = null;
    }
    if (connection.settings?.from_email) {
      fromEmail = connection.settings.from_email;
    }
    if (connection.settings?.test_recipient) {
      testRecipient = connection.settings.test_recipient;
    }
  }

  // Fallback to server env if not in DB connection
  if (!apiKey) {
    apiKey = process.env.RESEND_API_KEY || null;
  }

  // Target recipient — if in demo mode and test recipient is specified, enforce test recipient
  let finalTo = input.to;
  const isDemo = input.isDemoMode || !apiKey || apiKey.startsWith('demo_');

  if (isDemo && testRecipient) {
    finalTo = testRecipient;
  }

  // 3. If in demo mode, record simulated attempt
  if (isDemo) {
    const latencyMs = Math.round(performance.now() - startTime);
    const mockMessageId = `resend_sim_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    await supabase.from('integration_action_attempts').insert({
      workspace_id: input.workspaceId,
      connection_id: connection?.id || null,
      action_type: 'email_send',
      workflow_run_id: input.workflowRunId || null,
      workflow_step_id: input.workflowStepId || null,
      idempotency_key: input.idempotencyKey || null,
      status: 'simulated',
      provider_message_id: mockMessageId,
      recipient_or_target: finalTo,
      payload_summary: {
        from: fromEmail,
        to: finalTo,
        subject: input.subject,
        body_length: (input.html || input.text || '').length,
        is_demo: true,
      },
      latency_ms: latencyMs,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    } as unknown as never);

    return {
      success: true,
      messageId: mockMessageId,
      status: 'simulated',
      isSimulated: true,
      latencyMs,
    };
  }

  // 4. Live API Call to Resend
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${apiKey}`,
  };

  if (input.idempotencyKey) {
    headers['Idempotency-Key'] = input.idempotencyKey;
  }

  const payload: Record<string, any> = {
    from: input.from || fromEmail,
    to: [finalTo],
    subject: input.subject,
  };

  if (input.html) {
    payload.html = input.html;
  }
  if (input.text) {
    payload.text = input.text;
  }
  if (!input.html && !input.text) {
    payload.text = 'No email body provided.';
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers,
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
        action_type: 'email_send',
        workflow_run_id: input.workflowRunId || null,
        workflow_step_id: input.workflowStepId || null,
        idempotency_key: input.idempotencyKey || null,
        status: 'failed',
        recipient_or_target: finalTo,
        payload_summary: { to: finalTo, subject: input.subject },
        error_message: sanitizedError,
        latency_ms: latencyMs,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as unknown as never);

      return {
        success: false,
        status: 'failed',
        error: `Resend API error (${res.status}): ${sanitizedError}`,
        latencyMs,
      };
    }

    const data = await res.json();
    const messageId = data.id || `resend_${Date.now()}`;

    await supabase.from('integration_action_attempts').insert({
      workspace_id: input.workspaceId,
      connection_id: connection?.id || null,
      action_type: 'email_send',
      workflow_run_id: input.workflowRunId || null,
      workflow_step_id: input.workflowStepId || null,
      idempotency_key: input.idempotencyKey || null,
      status: 'submitted',
      provider_message_id: messageId,
      recipient_or_target: finalTo,
      payload_summary: {
        from: payload.from,
        to: finalTo,
        subject: input.subject,
      },
      latency_ms: latencyMs,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    } as unknown as never);

    return {
      success: true,
      messageId,
      status: 'submitted',
      latencyMs,
    };
  } catch (err: any) {
    const latencyMs = Math.round(performance.now() - startTime);
    const errorMsg = redactSecrets(err.message || 'Unknown network error');

    await supabase.from('integration_action_attempts').insert({
      workspace_id: input.workspaceId,
      connection_id: connection?.id || null,
      action_type: 'email_send',
      workflow_run_id: input.workflowRunId || null,
      workflow_step_id: input.workflowStepId || null,
      idempotency_key: input.idempotencyKey || null,
      status: 'failed',
      recipient_or_target: finalTo,
      payload_summary: { to: finalTo, subject: input.subject },
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
