-- =============================================================================
-- Migration: 20261007000001_initial_auth_and_workspaces.sql
-- Description: Phase 1 schema for Profiles, Workspaces, and Workspace Members with RLS
-- =============================================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- -----------------------------------------------------------------------------
-- 1. Profiles Table (extends auth.users)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- -----------------------------------------------------------------------------
-- 2. Workspaces Table
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.workspaces (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    is_demo_mode BOOLEAN NOT NULL DEFAULT true,
    created_by UUID REFERENCES auth.users(id) DEFAULT auth.uid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for faster slug lookups
CREATE INDEX IF NOT EXISTS idx_workspaces_slug ON public.workspaces(slug);

-- -----------------------------------------------------------------------------
-- 3. Workspace Members Table
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.workspace_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('owner', 'member')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_workspace_member UNIQUE (workspace_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_workspace_members_user_id ON public.workspace_members(user_id);
CREATE INDEX IF NOT EXISTS idx_workspace_members_workspace_id ON public.workspace_members(workspace_id);

-- -----------------------------------------------------------------------------
-- 4. Helper Functions for Security & RLS
-- -----------------------------------------------------------------------------

-- Helper function: Check if authenticated user is a member of a specific workspace
CREATE OR REPLACE FUNCTION public.is_workspace_member(ws_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1
        FROM public.workspace_members
        WHERE workspace_id = ws_id
        AND user_id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function: Check if authenticated user is an owner of a specific workspace
CREATE OR REPLACE FUNCTION public.is_workspace_owner(ws_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1
        FROM public.workspace_members
        WHERE workspace_id = ws_id
        AND user_id = auth.uid()
        AND role = 'owner'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger function: Auto-create profile on auth.users sign up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, avatar_url)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
        NEW.raw_user_meta_data->>'avatar_url'
    )
    ON CONFLICT (id) DO UPDATE
    SET email = EXCLUDED.email,
        full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
        updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Attach trigger to auth.users (Supabase auth table)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT OR UPDATE OF email, raw_user_meta_data ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- -----------------------------------------------------------------------------
-- 5. Row Level Security (RLS) Policies
-- -----------------------------------------------------------------------------

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_members ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------------------------
-- Profiles Policies
-- -----------------------------------------------------------------------------
-- Users can view their own profile
CREATE POLICY "Users can view own profile"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id);

-- Workspace members can view profiles of other members in shared workspaces
CREATE POLICY "Members can view peers profiles"
    ON public.profiles FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.workspace_members m1
            JOIN public.workspace_members m2 ON m1.workspace_id = m2.workspace_id
            WHERE m1.user_id = auth.uid() AND m2.user_id = public.profiles.id
        )
    );

-- -----------------------------------------------------------------------------
-- Workspaces Policies
-- -----------------------------------------------------------------------------
-- Authenticated users can view workspaces they belong to or created
CREATE POLICY "Members can view their workspaces"
    ON public.workspaces FOR SELECT
    USING (public.is_workspace_member(id) OR created_by = auth.uid());

-- Authenticated users can create new workspaces
CREATE POLICY "Authenticated users can create workspaces"
    ON public.workspaces FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);

-- Only workspace owners can update workspace settings
CREATE POLICY "Owners can update their workspaces"
    ON public.workspaces FOR UPDATE
    USING (public.is_workspace_owner(id))
    WITH CHECK (public.is_workspace_owner(id));

-- Only workspace owners can delete workspaces
CREATE POLICY "Owners can delete their workspaces"
    ON public.workspaces FOR DELETE
    USING (public.is_workspace_owner(id));

-- -----------------------------------------------------------------------------
-- Workspace Members Policies
-- -----------------------------------------------------------------------------
-- Members can view other members in the same workspace
CREATE POLICY "Members can view workspace member list"
    ON public.workspace_members FOR SELECT
    USING (public.is_workspace_member(workspace_id));

-- Users can insert themselves as an owner when creating a workspace,
-- or workspace owners can add new members
CREATE POLICY "Owners and creators can add members"
    ON public.workspace_members FOR INSERT
    WITH CHECK (
        auth.uid() IS NOT NULL AND (
            -- Either the user is adding themselves during initial creation
            user_id = auth.uid()
            OR
            -- Or the user is an owner of the existing workspace
            public.is_workspace_owner(workspace_id)
        )
    );

-- Workspace owners can update member roles
CREATE POLICY "Owners can update member roles"
    ON public.workspace_members FOR UPDATE
    USING (public.is_workspace_owner(workspace_id))
    WITH CHECK (public.is_workspace_owner(workspace_id));

-- Workspace owners can remove members, or members can leave (remove themselves)
CREATE POLICY "Owners can delete members or users can leave"
    ON public.workspace_members FOR DELETE
    USING (
        public.is_workspace_owner(workspace_id)
        OR
        user_id = auth.uid()
    );
