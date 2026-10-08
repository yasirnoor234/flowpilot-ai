import React from 'react';
import { requireWorkspaceAuth, getUserWorkspaces } from '@/lib/auth/workspace-context';
import { Sidebar } from '@/components/dashboard/sidebar';
import { Header } from '@/components/dashboard/header';
import { SandboxBanner } from '@/components/dashboard/sandbox-banner';

export const dynamic = 'force-dynamic';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Enforces user session and active workspace context server-side
  const context = await requireWorkspaceAuth();
  const allWorkspaces = await getUserWorkspaces(context.user.id);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex">
      {/* Sidebar Navigation */}
      <Sidebar
        currentWorkspace={context.workspace}
        userRole={context.role}
        allWorkspaces={allWorkspaces}
        currentUser={context.user}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-x-hidden">
        <SandboxBanner
          workspaceId={context.workspace.id}
          isDemoMode={context.workspace.is_demo_mode}
        />
        <Header
          workspaceName={context.workspace.name}
          isDemoMode={context.workspace.is_demo_mode}
        />
        <main className="flex-1 p-6 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
