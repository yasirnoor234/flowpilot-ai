'use client';

import React, { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import type { WorkflowNodeData } from '../types';
import {
  GitFork,
  Check,
  X,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Activity,
  Copy,
  Trash2,
} from 'lucide-react';

export const ConditionIfElseNode = memo(({ data, selected }: NodeProps) => {
  const nodeData = data as unknown as WorkflowNodeData;
  const config = nodeData.config || {};

  const getConditionText = () => {
    const field = config.field_path || 'field';
    const op = config.operator || 'equals';
    const val = config.compare_value !== undefined ? `"${config.compare_value}"` : '';
    return `${field} ${op} ${val}`.trim();
  };

  return (
    <div
      className={`relative min-w-[280px] max-w-[340px] rounded-xl border bg-zinc-900/90 backdrop-blur-md p-3.5 text-xs text-zinc-200 transition-all duration-150 ${
        selected
          ? 'border-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.25)]'
          : 'border-zinc-800 hover:border-amber-500/60'
      }`}
    >
      {/* Target Handle (Incoming Connection) */}
      <Handle
        type="target"
        position={Position.Top}
        className="!h-3 !w-3 !rounded-full !border-2 !border-zinc-900 !bg-zinc-400 hover:!bg-amber-400 transition-colors"
      />

      {/* Header */}
      <div className="flex items-start justify-between gap-2.5">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border bg-amber-500/20 text-amber-400 border-amber-500/40">
            <GitFork className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="font-semibold text-white tracking-tight truncate text-xs">
              {nodeData.title}
            </h4>
            <span className="text-[10px] font-mono text-amber-400/80 block">
              Conditional Branch (IF/ELSE)
            </span>
          </div>
        </div>

        {/* Action Controls */}
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

      {/* Rule Expression Box */}
      <div className="mt-2.5 p-2 rounded-lg bg-zinc-950/80 border border-zinc-800/80 text-[11px] font-mono text-amber-300 flex items-center justify-between gap-2">
        <span className="truncate">{getConditionText()}</span>
        <span className="text-[10px] text-zinc-600 font-sans shrink-0">
          #{nodeData.nodeId.slice(-4)}
        </span>
      </div>

      {/* Error State Badge */}
      {nodeData.hasErrors && (
        <div className="mt-2 flex items-center gap-1.5 p-1.5 rounded-md bg-red-950/40 border border-red-800/50 text-[10px] text-red-300">
          <AlertTriangle className="h-3 w-3 shrink-0 text-red-400" />
          <span className="truncate">{nodeData.errorMessages?.[0] || 'Condition rule error'}</span>
        </div>
      )}

      {/* Live Execution Status Overlay */}
      {nodeData.executionStatus && (
        <div className="mt-2 pt-1.5 border-t border-zinc-800/60 flex items-center justify-between text-[10px]">
          <span className="text-zinc-500 font-medium">Test Run:</span>
          {nodeData.executionStatus === 'succeeded' && (
            <span className="inline-flex items-center gap-1 font-semibold text-emerald-400">
              <CheckCircle2 className="h-3 w-3" /> Evaluated
            </span>
          )}
          {nodeData.executionStatus === 'running' && (
            <span className="inline-flex items-center gap-1 font-semibold text-blue-400 animate-pulse">
              <Activity className="h-3 w-3 animate-spin" /> Evaluating
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

      {/* Dual Labeled Branch Handles (Bottom) */}
      <div className="mt-3 pt-2.5 border-t border-zinc-800/90 grid grid-cols-2 gap-2 text-[10px] font-semibold">
        {/* TRUE Handle Box */}
        <div className="relative flex items-center justify-center gap-1 p-1.5 rounded-md bg-emerald-950/30 border border-emerald-800/40 text-emerald-400">
          <Check className="h-3 w-3" />
          <span>TRUE (Match)</span>
          <Handle
            id="true"
            type="source"
            position={Position.Bottom}
            className="!h-3.5 !w-3.5 !rounded-full !border-2 !border-zinc-900 !bg-emerald-500 hover:!bg-emerald-400 !bottom-[-7px] transition-colors"
          />
        </div>

        {/* FALSE Handle Box */}
        <div className="relative flex items-center justify-center gap-1 p-1.5 rounded-md bg-rose-950/30 border border-rose-800/40 text-rose-400">
          <X className="h-3 w-3" />
          <span>FALSE (Fallback)</span>
          <Handle
            id="false"
            type="source"
            position={Position.Bottom}
            className="!h-3.5 !w-3.5 !rounded-full !border-2 !border-zinc-900 !bg-rose-500 hover:!bg-rose-400 !bottom-[-7px] transition-colors"
          />
        </div>
      </div>
    </div>
  );
});

ConditionIfElseNode.displayName = 'ConditionIfElseNode';
