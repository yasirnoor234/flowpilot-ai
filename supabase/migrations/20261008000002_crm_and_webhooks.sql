-- =============================================================================
-- FlowPilot AI: Phase 5 - Lead Capture & Built-in CRM Engine Migration
-- =============================================================================

-- 1. Create leads table
CREATE TABLE IF NOT EXISTS public.leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    company TEXT,
    source TEXT NOT NULL DEFAULT 'webhook',
    service_interest TEXT,
    message TEXT,
    estimated_budget TEXT,
    qualification_status TEXT NOT NULL DEFAULT 'pending',
    qualification_score INTEGER CHECK (qualification_score >= 0 AND qualification_score <= 100),
    qualification_reasoning TEXT,
    owner_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'new',
    custom_attributes JSONB NOT NULL DEFAULT '{}'::jsonb,
    tags TEXT[] NOT NULL DEFAULT '{}',
    external_id TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Index leads for fast searching and filtering
CREATE INDEX IF NOT EXISTS idx_leads_workspace ON public.leads(workspace_id);
CREATE INDEX IF NOT EXISTS idx_leads_email ON public.leads(workspace_id, email);
CREATE INDEX IF NOT EXISTS idx_leads_status ON public.leads(workspace_id, status);
CREATE INDEX IF NOT EXISTS idx_leads_qualification ON public.leads(workspace_id, qualification_status);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON public.leads(workspace_id, created_at DESC);

-- Unique index for email deduplication per workspace (when email is provided)
CREATE UNIQUE INDEX IF NOT EXISTS idx_leads_workspace_email_unique 
ON public.leads(workspace_id, lower(trim(email))) 
WHERE email IS NOT NULL AND trim(email) != '';

-- 2. Create lead_activities table
CREATE TABLE IF NOT EXISTS public.lead_activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
    activity_type TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_lead_activities_lead ON public.lead_activities(lead_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_lead_activities_workspace ON public.lead_activities(workspace_id);

-- 3. Create webhook_endpoints table
CREATE TABLE IF NOT EXISTS public.webhook_endpoints (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    workflow_id UUID NOT NULL REFERENCES public.workflows(id) ON DELETE CASCADE,
    path_slug TEXT NOT NULL,
    secret_token TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    rate_limit_per_minute INTEGER NOT NULL DEFAULT 60,
    total_requests_count INTEGER NOT NULL DEFAULT 0,
    last_requested_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT unique_workspace_path_slug UNIQUE (workspace_id, path_slug)
);

CREATE INDEX IF NOT EXISTS idx_webhook_endpoints_slug ON public.webhook_endpoints(path_slug);
CREATE INDEX IF NOT EXISTS idx_webhook_endpoints_workflow ON public.webhook_endpoints(workflow_id);

-- =============================================================================
-- Row Level Security (RLS) Policies
-- =============================================================================

ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_endpoints ENABLE ROW LEVEL SECURITY;

-- Leads RLS
CREATE POLICY "Users can view leads in their workspace"
    ON public.leads FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.workspace_members wm
            WHERE wm.workspace_id = leads.workspace_id
            AND wm.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert leads in their workspace"
    ON public.leads FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.workspace_members wm
            WHERE wm.workspace_id = leads.workspace_id
            AND wm.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update leads in their workspace"
    ON public.leads FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.workspace_members wm
            WHERE wm.workspace_id = leads.workspace_id
            AND wm.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete leads in their workspace"
    ON public.leads FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.workspace_members wm
            WHERE wm.workspace_id = leads.workspace_id
            AND wm.user_id = auth.uid()
        )
    );

-- Lead Activities RLS
CREATE POLICY "Users can view lead activities in their workspace"
    ON public.lead_activities FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.workspace_members wm
            WHERE wm.workspace_id = lead_activities.workspace_id
            AND wm.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert lead activities in their workspace"
    ON public.lead_activities FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.workspace_members wm
            WHERE wm.workspace_id = lead_activities.workspace_id
            AND wm.user_id = auth.uid()
        )
    );

-- Webhook Endpoints RLS
CREATE POLICY "Users can view webhook endpoints in their workspace"
    ON public.webhook_endpoints FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.workspace_members wm
            WHERE wm.workspace_id = webhook_endpoints.workspace_id
            AND wm.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can manage webhook endpoints in their workspace"
    ON public.webhook_endpoints FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.workspace_members wm
            WHERE wm.workspace_id = webhook_endpoints.workspace_id
            AND wm.user_id = auth.uid()
        )
    );
