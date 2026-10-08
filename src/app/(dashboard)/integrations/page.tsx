import React from 'react';
import { requireWorkspaceAuth } from '@/lib/auth/workspace-context';
import { createClient } from '@/lib/supabase/server';
import { getWorkspaceIntegrationsAction } from '@/lib/actions/integrations';
import { WebhookTester } from '@/components/integrations/webhook-tester';
import { IntegrationManager } from '@/components/integrations/integration-manager';
import type { WebhookEndpointRecord } from '@/types/crm';
import crypto from 'crypto';

export default async function IntegrationsPage() {
  const context = await requireWorkspaceAuth();
  const supabase = await createClient();
  const isDemo = context.workspace.is_demo_mode;

  // Query webhook endpoints for this workspace
  const { data: endpointsData } = await supabase
    .from('webhook_endpoints')
    .select('*, workflow:workflows(id, name, status)')
    .eq('workspace_id', context.workspace.id)
    .order('created_at', { ascending: false });

  let endpoints = (endpointsData || []) as unknown as WebhookEndpointRecord[];

  // If no endpoint exists yet, create a default endpoint for the workspace
  if (endpoints.length === 0) {
    const { data: defaultWorkflowData } = await supabase
      .from('workflows')
      .select('id, name')
      .eq('workspace_id', context.workspace.id)
      .limit(1)
      .maybeSingle();

    const defaultWorkflow = defaultWorkflowData as { id: string; name: string } | null;

    if (defaultWorkflow) {
      const pathSlug = `lead-intake-${Math.random().toString(36).substring(2, 7)}`;
      const secretToken = `whsec_${crypto.randomBytes(24).toString('hex')}`;

      const { data: newEp } = await supabase
        .from('webhook_endpoints')
        .insert({
          workspace_id: context.workspace.id,
          workflow_id: defaultWorkflow.id,
          path_slug: pathSlug,
          secret_token: secretToken,
          is_active: true,
          rate_limit_per_minute: 60,
        } as unknown as never)
        .select('*, workflow:workflows(id, name, status)')
        .single();

      if (newEp) {
        endpoints = [newEp as unknown as WebhookEndpointRecord];
      }
    }
  }

  const { connections, recentAttempts } = await getWorkspaceIntegrationsAction();
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  return (
    <div className="space-y-10">
      <div>
        <h2 className="text-xl font-bold text-white tracking-tight">Integrations & Connectors</h2>
        <p className="text-xs text-zinc-400 mt-0.5">
          Manage live API keys, encrypted secrets, and inbound webhook endpoints for{' '}
          <span className="text-zinc-200 font-medium">{context.workspace.name}</span>.
        </p>
      </div>

      {/* Resend Email & Slack Live Integrations */}
      <IntegrationManager
        connections={connections}
        recentAttempts={recentAttempts}
        workspaceName={context.workspace.name}
        isDemoMode={isDemo}
      />

      {/* Webhook Endpoint Tester */}
      <div className="space-y-4 pt-4 border-t border-zinc-800">
        <div>
          <h3 className="text-sm font-bold text-white">Inbound Lead Capture Webhooks</h3>
          <p className="text-xs text-zinc-400">
            Accept lead submissions directly into your workflows from external landing pages, Webflow, or Typeform.
          </p>
        </div>

        <WebhookTester
          endpoints={endpoints}
          workspaceId={context.workspace.id}
          baseUrl={baseUrl}
        />
      </div>
    </div>
  );
}
