-- =============================================================================
-- Migration: 20261007000003_workflows_and_versions.sql
-- Description: Phase 2 schema for Workflows and Immutable Workflow Versions with RLS
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Workflows Table
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.workflows (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'inactive', 'archived')),
    webhook_slug TEXT UNIQUE,
    draft_graph JSONB NOT NULL DEFAULT '{"nodes": [], "edges": []}'::jsonb,
    active_version_id UUID, -- References workflow_versions(id), circular FK resolved below
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_workflows_workspace_id ON public.workflows(workspace_id);
CREATE INDEX IF NOT EXISTS idx_workflows_status ON public.workflows(status);
CREATE INDEX IF NOT EXISTS idx_workflows_webhook_slug ON public.workflows(webhook_slug);

-- -----------------------------------------------------------------------------
-- 2. Workflow Versions Table (Immutable Published Snapshots)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.workflow_versions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    workflow_id UUID NOT NULL REFERENCES public.workflows(id) ON DELETE CASCADE,
    version_number INTEGER NOT NULL,
    compiled_graph JSONB NOT NULL,
    raw_graph JSONB NOT NULL,
    change_summary TEXT,
    published_by UUID REFERENCES auth.users(id),
    published_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_workflow_version UNIQUE (workflow_id, version_number)
);

CREATE INDEX IF NOT EXISTS idx_workflow_versions_workflow_id ON public.workflow_versions(workflow_id);
CREATE INDEX IF NOT EXISTS idx_workflow_versions_workspace_id ON public.workflow_versions(workspace_id);

-- Add foreign key constraint from workflows.active_version_id to workflow_versions(id)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_workflows_active_version'
    ) THEN
        ALTER TABLE public.workflows
        ADD CONSTRAINT fk_workflows_active_version
        FOREIGN KEY (active_version_id)
        REFERENCES public.workflow_versions(id)
        ON DELETE SET NULL;
    END IF;
END $$;

-- -----------------------------------------------------------------------------
-- 3. Row Level Security (RLS) Policies
-- -----------------------------------------------------------------------------

ALTER TABLE public.workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflow_versions ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------------------------
-- Workflows RLS Policies
-- -----------------------------------------------------------------------------
CREATE POLICY "Members can view workflows in workspace"
    ON public.workflows FOR SELECT
    USING (public.is_workspace_member(workspace_id));

CREATE POLICY "Members can insert workflows in workspace"
    ON public.workflows FOR INSERT
    WITH CHECK (public.is_workspace_member(workspace_id));

CREATE POLICY "Members can update workflows in workspace"
    ON public.workflows FOR UPDATE
    USING (public.is_workspace_member(workspace_id))
    WITH CHECK (public.is_workspace_member(workspace_id));

CREATE POLICY "Members can delete workflows in workspace"
    ON public.workflows FOR DELETE
    USING (public.is_workspace_member(workspace_id));

-- -----------------------------------------------------------------------------
-- Workflow Versions RLS Policies (Read-Only Once Published)
-- -----------------------------------------------------------------------------
CREATE POLICY "Members can view workflow versions in workspace"
    ON public.workflow_versions FOR SELECT
    USING (public.is_workspace_member(workspace_id));

CREATE POLICY "Members can create published versions"
    ON public.workflow_versions FOR INSERT
    WITH CHECK (public.is_workspace_member(workspace_id));

-- Note: No UPDATE policy on workflow_versions -> strictly immutable!
CREATE POLICY "Owners can delete workflow versions when removing workflow"
    ON public.workflow_versions FOR DELETE
    USING (public.is_workspace_member(workspace_id));
