export type LeadStatus = 'new' | 'contacted' | 'in_progress' | 'qualified' | 'unqualified' | 'converted' | 'lost';
export type QualificationStatus = 'pending' | 'hot' | 'warm' | 'cold' | 'unqualified' | 'qualified';
export type LeadSource = 'webhook' | 'manual' | 'form' | 'api' | string;

export interface LeadRecord {
  id: string;
  workspace_id: string;
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  source: LeadSource;
  service_interest: string | null;
  message: string | null;
  estimated_budget: string | null;
  qualification_status: QualificationStatus;
  qualification_score: number | null;
  qualification_reasoning: string | null;
  owner_id: string | null;
  status: LeadStatus;
  custom_attributes: Record<string, any>;
  tags: string[];
  external_id: string | null;
  created_at: string;
  updated_at: string;
  owner?: { id: string; email: string; full_name: string | null } | null;
}

export type LeadActivityType =
  | 'created'
  | 'webhook_received'
  | 'ai_qualified'
  | 'email_sent'
  | 'slack_alert'
  | 'status_changed'
  | 'note_added'
  | 'workflow_executed';

export interface LeadActivityRecord {
  id: string;
  workspace_id: string;
  lead_id: string;
  activity_type: LeadActivityType;
  title: string;
  description: string | null;
  metadata: Record<string, any>;
  created_by: string | null;
  created_at: string;
  creator?: { id: string; email: string; full_name: string | null } | null;
}

export interface WebhookEndpointRecord {
  id: string;
  workspace_id: string;
  workflow_id: string;
  path_slug: string;
  secret_token: string;
  is_active: boolean;
  rate_limit_per_minute: number;
  total_requests_count: number;
  last_requested_at: string | null;
  created_at: string;
  updated_at: string;
  workflow?: { id: string; name: string; status: string } | null;
}

export interface UpsertLeadInput {
  workspace_id: string;
  name?: string;
  email?: string | null;
  phone?: string | null;
  company?: string | null;
  source?: LeadSource;
  service_interest?: string | null;
  message?: string | null;
  estimated_budget?: string | null;
  qualification_status?: QualificationStatus;
  qualification_score?: number | null;
  qualification_reasoning?: string | null;
  status?: LeadStatus;
  custom_attributes?: Record<string, any>;
  tags?: string[];
  external_id?: string | null;
}
