'use server';

import { createClient } from '@/lib/supabase/server';
import { getCurrentUser, requireWorkspaceAuth, requireWorkspaceOwner } from '@/lib/auth/workspace-context';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import type { WorkspaceRole } from '@/types/database';

const ACTIVE_WORKSPACE_COOKIE = 'flowpilot_active_workspace';

export interface WorkspaceActionResult {
  error?: string;
  success?: boolean;
  workspaceId?: string;
}

/**
 * Creates a new workspace and sets the current user as the Owner.
 */
export async function createWorkspaceAction(formData: FormData): Promise<WorkspaceActionResult> {
  const user = await getCurrentUser();
  if (!user) {
    return { error: 'You must be signed in to create a workspace.' };
  }

  const name = (formData.get('name') as string)?.trim();
  if (!name || name.length < 2) {
    return { error: 'Workspace name must be at least 2 characters long.' };
  }

  // Generate URL-friendly slug
  const baseSlug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
  const slug = `${baseSlug}-${Math.random().toString(36).substring(2, 7)}`;

  // Generate UUID in application layer so we don't need RETURNING select (which checks SELECT RLS before membership exists)
  const workspaceId = crypto.randomUUID();

  const supabase = await createClient();

  // 1. Insert Workspace
  const { error: wsError } = await supabase
    .from('workspaces')
    .insert({
      id: workspaceId,
      name,
      slug,
      is_demo_mode: true,
    } as unknown as never);

  if (wsError) {
    return { error: wsError.message || 'Failed to create workspace.' };
  }

  // 2. Insert User as Owner in workspace_members
  const { error: memberError } = await supabase
    .from('workspace_members')
    .insert({
      workspace_id: workspaceId,
      user_id: user.id,
      role: 'owner',
    } as unknown as never);

  if (memberError) {
    return { error: memberError.message };
  }

  // 3. Set Active Workspace Cookie
  const cookieStore = await cookies();
  cookieStore.set(ACTIVE_WORKSPACE_COOKIE, workspaceId, {
    path: '/',
    maxAge: 60 * 60 * 24 * 30, // 30 days
    httpOnly: true,
    sameSite: 'lax',
  });

  revalidatePath('/', 'layout');
  redirect('/overview');
}

/**
 * Switches the active workspace stored in cookies.
 */
export async function switchWorkspaceAction(workspaceId: string): Promise<void> {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/login');
  }

  const supabase = await createClient();

  // Verify membership before switching
  const { data, error } = await supabase
    .from('workspace_members')
    .select('id')
    .eq('workspace_id', workspaceId)
    .eq('user_id', user.id)
    .maybeSingle();

  if (error || !data) {
    throw new Error('Unauthorized: You are not a member of this workspace.');
  }

  const cookieStore = await cookies();
  cookieStore.set(ACTIVE_WORKSPACE_COOKIE, workspaceId, {
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
    httpOnly: true,
    sameSite: 'lax',
  });

  revalidatePath('/', 'layout');
  redirect('/overview');
}

/**
 * Updates workspace metadata (Name, demo mode flag).
 */
export async function updateWorkspaceAction(workspaceId: string, formData: FormData): Promise<WorkspaceActionResult> {
  await requireWorkspaceOwner();

  const name = (formData.get('name') as string)?.trim();
  const isDemoMode = formData.get('isDemoMode') === 'on';

  if (!name || name.length < 2) {
    return { error: 'Workspace name must be at least 2 characters long.' };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from('workspaces')
    .update({
      name,
      is_demo_mode: isDemoMode,
      updated_at: new Date().toISOString(),
    } as unknown as never)
    .eq('id', workspaceId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/settings');
  return { success: true };
}

/**
 * Invites / adds a member to the workspace.
 */
export async function inviteMemberAction(workspaceId: string, formData: FormData): Promise<WorkspaceActionResult> {
  await requireWorkspaceOwner();

  const email = (formData.get('email') as string)?.trim().toLowerCase();
  const role = (formData.get('role') as WorkspaceRole) || 'member';

  if (!email) {
    return { error: 'Email address is required.' };
  }

  const supabase = await createClient();

  // Lookup existing profile by email
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id')
    .eq('email', email)
    .maybeSingle();

  if (profileError || !profile) {
    return {
      error: 'User not found. The user must sign up for FlowPilot AI before being added to a workspace.',
    };
  }

  const profileId = (profile as unknown as { id: string }).id;

  // Insert membership
  const { error: insertError } = await supabase
    .from('workspace_members')
    .insert({
      workspace_id: workspaceId,
      user_id: profileId,
      role,
    } as unknown as never);

  if (insertError) {
    if (insertError.code === '23505') {
      return { error: 'This user is already a member of this workspace.' };
    }
    return { error: insertError.message };
  }

  revalidatePath('/settings');
  return { success: true };
}

/**
 * Updates a member's role (owner vs member).
 */
export async function updateMemberRoleAction(
  workspaceId: string,
  memberId: string,
  newRole: WorkspaceRole
): Promise<WorkspaceActionResult> {
  await requireWorkspaceOwner();

  const supabase = await createClient();
  const { error } = await supabase
    .from('workspace_members')
    .update({
      role: newRole,
      updated_at: new Date().toISOString(),
    } as unknown as never)
    .eq('id', memberId)
    .eq('workspace_id', workspaceId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/settings');
  return { success: true };
}

/**
 * Removes a member from the workspace.
 */
export async function removeMemberAction(workspaceId: string, memberId: string): Promise<WorkspaceActionResult> {
  const context = await requireWorkspaceAuth();

  const supabase = await createClient();

  // If the user is removing someone else, they must be an owner
  if (!context.isOwner) {
    // Check if the user is removing themselves
    const { data: member } = await supabase
      .from('workspace_members')
      .select('user_id')
      .eq('id', memberId)
      .single();

    if ((member as unknown as { user_id: string } | null)?.user_id !== context.user.id) {
      return { error: 'Unauthorized: Only workspace owners can remove other members.' };
    }
  }

  const { error } = await supabase
    .from('workspace_members')
    .delete()
    .eq('id', memberId)
    .eq('workspace_id', workspaceId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/settings');
  return { success: true };
}
