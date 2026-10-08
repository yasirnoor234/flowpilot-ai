-- =============================================================================
-- Migration: 20261008000001_workflow_execution_engine.sql
-- Description: Phase 3 schema for workflow_runs, workflow_step_runs, and trigger_events
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Trigger Events Table (Durable Event Ingestion & Idempotency)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.trigger_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    workflow_id UUID REFERENCES public.workflows(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL CHECK (event_type IN ('workflow.manual', 'workflow.webhook')),
    idempotency_key TEXT NOT NULL,
    payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    status TEXT NOT NULL DEFAULT 'received' CHECK (status IN ('received', 'dispatched', 'failed')),
    run_id UUID, -- References workflow_runs(id) below
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_trigger_event_idempotency UNIQUE (workspace_id, idempotency_key)
);

CREATE INDEX IF NOT EXISTS idx_trigger_events_workspace ON public.trigger_events(workspace_id);
CREATE INDEX IF NOT EXISTS idx_trigger_events_idempotency ON public.trigger_events(workspace_id, idempotency_key);

-- -----------------------------------------------------------------------------
-- 2. Workflow Runs Table (Immutable Execution Instances)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.workflow_runs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    workflow_id UUID NOT NULL REFERENCES public.workflows(id) ON DELETE CASCADE,
    workflow_version_id UUID NOT NULL REFERENCES public.workflow_versions(id) ON DELETE RESTRICT,
    trigger_type TEXT NOT NULL CHECK (trigger_type IN ('manual', 'webhook')),
    trigger_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    idempotency_key TEXT,
    status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'running', 'waiting', 'succeeded', 'failed', 'canceled')),
    error_message TEXT,
    parent_run_id UUID REFERENCES public.workflow_runs(id) ON DELETE SET NULL,
    started_at TIMESTAMPTZ,
    finished_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_workflow_runs_workspace ON public.workflow_runs(workspace_id);
CREATE INDEX IF NOT EXISTS idx_workflow_runs_workflow ON public.workflow_runs(workflow_id);
CREATE INDEX IF NOT EXISTS idx_workflow_runs_version ON public.workflow_runs(workflow_version_id);
CREATE INDEX IF NOT EXISTS idx_workflow_runs_status ON public.workflow_runs(status);
CREATE INDEX IF NOT EXISTS idx_workflow_runs_parent ON public.workflow_runs(parent_run_id);

-- Foreign key from trigger_events.run_id to workflow_runs.id
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_trigger_events_run'
    ) THEN
        ALTER TABLE public.trigger_events
        ADD CONSTRAINT fk_trigger_events_run
        FOREIGN KEY (run_id)
        REFERENCES public.workflow_runs(id)
        ON DELETE SET NULL;
    END IF;
END $$;

-- -----------------------------------------------------------------------------
-- 3. Workflow Step Runs Table (Granular Node Execution Steps)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.workflow_step_runs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    run_id UUID NOT NULL REFERENCES public.workflow_runs(id) ON DELETE CASCADE,
    workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    node_id TEXT NOT NULL,
    node_type TEXT NOT NULL,
    node_title TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'waiting', 'succeeded', 'failed', 'skipped')),
    input_data JSONB,
    output_data JSONB,
    error_message TEXT,
    retry_count INTEGER NOT NULL DEFAULT 0,
    duration_ms INTEGER,
    started_at TIMESTAMPTZ,
    finished_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_workflow_step_runs_run ON public.workflow_step_runs(run_id);
CREATE INDEX IF NOT EXISTS idx_workflow_step_runs_workspace ON public.workflow_step_runs(workspace_id);
CREATE INDEX IF NOT EXISTS idx_workflow_step_runs_node ON public.workflow_step_runs(run_id, node_id);

-- -----------------------------------------------------------------------------
-- 4. Row Level Security (RLS) Policies
-- -----------------------------------------------------------------------------
ALTER TABLE public.trigger_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflow_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflow_step_runs ENABLE ROW LEVEL SECURITY;

-- Trigger Events RLS
CREATE POLICY "Members can view trigger events in workspace"
    ON public.trigger_events FOR SELECT
    USING (public.is_workspace_member(workspace_id));

CREATE POLICY "Members can insert trigger events in workspace"
    ON public.trigger_events FOR INSERT
    WITH CHECK (public.is_workspace_member(workspace_id));

CREATE POLICY "Members can update trigger events in workspace"
    ON public.trigger_events FOR UPDATE
    USING (public.is_workspace_member(workspace_id))
    WITH CHECK (public.is_workspace_member(workspace_id));

-- Workflow Runs RLS
CREATE POLICY "Members can view workflow runs in workspace"
    ON public.workflow_runs FOR SELECT
    USING (public.is_workspace_member(workspace_id));

CREATE POLICY "Members can insert workflow runs in workspace"
    ON public.workflow_runs FOR INSERT
    WITH CHECK (public.is_workspace_member(workspace_id));

CREATE POLICY "Members can update workflow runs in workspace"
    ON public.workflow_runs FOR UPDATE
    USING (public.is_workspace_member(workspace_id))
    WITH CHECK (public.is_workspace_member(workspace_id));

CREATE POLICY "Members can delete workflow runs in workspace"
    ON public.workflow_runs FOR DELETE
    USING (public.is_workspace_member(workspace_id));

-- Workflow Step Runs RLS
CREATE POLICY "Members can view workflow step runs in workspace"
    ON public.workflow_step_runs FOR SELECT
    USING (public.is_workspace_member(workspace_id));

CREATE POLICY "Members can insert workflow step runs in workspace"
    ON public.workflow_step_runs FOR INSERT
    WITH CHECK (public.is_workspace_member(workspace_id));

CREATE POLICY "Members can update workflow step runs in workspace"
    ON public.workflow_step_runs FOR UPDATE
    USING (public.is_workspace_member(workspace_id))
    WITH CHECK (public.is_workspace_member(workspace_id));

CREATE POLICY "Members can delete workflow step runs in workspace"
    ON public.workflow_step_runs FOR DELETE
    USING (public.is_workspace_member(workspace_id));
