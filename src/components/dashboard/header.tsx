'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { ShieldCheck, Plus } from 'lucide-react';
import Link from 'next/link';

interface HeaderProps {
  workspaceName: string;
  isDemoMode?: boolean;
}

const PAGE_TITLES: Record<string, { title: string; subtitle: string }> = {
  '/overview': {
    title: 'Workspace Overview',
    subtitle: 'Real-time automation metrics, lead throughput, and active pipelines.',
  },
  '/workflows': {
    title: 'Visual Workflows',
    subtitle: 'Design, test, and publish autonomous DAG workflows.',
  },
  '/leads': {
    title: 'CRM & Lead Inbox',
    subtitle: 'Manage qualified incoming leads, AI scores, and activity logs.',
  },
  '/integrations': {
    title: 'Integration Adapters',
    subtitle: 'Configure OpenAI, Resend, Slack, and webhook endpoints.',
  },
  '/runs': {
    title: 'Execution Runs & Logs',
    subtitle: 'Inspect durable Inngest workflow runs, step logs, and retry history.',
  },
  '/settings': {
    title: 'Workspace Settings',
    subtitle: 'Manage workspace profile, members, role permissions, and demo modes.',
  },
};

export function Header({ workspaceName, isDemoMode = false }: HeaderProps) {
  const pathname = usePathname();
  const currentInfo = PAGE_TITLES[pathname] || {
    title: 'FlowPilot AI',
    subtitle: 'Autonomous Business Automation',
  };

  return (
    <header className="h-16 border-b border-zinc-800/80 bg-zinc-950/60 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-20">
      <div>
        <h1 className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
          <span>{currentInfo.title}</span>
          <span className="text-zinc-600 text-xs">/</span>
          <span className="text-xs font-normal text-zinc-400">{workspaceName}</span>
        </h1>
        <p className="text-[11px] text-zinc-500 hidden md:block">
          {currentInfo.subtitle}
        </p>
      </div>

      <div className="flex items-center gap-3">
        {isDemoMode && (
          <Badge variant="warning" className="gap-1 text-[11px] bg-amber-500/10 text-amber-300 border-amber-500/30">
            <span>🧪 Demo Sandbox</span>
          </Badge>
        )}
        <Badge variant="success" className="gap-1 text-[11px] hidden sm:flex">
          <ShieldCheck className="h-3 w-3" />
          <span>RLS Isolated</span>
        </Badge>

        <Link href="/workflows">
          <button className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition-all shadow-sm shadow-indigo-600/20">
            <Plus className="h-3.5 w-3.5" />
            <span>New Flow</span>
          </button>
        </Link>
      </div>
    </header>
  );
}
