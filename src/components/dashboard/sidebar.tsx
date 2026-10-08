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
  Bot,
  Sparkles,
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
    <aside className="w-64 shrink-0 bg-zinc-950/90 border-r border-zinc-800/80 flex flex-col justify-between h-screen sticky top-0 backdrop-blur-xl selection:bg-indigo-500 selection:text-white">
      {/* Top Header & Workspace Switcher */}
      <div className="p-4 space-y-4">
        {/* Brand Logo */}
        <Link href="/overview" className="flex items-center gap-2.5 px-1 group">
          <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform">
            <Bot className="h-4 w-4 text-white" />
          </div>
          <div>
            <div className="text-sm font-bold tracking-tight text-white flex items-center gap-1.5">
              FlowPilot <span className="text-indigo-400 font-medium text-xs">AI</span>
            </div>
            <div className="text-[10px] text-zinc-500 font-medium">Small Business Automation</div>
          </div>
        </Link>

        {/* Workspace Switcher */}
        <WorkspaceSwitcher
          currentWorkspace={currentWorkspace}
          userRole={userRole}
          allWorkspaces={allWorkspaces}
        />

        {/* Demo Mode Badge */}
        {currentWorkspace.is_demo_mode && (
          <div className="px-3 py-1.5 rounded-lg bg-indigo-950/40 border border-indigo-500/20 flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-[11px] text-indigo-300 font-medium">
              <Sparkles className="h-3 w-3 text-indigo-400" />
              <span>Demo Adapters Active</span>
            </div>
            <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-mono font-semibold">
              SANDBOX
            </span>
          </div>
        )}

        {/* Navigation Links */}
        <nav className="space-y-1 pt-2">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900/80'
                }`}
              >
                <Icon className={`h-4 w-4 ${isActive ? 'text-white' : 'text-zinc-400'}`} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer / User Profile & Logout */}
      <div className="p-4 border-t border-zinc-900 space-y-3">
        {/* User Card */}
        <div className="flex items-center justify-between px-2 py-1.5">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="h-7 w-7 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-[10px] font-bold text-zinc-200">
              {getInitials(currentUser.fullName || currentUser.email)}
            </div>
            <div className="truncate">
              <div className="text-xs font-medium text-zinc-200 truncate">
                {currentUser.fullName || currentUser.email.split('@')[0]}
              </div>
              <div className="text-[10px] text-zinc-500 truncate">
                {currentUser.email}
              </div>
            </div>
          </div>

          <form action={signOutAction}>
            <button
              type="submit"
              title="Sign Out"
              className="h-8 w-8 rounded-lg flex items-center justify-center text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </form>
        </div>
      </div>
    </aside>
  );
}
