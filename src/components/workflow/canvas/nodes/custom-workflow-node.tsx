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
        badge: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
        iconBg: 'bg-purple-500/20 text-purple-400 border-purple-500/40',
        cardBorder: 'hover:border-purple-500/60',
        selectedBorder: 'border-purple-500 shadow-[0_0_20px_rgba(168,85,247,0.25)]',
      };
    }
    if (type === 'action_ai_qualify') {
      return {
        badge: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30',
        iconBg: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/40',
        cardBorder: 'hover:border-indigo-500/60',
        selectedBorder: 'border-indigo-500 shadow-[0_0_20px_rgba(99,102,241,0.25)]',
      };
    }
    if (type === 'action_crm_upsert' || type === 'action_send_email' || type === 'action_slack_notify') {
      return {
        badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
        iconBg: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40',
        cardBorder: 'hover:border-emerald-500/60',
        selectedBorder: 'border-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.25)]',
      };
    }
    return {
      badge: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
      iconBg: 'bg-blue-500/20 text-blue-400 border-blue-500/40',
      cardBorder: 'hover:border-blue-500/60',
      selectedBorder: 'border-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.25)]',
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

  const Icon = getNodeIcon(nodeData.type);
  const theme = getNodeTheme(nodeData.type);

  return (
    <div
      className={`relative min-w-[260px] max-w-[320px] rounded-xl border bg-zinc-900/90 backdrop-blur-md p-3.5 text-xs text-zinc-200 transition-all duration-150 ${
        selected ? theme.selectedBorder : `border-zinc-800 ${theme.cardBorder}`
      }`}
    >
      {/* Target Handle (Incoming Connection) - Not shown for Triggers */}
      {!isTrigger && (
        <Handle
          type="target"
          position={Position.Top}
          className="!h-3 !w-3 !rounded-full !border-2 !border-zinc-900 !bg-zinc-400 hover:!bg-indigo-400 transition-colors"
        />
      )}

      {/* Header */}
      <div className="flex items-start justify-between gap-2.5">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border ${theme.iconBg}`}>
            <Icon className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="font-semibold text-white tracking-tight truncate text-xs">
              {nodeData.title}
            </h4>
            <span className="text-[10px] font-mono text-zinc-400 block truncate">
              {nodeData.type}
            </span>
          </div>
        </div>

        {/* Action Controls on Hover/Select */}
        <div className="flex items-center gap-1 shrink-0">
          {nodeData.onDuplicateNode && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                nodeData.onDuplicateNode?.(nodeData.nodeId);
              }}
              title="Duplicate node"
              className="p-1 rounded text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
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
              title="Delete node"
              className="p-1 rounded text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>

      {/* Summary Snippet */}
      <div className="mt-2.5 pt-2 border-t border-zinc-800/80 flex items-center justify-between gap-2 text-[11px] text-zinc-400 font-mono">
        <span className="truncate">{getConfigSummary()}</span>
        <span className="text-[10px] text-zinc-600 font-sans shrink-0">
          #{nodeData.nodeId.slice(-4)}
        </span>
      </div>

      {/* Error State Badge */}
      {nodeData.hasErrors && (
        <div className="mt-2 flex items-center gap-1.5 p-1.5 rounded-md bg-red-950/40 border border-red-800/50 text-[10px] text-red-300">
          <AlertTriangle className="h-3 w-3 shrink-0 text-red-400" />
          <span className="truncate">{nodeData.errorMessages?.[0] || 'Invalid configuration'}</span>
        </div>
      )}

      {/* Live Execution Status Overlay Badge during Test Runs */}
      {nodeData.executionStatus && (
        <div className="mt-2 pt-1.5 border-t border-zinc-800/60 flex items-center justify-between text-[10px]">
          <span className="text-zinc-500 font-medium">Test Run:</span>
          {nodeData.executionStatus === 'succeeded' && (
            <span className="inline-flex items-center gap-1 font-semibold text-emerald-400">
              <CheckCircle2 className="h-3 w-3" /> Succeeded
              {nodeData.executionDurationMs ? ` (${nodeData.executionDurationMs}ms)` : ''}
            </span>
          )}
          {nodeData.executionStatus === 'running' && (
            <span className="inline-flex items-center gap-1 font-semibold text-blue-400 animate-pulse">
              <Activity className="h-3 w-3 animate-spin" /> Running
            </span>
          )}
          {nodeData.executionStatus === 'failed' && (
            <span className="inline-flex items-center gap-1 font-semibold text-red-400">
              <XCircle className="h-3 w-3" /> Failed
            </span>
          )}
          {nodeData.executionStatus === 'skipped' && (
            <span className="inline-flex items-center gap-1 font-medium text-zinc-500">
              Skipped
            </span>
          )}
        </div>
      )}

      {/* Source Handle (Outgoing Connection) */}
      <Handle
        type="source"
        position={Position.Bottom}
        className="!h-3 !w-3 !rounded-full !border-2 !border-zinc-900 !bg-zinc-400 hover:!bg-indigo-400 transition-colors"
      />
    </div>
  );
});

CustomWorkflowNode.displayName = 'CustomWorkflowNode';
