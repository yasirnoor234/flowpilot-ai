import type { WorkflowRecord, WorkflowVersionRecord } from './workflow';
import type { WorkflowRunRecord, WorkflowStepRunRecord, TriggerEventRecord } from './execution';
import type { LeadRecord, LeadActivityRecord, WebhookEndpointRecord } from './crm';
import type { IntegrationConnectionRecord, IntegrationActionAttemptRecord } from './integrations';

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type WorkspaceRole = 'owner' | 'member';

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  is_demo_mode: boolean;
  created_by?: string | null;
  created_at: string;
  updated_at: string;
}

export interface WorkspaceMember {
  id: string;
  workspace_id: string;
  user_id: string;
  role: WorkspaceRole;
  created_at: string;
  updated_at: string;
  profile?: Profile;
}

export interface UserWorkspaceAccess {
  workspace: Workspace;
  role: WorkspaceRole;
}

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      workspaces: {
        Row: Workspace;
        Insert: {
          id?: string;
          name: string;
          slug: string;
          is_demo_mode?: boolean;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          is_demo_mode?: boolean;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      workspace_members: {
        Row: WorkspaceMember;
        Insert: {
          id?: string;
          workspace_id: string;
          user_id: string;
          role: WorkspaceRole;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          user_id?: string;
          role?: WorkspaceRole;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'workspace_members_workspace_id_fkey';
            columns: ['workspace_id'];
            isOneToOne: false;
            referencedRelation: 'workspaces';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'workspace_members_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          }
        ];
      };
      workflows: {
        Row: WorkflowRecord;
        Insert: {
          id?: string;
          workspace_id: string;
          name: string;
          description?: string | null;
          status?: 'draft' | 'active' | 'inactive' | 'archived';
          webhook_slug?: string | null;
          draft_graph?: Json;
          active_version_id?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          name?: string;
          description?: string | null;
          status?: 'draft' | 'active' | 'inactive' | 'archived';
          webhook_slug?: string | null;
          draft_graph?: Json;
          active_version_id?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'workflows_workspace_id_fkey';
            columns: ['workspace_id'];
            isOneToOne: false;
            referencedRelation: 'workspaces';
            referencedColumns: ['id'];
          }
        ];
      };
      workflow_versions: {
        Row: WorkflowVersionRecord;
        Insert: {
          id?: string;
          workspace_id: string;
          workflow_id: string;
          version_number: number;
          compiled_graph: Json;
          raw_graph: Json;
          change_summary?: string | null;
          published_by?: string | null;
          published_at?: string;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          workflow_id?: string;
          version_number?: number;
          compiled_graph?: Json;
          raw_graph?: Json;
          change_summary?: string | null;
          published_by?: string | null;
          published_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'workflow_versions_workflow_id_fkey';
            columns: ['workflow_id'];
            isOneToOne: false;
            referencedRelation: 'workflows';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'workflow_versions_workspace_id_fkey';
            columns: ['workspace_id'];
            isOneToOne: false;
            referencedRelation: 'workspaces';
            referencedColumns: ['id'];
          }
        ];
      };
      workflow_runs: {
        Row: WorkflowRunRecord;
        Insert: {
          id?: string;
          workspace_id: string;
          workflow_id: string;
          workflow_version_id: string;
          trigger_type: 'manual' | 'webhook';
          trigger_payload?: Json;
          idempotency_key?: string | null;
          status?: 'queued' | 'running' | 'waiting' | 'succeeded' | 'failed' | 'canceled';
          error_message?: string | null;
          parent_run_id?: string | null;
          started_at?: string | null;
          finished_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          workflow_id?: string;
          workflow_version_id?: string;
          trigger_type?: 'manual' | 'webhook';
          trigger_payload?: Json;
          idempotency_key?: string | null;
          status?: 'queued' | 'running' | 'waiting' | 'succeeded' | 'failed' | 'canceled';
          error_message?: string | null;
          parent_run_id?: string | null;
          started_at?: string | null;
          finished_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      workflow_step_runs: {
        Row: WorkflowStepRunRecord;
        Insert: {
          id?: string;
          run_id: string;
          workspace_id: string;
          node_id: string;
          node_type: string;
          node_title: string;
          status?: 'pending' | 'running' | 'waiting' | 'succeeded' | 'failed' | 'skipped';
          input_data?: Json;
          output_data?: Json;
          error_message?: string | null;
          retry_count?: number;
          duration_ms?: number | null;
          started_at?: string | null;
          finished_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          run_id?: string;
          workspace_id?: string;
          node_id?: string;
          node_type?: string;
          node_title?: string;
          status?: 'pending' | 'running' | 'waiting' | 'succeeded' | 'failed' | 'skipped';
          input_data?: Json;
          output_data?: Json;
          error_message?: string | null;
          retry_count?: number;
          duration_ms?: number | null;
          started_at?: string | null;
          finished_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      trigger_events: {
        Row: TriggerEventRecord;
        Insert: {
          id?: string;
          workspace_id: string;
          workflow_id?: string | null;
          event_type: 'workflow.manual' | 'workflow.webhook';
          idempotency_key: string;
          payload?: Json;
          status?: 'received' | 'dispatched' | 'failed';
          run_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          workflow_id?: string | null;
          event_type?: 'workflow.manual' | 'workflow.webhook';
          idempotency_key?: string;
          payload?: Json;
          status?: 'received' | 'dispatched' | 'failed';
          run_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      leads: {
        Row: LeadRecord;
        Insert: {
          id?: string;
          workspace_id: string;
          name: string;
          email?: string | null;
          phone?: string | null;
          company?: string | null;
          source?: string;
          service_interest?: string | null;
          message?: string | null;
          estimated_budget?: any;
          qualification_status?: string;
          qualification_score?: number | null;
          qualification_reasoning?: string | null;
          owner_id?: string | null;
          status?: string;
          custom_attributes?: Record<string, any>;
          tags?: string[];
          external_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          name?: string;
          email?: string | null;
          phone?: string | null;
          company?: string | null;
          source?: string;
          service_interest?: string | null;
          message?: string | null;
          estimated_budget?: any;
          qualification_status?: string;
          qualification_score?: number | null;
          qualification_reasoning?: string | null;
          owner_id?: string | null;
          status?: string;
          custom_attributes?: Record<string, any>;
          tags?: string[];
          external_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      lead_activities: {
        Row: LeadActivityRecord;
        Insert: {
          id?: string;
          workspace_id: string;
          lead_id: string;
          activity_type: string;
          title: string;
          description?: string | null;
          metadata?: Record<string, any>;
          created_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          lead_id?: string;
          activity_type?: string;
          title?: string;
          description?: string | null;
          metadata?: Record<string, any>;
          created_by?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      webhook_endpoints: {
        Row: WebhookEndpointRecord;
        Insert: {
          id?: string;
          workspace_id: string;
          workflow_id: string;
          path_slug: string;
          secret_token: string;
          is_active?: boolean;
          rate_limit_per_minute?: number;
          total_requests_count?: number;
          last_triggered_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          workflow_id?: string;
          path_slug?: string;
          secret_token?: string;
          is_active?: boolean;
          rate_limit_per_minute?: number;
          total_requests_count?: number;
          last_triggered_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      integration_connections: {
        Row: IntegrationConnectionRecord;
        Insert: {
          id?: string;
          workspace_id: string;
          provider: string;
          name: string;
          status?: string;
          encrypted_credentials?: string;
          masked_key?: string;
          settings?: Record<string, any>;
          is_active?: boolean;
          last_tested_at?: string | null;
          last_error?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          provider?: string;
          name?: string;
          status?: string;
          encrypted_credentials?: string;
          masked_key?: string;
          settings?: Record<string, any>;
          is_active?: boolean;
          last_tested_at?: string | null;
          last_error?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      integration_action_attempts: {
        Row: IntegrationActionAttemptRecord;
        Insert: {
          id?: string;
          workspace_id: string;
          connection_id?: string | null;
          action_type: string;
          workflow_run_id?: string | null;
          workflow_step_id?: string | null;
          idempotency_key?: string | null;
          status?: string;
          provider_message_id?: string | null;
          recipient_or_target?: string | null;
          payload_summary?: Record<string, any>;
          error_message?: string | null;
          latency_ms?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          connection_id?: string | null;
          action_type?: string;
          workflow_run_id?: string | null;
          workflow_step_id?: string | null;
          idempotency_key?: string | null;
          status?: string;
          provider_message_id?: string | null;
          recipient_or_target?: string | null;
          payload_summary?: Record<string, any>;
          error_message?: string | null;
          latency_ms?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      is_workspace_member: {
        Args: { ws_id: string };
        Returns: boolean;
      };
      is_workspace_owner: {
        Args: { ws_id: string };
        Returns: boolean;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}
