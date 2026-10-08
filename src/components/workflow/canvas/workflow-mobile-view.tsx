'use client';

import React from 'react';
import type { WorkflowGraph } from '@/types/workflow';
import {
  Play,
  Webhook,
  Sliders,
  GitFork,
  Bot,
  Database,
  Mail,
  MessageSquare,
  Clock,
  Activity,
  ArrowDown,
  Sparkles,
} from 'lucide-react';

interface WorkflowMobileViewProps {
  graph: WorkflowGraph;
}

export function WorkflowMobileView({ graph }: WorkflowMobileViewProps) {
  const getNodeIcon = (type: string) => {
    switch (type) {
      case 'trigger_manual':
        return Play;
      case 'trigger_webhook':
        return Webhook;
      case 'action_field_mapping':
        return Sliders;
      case 'condition_if_else':
        return GitFork;
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

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 space-y-4">
      <div className="flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-purple-400" />
        <h3 className="text-sm font-bold text-white tracking-tight">
          Workflow Step Sequence ({graph.nodes.length} Steps)
        </h3>
      </div>
      <p className="text-xs text-zinc-400">
        On mobile devices, a linear representation of your DAG graph is shown below. Switch to desktop for full visual drag-and-drop editing.
      </p>

      <div className="space-y-3 pt-2">
        {graph.nodes.map((node, idx) => {
          const Icon = getNodeIcon(node.type);
          const outgoingEdges = (graph.edges || []).filter((e) => e.source === node.id);

          return (
            <React.Fragment key={node.id}>
              <div className="p-3.5 rounded-xl border border-zinc-800 bg-zinc-950/80 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-zinc-900 border border-zinc-800 text-purple-400">
                      <Icon className="h-3.5 w-3.5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-semibold text-white">{node.title}</h4>
                      <span className="text-[10px] font-mono text-zinc-500">{node.type}</span>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-900 text-zinc-400 border border-zinc-800">
                    Step {idx + 1}
                  </span>
                </div>

                {node.type === 'condition_if_else' && (
                  <div className="pt-2 grid grid-cols-2 gap-2 text-[10px]">
                    <div className="p-1.5 rounded bg-emerald-950/30 border border-emerald-800/40 text-emerald-300">
                      <span className="font-semibold block">TRUE Branch:</span>
                      <span className="font-mono text-[9px] text-zinc-400">
                        {outgoingEdges.find((e) => e.source_handle === 'true')?.target || 'None'}
                      </span>
                    </div>
                    <div className="p-1.5 rounded bg-rose-950/30 border border-rose-800/40 text-rose-300">
                      <span className="font-semibold block">FALSE Branch:</span>
                      <span className="font-mono text-[9px] text-zinc-400">
                        {outgoingEdges.find((e) => e.source_handle === 'false')?.target || 'None'}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {idx < graph.nodes.length - 1 && (
                <div className="flex justify-center">
                  <ArrowDown className="h-4 w-4 text-zinc-600" />
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}
