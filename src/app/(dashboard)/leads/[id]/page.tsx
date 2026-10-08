import React from 'react';
import { notFound } from 'next/navigation';
import { requireWorkspaceAuth } from '@/lib/auth/workspace-context';
import { getLeadDetailAction } from '@/lib/actions/crm';
import { LeadDetail } from '@/components/leads/lead-detail';

interface LeadDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function LeadDetailPage({ params }: LeadDetailPageProps) {
  const context = await requireWorkspaceAuth();
  const { id } = await params;

  const { lead, activities } = await getLeadDetailAction(id);

  if (!lead) {
    notFound();
  }

  return (
    <LeadDetail
      lead={lead}
      activities={activities}
      workspaceId={context.workspace.id}
    />
  );
}
