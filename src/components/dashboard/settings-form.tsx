'use client';

import React, { useState } from 'react';
import type { Workspace, WorkspaceMember, WorkspaceRole } from '@/types/database';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  updateWorkspaceAction,
  inviteMemberAction,
  updateMemberRoleAction,
  removeMemberAction,
} from '@/lib/actions/workspaces';
import { Building2, Users, UserPlus, Trash2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { getInitials } from '@/lib/utils';

interface SettingsFormProps {
  workspace: Workspace;
  members: WorkspaceMember[];
  currentUserId: string;
  isOwner: boolean;
}

export function SettingsForm({
  workspace,
  members,
  currentUserId,
  isOwner,
}: SettingsFormProps) {
  const [workspaceMessage, setWorkspaceMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [memberMessage, setMemberMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [isUpdatingWorkspace, setIsUpdatingWorkspace] = useState(false);
  const [isInviting, setIsInviting] = useState(false);

  async function handleWorkspaceUpdate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setWorkspaceMessage(null);
    setIsUpdatingWorkspace(true);

    const formData = new FormData(e.currentTarget);
    try {
      const result = await updateWorkspaceAction(workspace.id, formData);
      if (result.error) {
        setWorkspaceMessage({ text: result.error, type: 'error' });
      } else {
        setWorkspaceMessage({ text: 'Workspace settings updated successfully.', type: 'success' });
      }
    } catch (err: unknown) {
      setWorkspaceMessage({
        text: err instanceof Error ? err.message : 'Failed to update workspace.',
        type: 'error',
      });
    } finally {
      setIsUpdatingWorkspace(false);
    }
  }

  async function handleInviteMember(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMemberMessage(null);
    setIsInviting(true);

    const form = e.currentTarget;
    const formData = new FormData(form);
    try {
      const result = await inviteMemberAction(workspace.id, formData);
      if (result.error) {
        setMemberMessage({ text: result.error, type: 'error' });
      } else {
        setMemberMessage({ text: 'Member added to workspace.', type: 'success' });
        form.reset();
      }
    } catch (err: unknown) {
      setMemberMessage({
        text: err instanceof Error ? err.message : 'Failed to add member.',
        type: 'error',
      });
    } finally {
      setIsInviting(false);
    }
  }

  async function handleRoleChange(memberId: string, newRole: WorkspaceRole) {
    try {
      const result = await updateMemberRoleAction(workspace.id, memberId, newRole);
      if (result.error) {
        alert(result.error);
      }
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to update member role.');
    }
  }

  async function handleRemoveMember(memberId: string, memberEmail?: string) {
    if (!confirm(`Are you sure you want to remove ${memberEmail || 'this member'} from the workspace?`)) {
      return;
    }
    try {
      const result = await removeMemberAction(workspace.id, memberId);
      if (result.error) {
        alert(result.error);
      }
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to remove member.');
    }
  }

  return (
    <div className="space-y-8">
      {/* 1. General Workspace Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base text-zinc-900 flex items-center gap-2">
            <Building2 className="h-4 w-4 text-zinc-500" />
            <span>Workspace profile</span>
          </CardTitle>
          <CardDescription className="text-xs text-zinc-500">
            Manage workspace name and execution preferences.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleWorkspaceUpdate} className="space-y-4 max-w-xl">
            {workspaceMessage && (
              <div
                className={`flex items-center gap-2 rounded-lg p-3 text-xs ${
                  workspaceMessage.type === 'success'
                    ? 'border border-emerald-200 bg-emerald-50 text-emerald-800'
                    : 'border border-red-200 bg-red-50 text-red-800'
                }`}
              >
                {workspaceMessage.type === 'success' ? (
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                ) : (
                  <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
                )}
                <span>{workspaceMessage.text}</span>
              </div>
            )}

            <Input
              id="name"
              name="name"
              label="Workspace Name"
              defaultValue={workspace.name}
              required
              disabled={!isOwner}
            />

            <div className="space-y-1">
              <label className="block text-xs font-medium text-zinc-700">
                Workspace slug
              </label>
              <div className="text-xs font-mono bg-zinc-50 px-3 py-2 rounded-lg border border-zinc-200 text-zinc-600">
                {workspace.slug}
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <input
                id="isDemoMode"
                name="isDemoMode"
                type="checkbox"
                defaultChecked={workspace.is_demo_mode}
                disabled={!isOwner}
                className="h-4 w-4 rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500"
              />
              <label htmlFor="isDemoMode" className="text-xs text-zinc-700 cursor-pointer">
                Enable demo adapters (runs simulation OpenAI, Resend, and Slack without live API keys)
              </label>
            </div>

            {isOwner && (
              <div className="pt-2">
                <Button type="submit" size="sm" isLoading={isUpdatingWorkspace}>
                  Save changes
                </Button>
              </div>
            )}
          </form>
        </CardContent>
      </Card>

      {/* 2. Team Member Management */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base text-zinc-900 flex items-center gap-2">
            <Users className="h-4 w-4 text-zinc-500" />
            <span>Workspace members ({members.length})</span>
          </CardTitle>
          <CardDescription className="text-xs text-zinc-500">
            Manage who has access to this workspace and assign roles.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Invite Member Section (Owners Only) */}
          {isOwner && (
            <form onSubmit={handleInviteMember} className="p-4 rounded-xl border border-zinc-200 bg-zinc-50 space-y-3">
              <h4 className="text-xs font-semibold text-zinc-900 flex items-center gap-1.5">
                <UserPlus className="h-3.5 w-3.5 text-zinc-500" />
                <span>Add member to workspace</span>
              </h4>

              {memberMessage && (
                <div
                  className={`flex items-center gap-2 rounded-lg p-2.5 text-xs ${
                    memberMessage.type === 'success'
                      ? 'border border-emerald-200 bg-emerald-50 text-emerald-800'
                      : 'border border-red-200 bg-red-50 text-red-800'
                  }`}
                >
                  {memberMessage.type === 'success' ? (
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                  ) : (
                    <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
                  )}
                  <span>{memberMessage.text}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <Input
                    name="email"
                    type="email"
                    placeholder="teammate@company.com"
                    required
                  />
                </div>
                <div>
                  <select
                    name="role"
                    defaultValue="member"
                    className="flex h-10 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="member">Member</option>
                    <option value="owner">Owner</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end">
                <Button type="submit" size="sm" isLoading={isInviting}>
                  Add member
                </Button>
              </div>
            </form>
          )}

          {/* Members List Table */}
          <div className="divide-y divide-zinc-100 rounded-xl border border-zinc-200 overflow-hidden">
            {members.map((member) => {
              const isCurrentUser = member.user_id === currentUserId;
              return (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-3.5 hover:bg-zinc-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-zinc-100 border border-zinc-200 flex items-center justify-center text-xs font-semibold text-zinc-700">
                      {getInitials(member.profile?.full_name || member.profile?.email)}
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-zinc-900 flex items-center gap-2">
                        <span>{member.profile?.full_name || member.profile?.email?.split('@')[0] || 'Member'}</span>
                        {isCurrentUser && (
                          <Badge variant="secondary" className="text-[10px] py-0 font-normal">You</Badge>
                        )}
                      </div>
                      <div className="text-[11px] text-zinc-500">
                        {member.profile?.email || '—'}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {isOwner && !isCurrentUser ? (
                      <select
                        value={member.role}
                        onChange={(e) => handleRoleChange(member.id, e.target.value as WorkspaceRole)}
                        className="rounded-lg border border-zinc-300 bg-white px-2.5 py-1 text-xs text-zinc-700 focus:border-indigo-500 focus:outline-none"
                      >
                        <option value="owner">Owner</option>
                        <option value="member">Member</option>
                      </select>
                    ) : (
                      <Badge variant={member.role === 'owner' ? 'primary' : 'secondary'} className="capitalize">
                        {member.role}
                      </Badge>
                    )}

                    {isOwner && !isCurrentUser && (
                      <button
                        onClick={() => handleRemoveMember(member.id, member.profile?.email)}
                        className="h-8 w-8 rounded-lg flex items-center justify-center text-zinc-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                        title="Remove member"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

