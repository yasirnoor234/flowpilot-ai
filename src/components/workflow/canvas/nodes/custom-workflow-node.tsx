'use client';

import React, { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import type { WorkflowNodeData } from '../types';
import {
  Play,
  Webhook,
  Sliders,
  Bot,
  Database,
  Mail,
  MessageSquare,
  Clock,
  Activity,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Copy,
  Trash2,
  Settings,
} from 'lucide-react';

export const CustomWorkflowNode = memo(({ data, selected }: NodeProps) => {
  const nodeData = data as unknown as WorkflowNodeData;
  const isTrigger = nodeData.type.startsWith('trigger_');

  const getNodeIcon = (type: string) => {
    switch (type) {
      case 'trigger_manual':
        return Play;
      case 'trigger_webhook':
        return Webhook;
      case 'action_field_mapping':
        return Sliders;
      case 'action_ai_qualify':
        return Bot;
      case 'action_crm_upsert':
        return Database;
      case 'action_send_email':
        return Mail;
      case 'action_slack_notify':
        return MessageSquare;
      case 'action_delay':
        return Clock;
      default:
        return Activity;
    }
  };

  const getNodeTheme = (type: string) => {
    if (type.startsWith('trigger_')) {
      return {
        badge: 'bg-indigo-50 text-indigo-700 border-indigo-200/80',
        iconBg: 'bg-indigo-50 text-indigo-600',
        selectedBorder: 'ring-2 ring-indigo-600 border-transparent',
      };
    }
    if (type === 'action_ai_qualify') {
      return {
        badge: 'bg-indigo-50 text-indigo-700 border-indigo-200/80',
        iconBg: 'bg-indigo-50 text-indigo-600',
        selectedBorder: 'ring-2 ring-indigo-600 border-transparent',
      };
    }
    if (type === 'action_crm_upsert' || type === 'action_send_email' || type === 'action_slack_notify') {
      return {
        badge: 'bg-zinc-100 text-zinc-700 border-zinc-200',
        iconBg: 'bg-zinc-100 text-zinc-700',
        selectedBorder: 'ring-2 ring-indigo-600 border-transparent',
      };
    }
    return {
      badge: 'bg-zinc-100 text-zinc-700 border-zinc-200',
      iconBg: 'bg-zinc-100 text-zinc-700',
      selectedBorder: 'ring-2 ring-indigo-600 border-transparent',
    };
  };

  const getConfigSummary = () => {
    const config = nodeData.config || {};
    switch (nodeData.type) {
      case 'trigger_webhook':
        return `POST /api/v1/webhook/${config.path_slug || 'intake'}`;
      case 'action_field_mapping':
        return `${(config.mappings || []).length} field mapping(s)`;
      case 'action_ai_qualify':
        return `Model: ${config.model || 'gpt-4o-mini'} (0-100)`;
      case 'action_crm_upsert':
        return `Status: ${config.status || 'new'} (${(config.tags || []).length} tags)`;
      case 'action_send_email':
        return `To: ${config.to || '{{trigger.email}}'}`;
      case 'action_slack_notify':
        return `Channel: ${config.channel_name || '#general'}`;
      case 'action_delay':
        return `Wait ${config.duration || 24} ${config.unit || 'hours'}`;
      default:
        return 'Standard Step';
    }
  };

  const IconComponent = getNodeIcon(nodeData.type);
  const theme = getNodeTheme(nodeData.type);

  return (
    <div
      className={`w-64 rounded-xl border bg-white p-3.5 shadow-xs transition-all duration-150 ${
        selected
          ? theme.selectedBorder
          : 'border-zinc-200 hover:border-zinc-300'
      } ${nodeData.hasValidationError ? 'border-red-400 bg-red-50/20' : ''}`}
    >
      {/* Target Connection Handle (Top) */}
      {!isTrigger && (
        <Handle
          type="target"
          position={Position.Top}
          className="!h-3 !w-3 !rounded-full !bg-zinc-300 !border-2 !border-white hover:!bg-indigo-600 transition-colors"
        />
      )}

      {/* Node Header */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className={`h-7 w-7 rounded-lg flex items-center justify-center shrink-0 ${theme.iconBg}`}>
            <IconComponent className="h-3.5 w-3.5" />
          </div>
          <div className="min-w-0">
            <h4 className="text-xs font-semibold text-zinc-900 truncate">
              {nodeData.title}
            </h4>
            <div className="text-[10px] text-zinc-400 uppercase tracking-wider font-mono">
              {nodeData.type.replace('action_', '').replace('trigger_', '')}
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-0.5 shrink-0 opacity-80 hover:opacity-100">
          {nodeData.onOpenConfig && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                nodeData.onOpenConfig?.(nodeData.nodeId);
              }}
              className="p-1 rounded-md text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100"
              title="Configure Node"
            >
              <Settings className="h-3 w-3" />
            </button>
          )}
          {nodeData.onDuplicateNode && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                nodeData.onDuplicateNode?.(nodeData.nodeId);
              }}
              className="p-1 rounded-md text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100"
              title="Duplicate"
            >
              <Copy className="h-3 w-3" />
            </button>
          )}
          {nodeData.onDeleteNode && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                nodeData.onDeleteNode?.(nodeData.nodeId);
              }}
              className="p-1 rounded-md text-zinc-400 hover:text-red-600 hover:bg-red-50"
              title="Delete"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>

      {/* Config Summary Card */}
      <div className="rounded-lg bg-zinc-50 border border-zinc-200/60 px-2.5 py-1.5 text-[11px] font-mono text-zinc-600 truncate">
        {getConfigSummary()}
      </div>

      {/* Live Test Run Execution Status Badge */}
      {nodeData.executionStatus && (
        <div className="mt-2 pt-2 border-t border-zinc-100 flex items-center justify-between text-[11px]">
          <div className="flex items-center gap-1.5">
            {nodeData.executionStatus === 'succeeded' && (
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
            )}
            {nodeData.executionStatus === 'running' && (
              <div className="h-2 w-2 rounded-full bg-indigo-600 animate-ping" />
            )}
            {nodeData.executionStatus === 'failed' && (
              <XCircle className="h-3.5 w-3.5 text-red-600" />
            )}
            <span className="font-medium capitalize text-zinc-700">
              {nodeData.executionStatus}
            </span>
          </div>
          {nodeData.executionDurationMs !== undefined && (
            <span className="text-zinc-400 tabular-nums">
              {nodeData.executionDurationMs}ms
            </span>
          )}
        </div>
      )}

      {/* Validation Warning */}
      {nodeData.hasValidationError && (
        <div className="mt-2 flex items-center gap-1 text-[10px] text-red-600 font-medium">
          <AlertTriangle className="h-3 w-3 shrink-0" />
          <span className="truncate">{nodeData.validationErrorMessage || 'Invalid Configuration'}</span>
        </div>
      )}

      {/* Source Connection Handle (Bottom) */}
      <Handle
        type="source"
        position={Position.Bottom}
        className="!h-3 !w-3 !rounded-full !bg-zinc-300 !border-2 !border-white hover:!bg-indigo-600 transition-colors"
      />
    </div>
  );
});

CustomWorkflowNode.displayName = 'CustomWorkflowNode';
