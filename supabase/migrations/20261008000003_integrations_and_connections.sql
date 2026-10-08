-- =============================================================================
-- FlowPilot AI: Phase 7 - Live Integrations & Connection Store Migration
-- =============================================================================

-- 1. Create integration_connections table
CREATE TABLE IF NOT EXISTS public.integration_connections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    provider TEXT NOT NULL CHECK (provider IN ('resend', 'slack', 'openai', 'webhook', 'custom')),
    name TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'unconfigured' CHECK (status IN ('unconfigured', 'configured', 'active', 'error', 'disabled')),
    encrypted_credentials TEXT NOT NULL, -- AES-256-GCM encrypted payload
    settings JSONB NOT NULL DEFAULT '{}'::jsonb, -- sender email, channel name, test recipient, etc.
    is_active BOOLEAN NOT NULL DEFAULT true,
    last_tested_at TIMESTAMPTZ,
    last_error TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    UNIQUE(workspace_id, provider)
);

-- 2. Create integration_action_attempts table
CREATE TABLE IF NOT EXISTS public.integration_action_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    connection_id UUID REFERENCES public.integration_connections(id) ON DELETE SET NULL,
    action_type TEXT NOT NULL CHECK (action_type IN ('email_send', 'slack_notify', 'ai_qualify', 'webhook_dispatch')),
    workflow_run_id UUID REFERENCES public.workflow_runs(id) ON DELETE SET NULL,
    workflow_step_id TEXT,
    idempotency_key TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'submitted', 'delivered', 'failed', 'simulated')),
    provider_message_id TEXT,
    recipient_or_target TEXT,
    payload_summary JSONB NOT NULL DEFAULT '{}'::jsonb,
    error_message TEXT,
    latency_ms INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3. Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_integration_connections_workspace ON public.integration_connections(workspace_id);
CREATE INDEX IF NOT EXISTS idx_integration_connections_provider ON public.integration_connections(workspace_id, provider);
CREATE INDEX IF NOT EXISTS idx_integration_attempts_workspace ON public.integration_action_attempts(workspace_id);
CREATE INDEX IF NOT EXISTS idx_integration_attempts_run ON public.integration_action_attempts(workflow_run_id);
CREATE INDEX IF NOT EXISTS idx_integration_attempts_idempotency ON public.integration_action_attempts(workspace_id, idempotency_key);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.integration_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.integration_action_attempts ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies for integration_connections
DROP POLICY IF EXISTS "Members can view workspace integration connections" ON public.integration_connections;
CREATE POLICY "Members can view workspace integration connections"
    ON public.integration_connections
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.workspace_members
            WHERE workspace_members.workspace_id = integration_connections.workspace_id
            AND workspace_members.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Members can mutate workspace integration connections" ON public.integration_connections;
CREATE POLICY "Members can mutate workspace integration connections"
    ON public.integration_connections
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.workspace_members
            WHERE workspace_members.workspace_id = integration_connections.workspace_id
            AND workspace_members.user_id = auth.uid()
        )
    );

-- 6. RLS Policies for integration_action_attempts
DROP POLICY IF EXISTS "Members can view workspace action attempts" ON public.integration_action_attempts;
CREATE POLICY "Members can view workspace action attempts"
    ON public.integration_action_attempts
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.workspace_members
            WHERE workspace_members.workspace_id = integration_action_attempts.workspace_id
            AND workspace_members.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Members can insert action attempts" ON public.integration_action_attempts;
CREATE POLICY "Members can insert action attempts"
    ON public.integration_action_attempts
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.workspace_members
            WHERE workspace_members.workspace_id = integration_action_attempts.workspace_id
            AND workspace_members.user_id = auth.uid()
        )
    );
