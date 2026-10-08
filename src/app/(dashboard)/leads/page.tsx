import React from 'react';
import { requireWorkspaceAuth } from '@/lib/auth/workspace-context';
import { EmptyState } from '@/components/ui/empty-state';
import { Button } from '@/components/ui/button';
import { Users, UserPlus, Filter } from 'lucide-react';

export default async function LeadsPage() {
  const context = await requireWorkspaceAuth();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Leads & CRM Inbox</h2>
          <p className="text-xs text-zinc-400">
            View captured leads, AI qualification ratings, and customer contact timeline for {context.workspace.name}.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm">
            <Filter className="mr-1.5 h-3.5 w-3.5" />
            <span>Filter</span>
          </Button>
          <Button size="sm">
            <UserPlus className="mr-1.5 h-3.5 w-3.5" />
            <span>Add Lead</span>
          </Button>
        </div>
      </div>

      <EmptyState
        icon={Users}
        title="No leads captured yet"
        description="Leads ingested from webhook triggers or manual test payloads will appear here along with their AI qualification tier, budget score, and full activity history."
        actionLabel="Send Sample Ingest Payload"
      />
    </div>
  );
}
