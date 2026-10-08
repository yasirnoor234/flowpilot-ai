'use server';

import { createClient } from '@/lib/supabase/server';
import { requireWorkspaceAuth } from '@/lib/auth/workspace-context';
import { encryptSecret, decryptSecret, maskSecret, validateSlackWebhookUrl } from '@/lib/security/encryption';
import { sendResendEmail } from '@/lib/integrations/resend';
import { sendSlackNotification } from '@/lib/integrations/slack';
import { revalidatePath } from 'next/cache';
import type {
  IntegrationConnectionRecord,
  IntegrationProvider,
  IntegrationActionAttemptRecord,
} from '@/types/integrations';

/**
 * Retrieves all integration connections for the active workspace with masked credentials.
 */
export async function getWorkspaceIntegrationsAction(): Promise<{
  connections: IntegrationConnectionRecord[];
  recentAttempts: IntegrationActionAttemptRecord[];
}> {
  const context = await requireWorkspaceAuth();
  const supabase = await createClient();

  const { data: connectionsData } = await supabase
    .from('integration_connections')
    .select('*')
    .eq('workspace_id', context.workspace.id);

  const { data: attemptsData } = await supabase
    .from('integration_action_attempts')
    .select('*')
    .eq('workspace_id', context.workspace.id)
    .order('created_at', { ascending: false })
    .limit(15);

  const connections: IntegrationConnectionRecord[] = (connectionsData || []).map((conn: any) => {
    let masked = '';
    if (conn.encrypted_credentials) {
      try {
        const decrypted = decryptSecret(conn.encrypted_credentials);
        masked = maskSecret(decrypted);
      } catch {
        masked = '••••••••';
      }
    }

    return {
      id: conn.id,
      workspace_id: conn.workspace_id,
      provider: conn.provider,
      name: conn.name,
      status: conn.status,
      masked_key: masked,
      settings: conn.settings || {},
      is_active: conn.is_active,
      last_tested_at: conn.last_tested_at,
      last_error: conn.last_error,
      created_at: conn.created_at,
      updated_at: conn.updated_at,
    };
  });

  return {
    connections,
    recentAttempts: (attemptsData || []) as unknown as IntegrationActionAttemptRecord[],
  };
}

/**
 * Saves and encrypts credentials for an integration connection.
 */
export async function saveIntegrationConnectionAction(params: {
  provider: IntegrationProvider;
  name: string;
  secretKey: string;
  settings?: Record<string, any>;
}): Promise<{ success: boolean; error?: string }> {
  const context = await requireWorkspaceAuth();
  const supabase = await createClient();

  if (!params.secretKey.trim()) {
    return { success: false, error: 'API key or webhook secret is required.' };
  }

  // Validate Slack webhook host if Slack
  if (params.provider === 'slack') {
    const check = validateSlackWebhookUrl(params.secretKey.trim());
    if (!check.valid) {
      return { success: false, error: check.error };
    }
  }

  const encrypted = encryptSecret(params.secretKey.trim());

  const { error } = await supabase
    .from('integration_connections')
    .upsert(
      {
        workspace_id: context.workspace.id,
        provider: params.provider,
        name: params.name,
        status: 'configured',
        encrypted_credentials: encrypted,
        settings: params.settings || {},
        is_active: true,
        updated_at: new Date().toISOString(),
      } as unknown as never,
      { onConflict: 'workspace_id,provider' }
    );

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath('/integrations');
  return { success: true };
}

/**
 * Executes an explicit test delivery action for a configured integration.
 */
