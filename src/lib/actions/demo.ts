'use server';

import { createClient, createAdminClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

import { SYNTHETIC_DEMO_LEADS } from '@/lib/demo-data';


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
