'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { Plus } from 'lucide-react';
import Link from 'next/link';

interface HeaderProps {
  workspaceName: string;
  isDemoMode?: boolean;
}

const PAGE_TITLES: Record<string, { title: string; subtitle: string }> = {
  '/overview': {
    title: 'Overview',
    subtitle: 'Monitor your workflows, leads, and recent activity.',
  },
  '/workflows': {
    title: 'Workflows',
    subtitle: 'Design, test, and publish automated workflows.',
  },
  '/leads': {
    title: 'Leads',
    subtitle: 'Manage captured leads, qualification scores, and activity history.',
  },
  '/integrations': {
    title: 'Integrations',
    subtitle: 'Connect your OpenAI, Resend, and Slack credentials.',
  },
  '/runs': {
    title: 'Runs',
    subtitle: 'Inspect workflow execution logs and step details.',
  },
  '/settings': {
    title: 'Settings',
    subtitle: 'Manage workspace profile, members, and configuration.',
  },
};

export function Header({ workspaceName }: HeaderProps) {
  const pathname = usePathname();
  const currentInfo = PAGE_TITLES[pathname] || {
    title: 'FlowPilot AI',
    subtitle: 'Workflow Automation',
  };

  return (
    <header className="h-16 border-b border-zinc-200/80 bg-white px-6 sm:px-8 flex items-center justify-between sticky top-0 z-20">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-sm font-semibold text-zinc-900">
            {currentInfo.title}
          </h1>
          <span className="text-zinc-300 text-xs">/</span>
          <span className="text-xs font-normal text-zinc-500">{workspaceName}</span>
        </div>
        <p className="text-xs text-zinc-500 hidden md:block">
          {currentInfo.subtitle}
        </p>
      </div>

      <div className="flex items-center gap-3">
        <Link href="/workflows/new">
          <button className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium transition-colors shadow-xs cursor-pointer">
            <Plus className="h-3.5 w-3.5" />
            <span>Create workflow</span>
          </button>
        </Link>
      </div>
    </header>
  );
}
