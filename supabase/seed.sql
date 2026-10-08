-- =============================================================================
-- FlowPilot AI: Local & Test Seed Script
-- =============================================================================

-- Note: In local Supabase development, auth.users contains pre-seeded or newly created test accounts.
-- This script creates demo workspaces and memberships for testing multi-tenancy and workspace isolation.

DO $$
DECLARE
    demo_ws_id UUID := 'a0000000-0000-0000-0000-000000000001'::UUID;
    agency_ws_id UUID := 'a0000000-0000-0000-0000-000000000002'::UUID;
BEGIN
    -- 1. Create Demo Workspace
    INSERT INTO public.workspaces (id, name, slug, is_demo_mode)
    VALUES (demo_ws_id, 'Acme Corp Automation', 'acme-corp', true)
    ON CONFLICT (id) DO NOTHING;

    -- 2. Create Second Isolated Workspace (for cross-tenant testing)
    INSERT INTO public.workspaces (id, name, slug, is_demo_mode)
    VALUES (agency_ws_id, 'Peak Growth Agency', 'peak-growth', true)
    ON CONFLICT (id) DO NOTHING;

    RAISE NOTICE 'Seeded sample workspaces successfully.';
END $$;
