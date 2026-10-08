'use server';

import { createClient } from '@/lib/supabase/server';
import { requireWorkspaceAuth } from '@/lib/auth/workspace-context';
import { revalidatePath } from 'next/cache';
import type {
  LeadRecord,
  LeadActivityRecord,
  LeadStatus,
  QualificationStatus,
  WebhookEndpointRecord,
} from '@/types/crm';
import crypto from 'crypto';

/**
 * Fetches workspace leads with searching, filtering, and pagination.
 */
export async function getLeadsAction(params?: {
  search?: string;
  status?: string;
  qualification?: string;
  page?: number;
  limit?: number;
}): Promise<{
  leads: LeadRecord[];
  total: number;
  page: number;
  totalPages: number;
}> {
  const context = await requireWorkspaceAuth();
  const supabase = await createClient();

  const page = params?.page || 1;
  const limit = params?.limit || 20;
  const offset = (page - 1) * limit;

  let query = supabase
    .from('leads')
    .select('*, owner:profiles(id, email, full_name)', { count: 'exact' })
    .eq('workspace_id', context.workspace.id);

  if (params?.status && params.status !== 'all') {
    query = query.eq('status', params.status);
  }

  if (params?.qualification && params.qualification !== 'all') {
    query = query.eq('qualification_status', params.qualification);
  }

  if (params?.search && params.search.trim()) {
    const s = params.search.trim();
    query = query.or(`name.ilike.%${s}%,company.ilike.%${s}%,email.ilike.%${s}%`);
  }

  const { data, count, error } = await query
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error || !data) {
    return { leads: [], total: 0, page, totalPages: 1 };
  }

  const total = count || 0;
  const totalPages = Math.ceil(total / limit) || 1;

  return {
    leads: data as unknown as LeadRecord[],
    total,
    page,
    totalPages,
  };
}

/**
 * Fetches full details and chronological activity timeline for a specific lead.
 */
export async function getLeadDetailAction(leadId: string): Promise<{
  lead: LeadRecord | null;
  activities: LeadActivityRecord[];
}> {
  const context = await requireWorkspaceAuth();
  const supabase = await createClient();

  const { data: lead, error: leadError } = await supabase
    .from('leads')
    .select('*, owner:profiles(id, email, full_name)')
    .eq('id', leadId)
    .eq('workspace_id', context.workspace.id)
    .single();

  if (leadError || !lead) {
    return { lead: null, activities: [] };
  }

  const { data: activities } = await supabase
    .from('lead_activities')
    .select('*, creator:profiles(id, email, full_name)')
    .eq('lead_id', leadId)
    .eq('workspace_id', context.workspace.id)
    .order('created_at', { ascending: false });

  return {
    lead: lead as unknown as LeadRecord,
    activities: (activities || []) as unknown as LeadActivityRecord[],
  };
}

/**
 * Updates lead status and appends a timeline activity log.
 */
export async function updateLeadStatusAction(
  leadId: string,
  newStatus: LeadStatus
): Promise<{ success: boolean; error?: string }> {
  const context = await requireWorkspaceAuth();
  const supabase = await createClient();

  const { error } = await supabase
    .from('leads')
    .update({
      status: newStatus,
      updated_at: new Date().toISOString(),
    } as unknown as never)
    .eq('id', leadId)
    .eq('workspace_id', context.workspace.id);

  if (error) {
    return { success: false, error: error.message };
  }

  // Record Activity
  await supabase.from('lead_activities').insert({
    workspace_id: context.workspace.id,
    lead_id: leadId,
    activity_type: 'status_changed',
    title: `Status updated to ${newStatus.toUpperCase()}`,
    created_by: context.user.id,
    created_at: new Date().toISOString(),
  } as unknown as never);

  revalidatePath(`/leads/${leadId}`);
  revalidatePath('/leads');
  return { success: true };
}

/**
 * Adds a manual note to a lead's activity timeline.
 */
export async function addLeadNoteAction(
  leadId: string,
  noteText: string
): Promise<{ success: boolean; error?: string }> {
  const context = await requireWorkspaceAuth();
  const supabase = await createClient();

  if (!noteText.trim()) {
    return { success: false, error: 'Note cannot be empty.' };
  }

  const { error } = await supabase.from('lead_activities').insert({
    workspace_id: context.workspace.id,
    lead_id: leadId,
    activity_type: 'note_added',
    title: 'Note Added',
    description: noteText.trim(),
    created_by: context.user.id,
    created_at: new Date().toISOString(),
  } as unknown as never);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath(`/leads/${leadId}`);
  return { success: true };
}

/**
 * Rotates the secret token for a webhook endpoint.
 */
export async function rotateWebhookSecretAction(
  endpointId: string
): Promise<{ success: boolean; newSecret?: string; error?: string }> {
  const context = await requireWorkspaceAuth();
  const supabase = await createClient();

  const newSecret = `whsec_${crypto.randomBytes(24).toString('hex')}`;

  const { error } = await supabase
    .from('webhook_endpoints')
    .update({
      secret_token: newSecret,
      updated_at: new Date().toISOString(),
    } as unknown as never)
    .eq('id', endpointId)
    .eq('workspace_id', context.workspace.id);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath('/integrations');
  return { success: true, newSecret };
}

/**
 * Creates or gets an existing webhook endpoint for a workflow.
 */
export async function getOrCreateWebhookEndpointAction(
  workflowId: string,
  slugPrefix?: string
): Promise<{ endpoint: WebhookEndpointRecord | null; error?: string }> {
  const context = await requireWorkspaceAuth();
  const supabase = await createClient();

  // Check if endpoint exists for workflow
  const { data: existing } = await supabase
    .from('webhook_endpoints')
    .select('*, workflow:workflows(id, name, status)')
    .eq('workflow_id', workflowId)
    .eq('workspace_id', context.workspace.id)
    .maybeSingle();

  if (existing) {
    return { endpoint: existing as unknown as WebhookEndpointRecord };
  }

  const pathSlug = `${slugPrefix || 'lead-intake'}-${Math.random().toString(36).substring(2, 6)}`;
  const secretToken = `whsec_${crypto.randomBytes(24).toString('hex')}`;

  const { data: created, error } = await supabase
    .from('webhook_endpoints')
    .insert({
      workspace_id: context.workspace.id,
      workflow_id: workflowId,
      path_slug: pathSlug,
      secret_token: secretToken,
      is_active: true,
      rate_limit_per_minute: 60,
    } as unknown as never)
    .select('*, workflow:workflows(id, name, status)')
    .single();

  if (error || !created) {
    return { endpoint: null, error: error?.message || 'Failed to create webhook endpoint' };
  }

  return { endpoint: created as unknown as WebhookEndpointRecord };
}
