'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { Workspace, WorkspaceRole, UserWorkspaceAccess } from '@/types/database';
import { WorkspaceSwitcher } from './workspace-switcher';
import { signOutAction } from '@/lib/actions/auth';
import { getInitials } from '@/lib/utils';
import {
  LayoutDashboard,
  GitFork,
  Users,
  PlugZap,
  Activity,
  Settings,
  LogOut,
  Workflow,
} from 'lucide-react';

interface SidebarProps {
  currentWorkspace: Workspace;
  userRole: WorkspaceRole;
  allWorkspaces: UserWorkspaceAccess[];
  currentUser: {
    id: string;
    email: string;
    fullName: string | null;
  };
}

const NAV_ITEMS = [
  { label: 'Overview', href: '/overview', icon: LayoutDashboard },
  { label: 'Workflows', href: '/workflows', icon: GitFork },
  { label: 'Leads', href: '/leads', icon: Users },
  { label: 'Integrations', href: '/integrations', icon: PlugZap },
  { label: 'Runs', href: '/runs', icon: Activity },
  { label: 'Settings', href: '/settings', icon: Settings },
];

export function Sidebar({
  currentWorkspace,
  userRole,
  allWorkspaces,
  currentUser,
}: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="w-60 shrink-0 bg-white border-r border-zinc-200/80 flex flex-col justify-between h-screen sticky top-0 z-30">
      {/* Top Header & Navigation */}
      <div className="p-4 space-y-4">
        {/* Brand Logo */}
        <Link href="/overview" className="flex items-center gap-2.5 px-2 py-1 group">
          <div className="h-7 w-7 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-xs">
            <Workflow className="h-4 w-4" />
          </div>
          <div>
            <div className="text-sm font-semibold tracking-tight text-zinc-900 leading-tight">
              FlowPilot <span className="text-indigo-600 font-normal">AI</span>
            </div>
            <div className="text-[11px] text-zinc-500 font-normal">Workflow Automation</div>
          </div>
        </Link>

        {/* Workspace Switcher */}
        <div className="pt-1">
          <WorkspaceSwitcher
            currentWorkspace={currentWorkspace}
            userRole={userRole}
            allWorkspaces={allWorkspaces}
          />
        </div>

        {/* Navigation Links */}
        <nav className="space-y-1 pt-3">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                  isActive
                    ? 'bg-indigo-50 text-indigo-700 font-semibold'
                    : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50'
                }`}
              >
                <Icon className={`h-4 w-4 shrink-0 ${isActive ? 'text-indigo-600' : 'text-zinc-400'}`} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Account & User Controls at bottom */}
      <div className="p-4 border-t border-zinc-200/80 bg-zinc-50/50">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="h-7 w-7 rounded-full bg-zinc-200 text-zinc-700 flex items-center justify-center text-[11px] font-semibold shrink-0">
              {getInitials(currentUser.fullName || currentUser.email)}
            </div>
            <div className="min-w-0">
              <div className="text-xs font-medium text-zinc-900 truncate">
                {currentUser.fullName || currentUser.email.split('@')[0]}
              </div>
              <div className="text-[11px] text-zinc-500 truncate">
                {currentUser.email}
              </div>
            </div>
          </div>

          <form action={signOutAction}>
            <button
              type="submit"
              className="p-1.5 rounded-md text-zinc-400 hover:text-zinc-700 hover:bg-zinc-200/60 transition-colors cursor-pointer"
              title="Sign Out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </form>
        </div>
      </div>
    </aside>
  );
}
