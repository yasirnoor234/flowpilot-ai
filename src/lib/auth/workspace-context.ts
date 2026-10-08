import { createClient } from '@/lib/supabase/server';
import type { Workspace, WorkspaceRole, UserWorkspaceAccess } from '@/types/database';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export interface CurrentWorkspaceContext {
  user: {
    id: string;
    email: string;
    fullName: string | null;
  };
  workspace: Workspace;
  role: WorkspaceRole;
  isOwner: boolean;
}

const ACTIVE_WORKSPACE_COOKIE = 'flowpilot_active_workspace';

/**
 * Retrieves the currently authenticated user from Supabase auth.
 */
export async function getCurrentUser() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  return {
    id: user.id,
    email: user.email ?? '',
    fullName: (user.user_metadata?.full_name as string) || (user.user_metadata?.name as string) || null,
    avatarUrl: (user.user_metadata?.avatar_url as string) || null,
  };
}

interface WorkspaceMemberRow {
  role: WorkspaceRole;
  workspaces: Workspace | null;
}

/**
 * Retrieves all workspaces the user is a member of.
 */
export async function getUserWorkspaces(userId: string): Promise<UserWorkspaceAccess[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('workspace_members')
    .select(`
      role,
      workspaces (
        id,
        name,
        slug,
        is_demo_mode,
        created_at,
        updated_at
      )
    `)
    .eq('user_id', userId);

  if (error || !data) {
    return [];
  }

  const rows = data as unknown as WorkspaceMemberRow[];

  return rows
    .filter((row): row is WorkspaceMemberRow & { workspaces: Workspace } => row.workspaces !== null)
    .map((row) => ({
      workspace: row.workspaces,
      role: row.role,
    }));
}

/**
 * Retrieves the active workspace context for the current user.
 * If user has no workspace, returns null.
 */
export async function getActiveWorkspaceContext(): Promise<CurrentWorkspaceContext | null> {
  const user = await getCurrentUser();
  if (!user) {
    return null;
  }

  const userWorkspaces = await getUserWorkspaces(user.id);

  if (userWorkspaces.length === 0) {
    return null;
  }

  const cookieStore = await cookies();
  const storedWorkspaceId = cookieStore.get(ACTIVE_WORKSPACE_COOKIE)?.value;

  const activeAccess =
    userWorkspaces.find((w) => w.workspace.id === storedWorkspaceId) || userWorkspaces[0];

  return {
    user: {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
    },
    workspace: activeAccess.workspace,
    role: activeAccess.role,
    isOwner: activeAccess.role === 'owner',
  };
}

/**
 * Server-side guard to strictly enforce workspace authorization.
 * Redirects unauthenticated users to /login and users without workspaces to /onboarding.
 */
export async function requireWorkspaceAuth(): Promise<CurrentWorkspaceContext> {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/login');
  }

  const context = await getActiveWorkspaceContext();
  if (!context) {
    redirect('/onboarding');
  }

  return context;
}

/**
 * Server-side guard requiring workspace Owner role.
 */
export async function requireWorkspaceOwner(): Promise<CurrentWorkspaceContext> {
  const context = await requireWorkspaceAuth();
  if (!context.isOwner) {
    throw new Error('Unauthorized: This action requires workspace owner privileges.');
  }
  return context;
}
