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
      className={`relative min-w-[280px] max-w-[340px] rounded-xl border bg-white p-3.5 text-xs text-zinc-800 transition-all duration-150 shadow-xs ${
        selected
          ? 'ring-2 ring-indigo-600 border-transparent'
          : 'border-zinc-200 hover:border-zinc-300'
      }`}
    >
      {/* Target Handle (Incoming Connection) */}
      <Handle
        type="target"
        position={Position.Top}
        className="!h-3 !w-3 !rounded-full !border-2 !border-white !bg-zinc-300 hover:!bg-indigo-600 transition-colors"
      />

      {/* Header */}
      <div className="flex items-start justify-between gap-2.5">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-800">
            <GitFork className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="font-semibold text-zinc-900 tracking-tight truncate text-xs">
              {nodeData.title}
            </h4>
            <span className="text-[10px] font-mono text-zinc-400 block">
              Branch (IF/ELSE)
            </span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1 shrink-0 opacity-80 hover:opacity-100">
          {nodeData.onDuplicateNode && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                nodeData.onDuplicateNode?.(nodeData.nodeId);
              }}
              title="Duplicate node"
              className="p-1 rounded-md text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors"
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
              className="p-1 rounded-md text-zinc-400 hover:text-red-600 hover:bg-red-50 transition-colors"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>

      {/* Rule Expression Box */}
      <div className="mt-2.5 p-2 rounded-lg bg-zinc-50 border border-zinc-200/60 text-[11px] font-mono text-zinc-700 flex items-center justify-between gap-2">
        <span className="truncate">{getConditionText()}</span>
        <span className="text-[10px] text-zinc-400 font-sans shrink-0">
          #{nodeData.nodeId.slice(-4)}
        </span>
      </div>

      {/* Error State Badge */}
      {nodeData.hasErrors && (
        <div className="mt-2 flex items-center gap-1.5 p-1.5 rounded-md bg-red-50 border border-red-200 text-[10px] text-red-700">
          <AlertTriangle className="h-3 w-3 shrink-0 text-red-600" />
          <span className="truncate">{nodeData.errorMessages?.[0] || 'Invalid condition rule configuration'}</span>
        </div>
      )}

      {/* Test Execution Overlay */}
      {nodeData.executionStatus && (
        <div className="mt-2 pt-2 border-t border-zinc-100 flex items-center justify-between text-[11px]">
          <div className="flex items-center gap-1.5">
            {nodeData.executionStatus === 'succeeded' ? (
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
            ) : nodeData.executionStatus === 'failed' ? (
              <XCircle className="h-3.5 w-3.5 text-red-600" />
            ) : (
              <div className="h-2 w-2 rounded-full bg-indigo-600 animate-ping" />
            )}
            <span className="capitalize font-medium text-zinc-700">
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

      {/* Branch Output Handles */}
      <div className="mt-3.5 pt-2.5 border-t border-zinc-100 grid grid-cols-2 gap-2 text-[10px] font-medium">
        {/* TRUE Branch (Green Handle) */}
        <div className="relative flex items-center gap-1.5 px-2 py-1 rounded bg-emerald-50 text-emerald-800 border border-emerald-200/80">
          <Check className="h-3 w-3 text-emerald-700 shrink-0" />
          <span>TRUE Branch</span>
          <Handle
            type="source"
            position={Position.Bottom}
            id="true"
            className="!h-3 !w-3 !rounded-full !border-2 !border-white !bg-emerald-600 hover:!bg-emerald-700 transition-colors"
            style={{ left: '25%' }}
          />
        </div>

        {/* FALSE Branch (Red Handle) */}
        <div className="relative flex items-center gap-1.5 px-2 py-1 rounded bg-zinc-100 text-zinc-700 border border-zinc-200">
          <X className="h-3 w-3 text-zinc-500 shrink-0" />
          <span>FALSE Branch</span>
          <Handle
            type="source"
            position={Position.Bottom}
            id="false"
            className="!h-3 !w-3 !rounded-full !border-2 !border-white !bg-zinc-400 hover:!bg-zinc-600 transition-colors"
            style={{ left: '75%' }}
          />
        </div>
      </div>
    </div>
  );
});

ConditionIfElseNode.displayName = 'ConditionIfElseNode';
