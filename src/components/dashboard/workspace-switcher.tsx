'use client';

import React, { useState, useTransition } from 'react';
import type { Workspace, WorkspaceRole, UserWorkspaceAccess } from '@/types/database';
import { switchWorkspaceAction } from '@/lib/actions/workspaces';
import { Building2, Check, ChevronsUpDown, Plus } from 'lucide-react';
import Link from 'next/link';

interface WorkspaceSwitcherProps {
  currentWorkspace: Workspace;
  userRole: WorkspaceRole;
  allWorkspaces: UserWorkspaceAccess[];
}

export function WorkspaceSwitcher({
  currentWorkspace,
  userRole,
  allWorkspaces,
}: WorkspaceSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleSelectWorkspace = (workspaceId: string) => {
    if (workspaceId === currentWorkspace.id) {
      setIsOpen(false);
      return;
    }

    startTransition(async () => {
      setIsOpen(false);
      await switchWorkspaceAction(workspaceId);
    });
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isPending}
        className="w-full flex items-center justify-between gap-2.5 px-3 py-2 rounded-lg bg-zinc-50 hover:bg-zinc-100/80 border border-zinc-200/80 text-left transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="h-6 w-6 rounded-md bg-indigo-600 flex items-center justify-center shrink-0 text-white font-semibold text-[11px] shadow-xs">
            {currentWorkspace.name.substring(0, 2).toUpperCase()}
          </div>
          <div className="min-w-0">
            <div className="text-xs font-semibold text-zinc-900 truncate">
              {currentWorkspace.name}
            </div>
            <div className="text-[10px] text-zinc-500 capitalize flex items-center gap-1">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />
              {userRole}
            </div>
          </div>
        </div>
        <ChevronsUpDown className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute top-full left-0 right-0 mt-1.5 z-50 rounded-lg border border-zinc-200 bg-white shadow-lg p-1 animate-in fade-in zoom-in-95 duration-100">
            <div className="px-2 py-1 text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">
              Workspaces ({allWorkspaces.length})
            </div>

            <div className="space-y-0.5 max-h-56 overflow-y-auto">
              {allWorkspaces.map(({ workspace }) => {
                const isSelected = workspace.id === currentWorkspace.id;
                return (
                  <button
                    key={workspace.id}
                    onClick={() => handleSelectWorkspace(workspace.id)}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-indigo-50 text-indigo-700 font-medium'
                        : 'text-zinc-700 hover:bg-zinc-50'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <Building2 className="h-3.5 w-3.5 shrink-0 text-zinc-400" />
                      <span className="truncate">{workspace.name}</span>
                    </div>
                    {isSelected && <Check className="h-3.5 w-3.5 text-indigo-600 shrink-0" />}
                  </button>
                );
              })}
            </div>

            <div className="mt-1 pt-1 border-t border-zinc-100">
              <Link
                href="/onboarding"
                onClick={() => setIsOpen(false)}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs text-indigo-600 hover:bg-indigo-50 transition-colors font-medium"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Create New Workspace</span>
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
