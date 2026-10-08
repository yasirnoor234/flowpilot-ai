-- =============================================================================
-- Migration: 20261007000002_fix_workspace_creation_rls.sql
-- Description: Add created_by column and enhance SELECT policy on workspaces table
-- =============================================================================

-- 1. Add created_by column to workspaces if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'workspaces' 
        AND column_name = 'created_by'
    ) THEN
        ALTER TABLE public.workspaces ADD COLUMN created_by UUID REFERENCES auth.users(id) DEFAULT auth.uid();
    END IF;
END $$;

-- 2. Update SELECT Policy on workspaces to permit creators and members
DROP POLICY IF EXISTS "Members can view their workspaces" ON public.workspaces;

CREATE POLICY "Members can view their workspaces"
    ON public.workspaces FOR SELECT
    USING (public.is_workspace_member(id) OR created_by = auth.uid());
