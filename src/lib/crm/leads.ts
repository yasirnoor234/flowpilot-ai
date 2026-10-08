import { createAdminClient } from '@/lib/supabase/server';
import type {
  LeadRecord,
  LeadActivityRecord,
  UpsertLeadInput,
  LeadActivityType,
  LeadStatus,
} from '@/types/crm';

/**
 * Normalizes email strings for consistent, safe identity matching.
 */
export function normalizeEmail(email?: string | null): string | null {
  if (!email || typeof email !== 'string') return null;
  const trimmed = email.trim().toLowerCase();
  return trimmed.length > 0 ? trimmed : null;
}

/**
 * Generates or resolves an alternate identity for leads that lack an email.
 */
export function resolveLeadIdentityKey(input: UpsertLeadInput): {
  type: 'email' | 'external_id' | 'phone';
  key: string;
} {
  const normEmail = normalizeEmail(input.email);
  if (normEmail) {
    return { type: 'email', key: normEmail };
  }

  if (input.external_id && input.external_id.trim()) {
    return { type: 'external_id', key: input.external_id.trim() };
  }

  if (input.phone && input.phone.trim()) {
    const cleanPhone = input.phone.replace(/[^0-9+]/g, '');
    if (cleanPhone.length >= 7) {
      return { type: 'phone', key: cleanPhone };
    }
  }

  // Fallback unique synthetic external ID
  const fallbackKey = `lead_anon_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  return { type: 'external_id', key: fallbackKey };
}

/**
 * Idempotently upserts a lead record within a workspace and logs the activity event.
 */
export async function upsertLeadRecord(
  input: UpsertLeadInput,
  options?: {
    activityType?: LeadActivityType;
    activityTitle?: string;
    activityMetadata?: Record<string, any>;
    actorProfileId?: string;
  }
): Promise<{ lead: LeadRecord; isNew: boolean }> {
  const supabase = createAdminClient();
  const identity = resolveLeadIdentityKey(input);
  const normalizedEmail = normalizeEmail(input.email);

  let existingLead: LeadRecord | null = null;

  // 1. Look up existing lead in the workspace
  if (identity.type === 'email') {
    const { data } = await supabase
      .from('leads')
      .select('*')
      .eq('workspace_id', input.workspace_id)
      .eq('email', identity.key)
      .maybeSingle();
    existingLead = data as unknown as LeadRecord;
  } else if (identity.type === 'external_id') {
    const { data } = await supabase
      .from('leads')
      .select('*')
      .eq('workspace_id', input.workspace_id)
      .eq('external_id', identity.key)
      .maybeSingle();
    existingLead = data as unknown as LeadRecord;
  } else if (identity.type === 'phone') {
    const { data } = await supabase
      .from('leads')
      .select('*')
      .eq('workspace_id', input.workspace_id)
      .eq('phone', identity.key)
      .maybeSingle();
    existingLead = data as unknown as LeadRecord;
  }

  const now = new Date().toISOString();
  let resultLead: LeadRecord;
  let isNew = false;

  if (existingLead) {
    // 2. Update existing lead
    const mergedTags = Array.from(new Set([...(existingLead.tags || []), ...(input.tags || [])]));
    const mergedAttributes = {
      ...(existingLead.custom_attributes || {}),
      ...(input.custom_attributes || {}),
    };

    const updatePayload: Record<string, any> = {
      updated_at: now,
      tags: mergedTags,
      custom_attributes: mergedAttributes,
    };

    if (input.name) updatePayload.name = input.name;
    if (input.phone) updatePayload.phone = input.phone;
    if (input.company) updatePayload.company = input.company;
    if (input.service_interest) updatePayload.service_interest = input.service_interest;
    if (input.message) updatePayload.message = input.message;
    if (input.estimated_budget) updatePayload.estimated_budget = input.estimated_budget;
    if (input.qualification_status) updatePayload.qualification_status = input.qualification_status;
    if (input.qualification_score !== undefined) updatePayload.qualification_score = input.qualification_score;
    if (input.qualification_reasoning) updatePayload.qualification_reasoning = input.qualification_reasoning;
    if (input.status) updatePayload.status = input.status;

    const { data: updated, error } = await supabase
      .from('leads')
      .update(updatePayload as unknown as never)
      .eq('id', existingLead.id)
      .select()
      .single();

    if (error || !updated) {
      throw new Error(`Failed to update lead: ${error?.message || 'Database error'}`);
    }

    resultLead = updated as unknown as LeadRecord;
  } else {
    // 3. Insert new lead
    isNew = true;
    const insertPayload = {
      workspace_id: input.workspace_id,
      name: input.name || (normalizedEmail ? normalizedEmail.split('@')[0] : 'New Lead'),
      email: normalizedEmail,
      phone: input.phone || null,
      company: input.company || null,
      source: input.source || 'webhook',
      service_interest: input.service_interest || null,
      message: input.message || null,
      estimated_budget: input.estimated_budget || null,
      qualification_status: input.qualification_status || 'pending',
      qualification_score: input.qualification_score !== undefined ? input.qualification_score : null,
      qualification_reasoning: input.qualification_reasoning || null,
      status: input.status || 'new',
      custom_attributes: input.custom_attributes || {},
      tags: input.tags || [],
      external_id: identity.type === 'external_id' ? identity.key : input.external_id || null,
      created_at: now,
      updated_at: now,
    };

    const { data: inserted, error } = await supabase
      .from('leads')
      .insert(insertPayload as unknown as never)
      .select()
      .single();

    if (error || !inserted) {
      throw new Error(`Failed to create lead: ${error?.message || 'Database error'}`);
    }

    resultLead = inserted as unknown as LeadRecord;
  }

  // 4. Record Lead Activity Timeline Event
  const activityType = options?.activityType || (isNew ? 'created' : 'workflow_executed');
  const activityTitle =
    options?.activityTitle || (isNew ? 'Lead Created' : 'Lead Updated via Workflow');

  await supabase.from('lead_activities').insert({
    workspace_id: input.workspace_id,
    lead_id: resultLead.id,
    activity_type: activityType,
    title: activityTitle,
    description: isNew
      ? `Lead captured via ${resultLead.source}`
      : `Record updated with new qualification or properties`,
    metadata: options?.activityMetadata || {},
    created_by: options?.actorProfileId || null,
    created_at: now,
  } as unknown as never);

  return { lead: resultLead, isNew };
}
