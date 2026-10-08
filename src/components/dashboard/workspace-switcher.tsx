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
        className="w-full flex items-center justify-between gap-3 px-3 py-2 rounded-xl bg-zinc-900/80 hover:bg-zinc-800/80 border border-zinc-800 text-left transition-all group"
      >
        <div className="flex items-center gap-2.5 overflow-hidden">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shrink-0 text-white font-bold text-xs shadow-sm">
            {currentWorkspace.name.substring(0, 2).toUpperCase()}
          </div>
          <div className="truncate">
            <div className="text-xs font-semibold text-zinc-100 truncate group-hover:text-indigo-300 transition-colors">
              {currentWorkspace.name}
            </div>
            <div className="text-[10px] text-zinc-400 capitalize flex items-center gap-1">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400" />
              {userRole}
            </div>
          </div>
        </div>
        <ChevronsUpDown className="h-4 w-4 text-zinc-500 shrink-0 group-hover:text-zinc-300" />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute top-full left-0 right-0 mt-2 z-50 rounded-xl border border-zinc-800 bg-zinc-900 shadow-2xl p-1.5 backdrop-blur-xl animate-in fade-in zoom-in-95 duration-100">
            <div className="px-2 py-1.5 text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">
              Workspaces ({allWorkspaces.length})
            </div>

            <div className="space-y-1 max-h-56 overflow-y-auto">
              {allWorkspaces.map(({ workspace }) => {
                const isSelected = workspace.id === currentWorkspace.id;
                return (
                  <button
                    key={workspace.id}
                    onClick={() => handleSelectWorkspace(workspace.id)}
                    className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs transition-colors ${
                      isSelected
                        ? 'bg-indigo-600/15 text-indigo-300 font-medium'
                        : 'text-zinc-300 hover:bg-zinc-800/80 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <Building2 className="h-3.5 w-3.5 shrink-0 text-zinc-400" />
                      <span className="truncate">{workspace.name}</span>
                    </div>
                    {isSelected && <Check className="h-3.5 w-3.5 text-indigo-400 shrink-0" />}
                  </button>
                );
              })}
            </div>

            <div className="mt-1 pt-1 border-t border-zinc-800/80">
              <Link
                href="/onboarding"
                onClick={() => setIsOpen(false)}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-indigo-400 hover:bg-indigo-500/10 transition-colors font-medium"
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
