import React from 'react';
import { requireWorkspaceAuth } from '@/lib/auth/workspace-context';
import { createClient } from '@/lib/supabase/server';
import { SettingsForm } from '@/components/dashboard/settings-form';
import { PageHeader } from '@/components/ui/page-header';
import type { WorkspaceMember, Profile, WorkspaceRole } from '@/types/database';

interface MemberDbRow {
  id: string;
  workspace_id: string;
  user_id: string;
  role: WorkspaceRole;
  created_at: string;
  updated_at: string;
  profiles: Profile | null;
}

export default async function SettingsPage() {
  const context = await requireWorkspaceAuth();
  const supabase = await createClient();

  // Query workspace members joined with profiles (enforced by RLS)
  const { data: membersData } = await supabase
    .from('workspace_members')
    .select(`
      id,
      workspace_id,
      user_id,
      role,
      created_at,
      updated_at,
      profiles (
        id,
        email,
        full_name,
        avatar_url,
        created_at,
        updated_at
      )
    `)
    .eq('workspace_id', context.workspace.id);

  const rows = (membersData || []) as unknown as MemberDbRow[];

  const formattedMembers: WorkspaceMember[] = rows.map((row) => ({
    id: row.id,
    workspace_id: row.workspace_id,
    user_id: row.user_id,
    role: row.role,
    created_at: row.created_at,
    updated_at: row.updated_at,
    profile: row.profiles ?? undefined,
  }));

  return (
    <div className="space-y-8">
      <PageHeader
        title="Settings"
        description={`Configure ${context.workspace.name} details, team permissions, and workspace preferences.`}
      />

      <SettingsForm
        workspace={context.workspace}
        members={formattedMembers}
        currentUserId={context.user.id}
        isOwner={context.isOwner}
      />
    </div>
  );
}