export async function testIntegrationConnectionAction(params: {
  provider: IntegrationProvider;
  testTarget?: string;
}): Promise<{
  success: boolean;
  status: string;
  message: string;
  latencyMs?: number;
}> {
  const context = await requireWorkspaceAuth();
  const supabase = await createClient();

  const isDemo = context.workspace.is_demo_mode;

  if (params.provider === 'resend') {
    const targetEmail = params.testTarget || context.user.email || 'delivered@resend.dev';
    const result = await sendResendEmail({
      workspaceId: context.workspace.id,
      to: targetEmail,
      subject: 'FlowPilot AI Test Email Delivery',
      html: `
        <div style="font-family: sans-serif; font-size: 14px; color: #1e293b; line-height: 1.6;">
          <h2 style="color: #6366f1;">FlowPilot AI Integration Test</h2>
          <p>This is a live test notification verifying your <strong>Resend</strong> connection for workspace <strong>${context.workspace.name}</strong>.</p>
          <p>Timestamp: ${new Date().toISOString()}</p>
        </div>
      `,
      isDemoMode: isDemo,
      idempotencyKey: `test_email_${Date.now()}`,
    });

    await supabase
      .from('integration_connections')
      .update({
        status: result.success ? 'active' : 'error',
        last_tested_at: new Date().toISOString(),
        last_error: result.error || null,
      } as unknown as never)
      .eq('workspace_id', context.workspace.id)
      .eq('provider', 'resend');

    revalidatePath('/integrations');
    return {
      success: result.success,
      status: result.status,
      message: result.success
        ? `Test email submitted successfully to ${targetEmail} (${result.latencyMs}ms)`
        : `Email delivery test failed: ${result.error}`,
      latencyMs: result.latencyMs,
    };
  }

  if (params.provider === 'slack') {
    const result = await sendSlackNotification({
      workspaceId: context.workspace.id,
      text: `FlowPilot Integration Test Alert from workspace: ${context.workspace.name}`,
      leadContext: {
        id: 'test-lead-preview',
        name: 'Sarah Connor (Test Prospect)',
        company: 'SkyDefense AI',
        qualificationScore: 94,
        leadTier: 'hot',
        summary: 'Explicit connection test executed from FlowPilot integration settings.',
      },
      isDemoMode: isDemo,
      idempotencyKey: `test_slack_${Date.now()}`,
    });

    await supabase
      .from('integration_connections')
      .update({
        status: result.success ? 'active' : 'error',
        last_tested_at: new Date().toISOString(),
        last_error: result.error || null,
      } as unknown as never)
      .eq('workspace_id', context.workspace.id)
      .eq('provider', 'slack');

    revalidatePath('/integrations');
    return {
      success: result.success,
      status: result.status,
      message: result.success
        ? `Test alert dispatched to Slack successfully (${result.latencyMs}ms)`
        : `Slack notification test failed: ${result.error}`,
      latencyMs: result.latencyMs,
    };
  }

  if (params.provider === 'openai') {
    const startTime = performance.now();
    try {
      const { executeAiLeadQualification } = await import('@/lib/ai');
      const { result, metadata } = await executeAiLeadQualification(
        {
          lead_name: 'Alex Vance (Test Prospect)',
          company: 'Nexus Automations',
          service_interest: 'Enterprise AI Lead Qualification',
          estimated_budget: 35000,
          message: 'Testing OpenAI connection and model evaluation from FlowPilot dashboard.',
        },
        {
          workspaceId: context.workspace.id,
        }
      );

      const latencyMs = Math.round(performance.now() - startTime);

      await supabase
        .from('integration_connections')
        .update({
          status: 'active',
          last_tested_at: new Date().toISOString(),
          last_error: null,
        } as unknown as never)
        .eq('workspace_id', context.workspace.id)
        .eq('provider', 'openai');

      revalidatePath('/integrations');
      return {
        success: true,
        status: 'active',
        message: `OpenAI connection verified using model ${metadata.model} (Score: ${result.qualification_score}/100, latency: ${latencyMs}ms, tokens: ${metadata.total_tokens})`,
        latencyMs,
      };
    } catch (err: any) {
      const latencyMs = Math.round(performance.now() - startTime);
      await supabase
        .from('integration_connections')
        .update({
          status: 'error',
          last_tested_at: new Date().toISOString(),
          last_error: err?.message || 'OpenAI test failed',
        } as unknown as never)
        .eq('workspace_id', context.workspace.id)
        .eq('provider', 'openai');

      revalidatePath('/integrations');
      return {
        success: false,
        status: 'error',
        message: `OpenAI connection test failed: ${err?.message || 'Unknown error'}`,
        latencyMs,
      };
    }
  }

  return {
    success: false,
    status: 'unsupported',
    message: `Provider ${params.provider} does not support explicit test actions.`,
  };
}

/**
 * Disconnects / deletes an integration connection.
 */
export async function disconnectIntegrationAction(
  provider: IntegrationProvider
): Promise<{ success: boolean; error?: string }> {
  const context = await requireWorkspaceAuth();
  const supabase = await createClient();

  const { error } = await supabase
    .from('integration_connections')
    .delete()
    .eq('workspace_id', context.workspace.id)
    .eq('provider', provider);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath('/integrations');
  return { success: true };
}
