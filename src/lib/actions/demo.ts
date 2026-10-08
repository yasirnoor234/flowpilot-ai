'use server';

import { createClient, createAdminClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export interface SyntheticLeadData {
  name: string;
  email: string;
  phone?: string;
  company?: string;
  source: string;
  service_interest: string;
  message: string;
  estimated_budget?: number;
  qualification_status: 'qualified' | 'unqualified' | 'pending' | 'review_required';
  qualification_score: number;
  status: 'new' | 'contacted' | 'meeting_scheduled' | 'proposal_sent' | 'won' | 'lost';
}

export const SYNTHETIC_DEMO_LEADS: SyntheticLeadData[] = [
  {
    name: 'Elena Rostova',
    email: 'elena@cyberdynamix.tech',
    phone: '+1 (415) 890-1234',
    company: 'CyberDynamix AI',
    source: 'Website Inbound Form',
    service_interest: 'Enterprise AI Workflow Orchestration',
    message: 'We are expanding our autonomous agent pipelines and need a robust workflow engine with multi-tenant RLS and Inngest durable delays.',
    estimated_budget: 45000,
    qualification_status: 'qualified',
    qualification_score: 94,
    status: 'meeting_scheduled',
  },
  {
    name: 'Marcus Vance',
    email: 'marcus.vance@vanguardlogistics.io',
    phone: '+1 (312) 555-0198',
    company: 'Vanguard Global Logistics',
    source: 'Partner Referral',
    service_interest: 'Lead Routing & Slack CRM Synchronization',
    message: 'Looking to automate high-priority freight lead notifications to our account execs on Slack within 5 seconds of form submission.',
    estimated_budget: 25000,
    qualification_status: 'qualified',
    qualification_score: 88,
    status: 'contacted',
  },
  {
    name: 'Chloe Zhang',
    email: 'chloe@apexfintech.co',
    phone: '+1 (212) 777-9081',
    company: 'Apex Digital Capital',
    source: 'Product Hunt Launch',
    service_interest: 'AI Text Classification & Sentiment Scoring',
    message: 'Need an evaluation of FlowPilot for automating compliance lead triage across our 12 regional branch hubs.',
    estimated_budget: 60000,
    qualification_status: 'qualified',
    qualification_score: 96,
    status: 'proposal_sent',
  },
  {
    name: 'David Kim',
    email: 'david.k@solarmotion.dev',
    phone: '+1 (650) 444-2319',
    company: 'SolarMotion Labs',
    source: 'Direct Webhook Intake',
    service_interest: 'Proposal Follow-up Reminders',
    message: 'Interested in setting up 3-day durable delays that automatically check our CRM status before sending executive reminders.',
    estimated_budget: 18000,
    qualification_status: 'qualified',
    qualification_score: 82,
    status: 'new',
  },
  {
    name: 'Jordan Miller',
    email: 'jordan@freelance-design.me',
    phone: '+1 (503) 222-1100',
    company: 'Miller Creative',
    source: 'Website Inbound Form',
    service_interest: 'Basic Contact Form Intake',
    message: 'Just exploring tools for personal freelance client notifications. Low budget.',
    estimated_budget: 500,
    qualification_status: 'unqualified',
    qualification_score: 35,
    status: 'lost',
  },
];

/**
 * Resets synthetic data in a demo workspace, refreshing leads and activities.
 * Guarded to ensure only demo workspaces can be wiped/reset.
 */
export async function resetDemoWorkspaceData(workspaceId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();
    const adminSupabase = createAdminClient();

    // 1. Verify user has access to this workspace
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return { success: false, error: 'Unauthorized' };
    }

    // 2. Fetch workspace to ensure it is marked as is_demo_mode
    const { data: workspace, error: wsError } = await (adminSupabase.from('workspaces') as any)
      .select('id, is_demo_mode')
      .eq('id', workspaceId)
      .single();

    if (wsError || !workspace) {
      return { success: false, error: 'Workspace not found' };
    }

    if (!workspace.is_demo_mode) {
      return { success: false, error: 'Data reset is strictly prohibited on production workspaces.' };
    }

    // 3. Clear existing leads in the demo workspace
    const { error: deleteLeadsError } = await (adminSupabase.from('leads') as any)
      .delete()
      .eq('workspace_id', workspaceId);

    if (deleteLeadsError) {
      return { success: false, error: `Failed to clear existing demo leads: ${deleteLeadsError.message}` };
    }

    // 4. Seed fresh synthetic leads
    for (const lead of SYNTHETIC_DEMO_LEADS) {
      const normalizedEmail = lead.email.toLowerCase().trim();
      const { data: insertedLead, error: insertError } = await (adminSupabase.from('leads') as any)
        .insert({
          workspace_id: workspaceId,
          name: lead.name,
          email: normalizedEmail,
          phone: lead.phone,
          company: lead.company,
          source: lead.source,
          service_interest: lead.service_interest,
          message: lead.message,
          estimated_budget: lead.estimated_budget,
          qualification_status: lead.qualification_status,
          qualification_score: lead.qualification_score,
          status: lead.status,
        })
        .select()
        .single();

      if (!insertError && insertedLead) {
        // Add initial activity
        await (adminSupabase.from('lead_activities') as any).insert({
          workspace_id: workspaceId,
          lead_id: insertedLead.id,
          activity_type: 'lead_captured',
          title: 'Lead Ingested from Demo Sandbox',
          description: `Synthetic lead intake via ${lead.source}. Initial AI qualification score: ${lead.qualification_score}/100.`,
          metadata: {
            is_demo_seed: true,
            score: lead.qualification_score,
            category: lead.qualification_score > 80 ? 'HOT' : 'COOL',
          },
        });
      }
    }

    revalidatePath('/leads');
    revalidatePath('/overview');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'An unexpected error occurred during demo reset.' };
  }
}
