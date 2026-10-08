import React from 'react';
import { requireWorkspaceAuth } from '@/lib/auth/workspace-context';
import { getLeadsAction } from '@/lib/actions/crm';
import { LeadList } from '@/components/leads/lead-list';
import { EmptyState } from '@/components/ui/empty-state';
import { Button } from '@/components/ui/button';
import { Users, Webhook, Plus } from 'lucide-react';
import Link from 'next/link';

interface LeadsPageProps {
  searchParams: Promise<{
    search?: string;
    status?: string;
    qualification?: string;
    page?: string;
  }>;
}

export default async function LeadsPage({ searchParams }: LeadsPageProps) {
  const context = await requireWorkspaceAuth();
  const resolvedParams = await searchParams;

  const page = parseInt(resolvedParams.page || '1', 10);
  const result = await getLeadsAction({
    search: resolvedParams.search,
    status: resolvedParams.status,
    qualification: resolvedParams.qualification,
    page,
    limit: 25,
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Users className="h-5 w-5 text-purple-400" />
            <span>Leads & CRM Inbox</span>
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Captured leads, automated AI qualification scores, and chronological activity logs for{' '}
            <span className="text-zinc-200 font-medium">{context.workspace.name}</span>.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/integrations">
            <Button variant="outline" size="sm" className="border-zinc-800 text-xs gap-1.5">
              <Webhook className="h-3.5 w-3.5 text-purple-400" />
              <span>Webhook Settings</span>
            </Button>
          </Link>
          <Link href="/workflows">
            <Button size="sm" className="text-xs gap-1.5">
              <Plus className="h-3.5 w-3.5" />
              <span>Configure Ingestion</span>
            </Button>
          </Link>
        </div>
      </div>

      {result.leads.length === 0 && !resolvedParams.search && !resolvedParams.status && !resolvedParams.qualification ? (
        <EmptyState
          icon={<Users className="h-6 w-6 text-zinc-500" />}
          title="No leads captured yet"
          description="Leads ingested from webhook triggers or manual test payloads will appear here along with their AI qualification tier, budget score, and full activity history."
          actionLabel="View Webhook Settings"
          actionHref="/integrations"
        />
      ) : (
        <LeadList
          initialLeads={result.leads}
          totalCount={result.total}
          currentPage={result.page}
          totalPages={result.totalPages}
          workspaceId={context.workspace.id}
        />
      )}
    </div>
  );
}
