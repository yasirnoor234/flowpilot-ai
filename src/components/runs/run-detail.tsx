'use client';

import React, { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { WorkflowRunRecord, WorkflowStepRunRecord, WorkflowRunStatus } from '@/types/execution';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Activity,
  ArrowLeft,
  RotateCcw,
  Ban,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  ChevronRight,
  Code2,
  Layers,
  Database,
  Mail,
  Bot,
  MessageSquare,
  GitFork,
  Sliders,
  ExternalLink,
} from 'lucide-react';
import { cancelWorkflowRunAction, rerunWorkflowAction } from '@/lib/actions/execution';

interface RunDetailProps {
  run: WorkflowRunRecord & {
    workflow?: { id: string; name: string };
    workflow_version?: { id: string; version_number: number; changelog: string };
  };
  steps: WorkflowStepRunRecord[];
  workspaceId: string;
}

export function RunDetail({ run, steps, workspaceId }: RunDetailProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [selectedStepId, setSelectedStepId] = useState<string | null>(steps[0]?.id || null);
  const [activeTab, setActiveTab] = useState<'steps' | 'trigger' | 'context'>('steps');

  const selectedStep = steps.find((s) => s.id === selectedStepId);

  const handleCancel = () => {
    if (!confirm('Are you sure you want to cancel this in-flight run?')) return;
    startTransition(async () => {
      await cancelWorkflowRunAction({ runId: run.id });
      router.refresh();
    });
  };

  const handleRerun = () => {
    startTransition(async () => {
      const res = await rerunWorkflowAction({ runId: run.id });
      if (res.success && res.newRunId) {
        router.push(`/runs/${res.newRunId}`);
      }
    });
  };

  const getNodeIcon = (type: string) => {
    if (type.startsWith('trigger_')) return Sparkles;
    if (type === 'condition_if_else') return GitFork;
    if (type === 'action_field_mapping') return Sliders;
    if (type === 'action_ai_qualify') return Bot;
    if (type === 'action_crm_upsert') return Database;
    if (type === 'action_send_email') return Mail;
    if (type === 'action_slack_alert') return MessageSquare;
    if (type === 'action_delay') return Clock;
    return Activity;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'succeeded':
        return (
          <Badge variant="success" className="gap-1">
            <CheckCircle2 className="h-3 w-3" />
            <span>Succeeded</span>
          </Badge>
        );
      case 'failed':
        return (
          <Badge variant="destructive" className="gap-1">
            <XCircle className="h-3 w-3" />
            <span>Failed</span>
          </Badge>
        );
      case 'running':
        return (
          <Badge variant="info" className="gap-1 animate-pulse">
            <Activity className="h-3 w-3 animate-spin" />
            <span>Running</span>
          </Badge>
        );
      case 'waiting':
        return (
          <Badge variant="warning" className="gap-1">
            <Clock className="h-3 w-3" />
            <span>Waiting (Delay)</span>
          </Badge>
        );
      case 'skipped':
        return (
          <Badge variant="neutral" className="gap-1 opacity-70">
            <Ban className="h-3 w-3" />
            <span>Skipped</span>
          </Badge>
        );
      case 'canceled':
        return (
          <Badge variant="neutral" className="gap-1">
            <Ban className="h-3 w-3" />
            <span>Canceled</span>
          </Badge>
        );
      default:
        return (
          <Badge variant="neutral" className="gap-1">
            <Clock className="h-3 w-3" />
            <span>{status}</span>
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Actions */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-zinc-800 pb-4">
        <div className="flex items-center gap-3">
          <Link href="/runs">
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-white tracking-tight">
                {run.workflow?.name || 'Workflow Run'}
              </h2>
              {getStatusBadge(run.status)}
            </div>
            <p className="text-xs font-mono text-zinc-400 mt-0.5">
              Run ID: <span className="text-zinc-200">{run.id}</span>
              {run.parent_run_id && (
                <span className="text-purple-400 ml-2">
                  (Rerun of {run.parent_run_id.slice(0, 8)}...)
                </span>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {run.workflow_id && (
            <Link href={`/workflows/${run.workflow_id}`}>
              <Button variant="secondary" size="sm" className="gap-1 text-xs">
                <span>View Workflow</span>
                <ExternalLink className="h-3 w-3" />
              </Button>
            </Link>
          )}

          {['running', 'waiting', 'queued'].includes(run.status) && (
            <Button
              variant="destructive"
              size="sm"
              onClick={handleCancel}
              disabled={isPending}
              className="gap-1 text-xs"
            >
              <Ban className="h-3.5 w-3.5" />
              <span>Cancel Run</span>
            </Button>
          )}

          <Button
            variant="default"
            size="sm"
            onClick={handleRerun}
            disabled={isPending}
            className="gap-1 text-xs"
          >
            <RotateCcw className={`h-3.5 w-3.5 ${isPending ? 'animate-spin' : ''}`} />
            <span>Rerun Execution</span>
          </Button>
        </div>
      </div>

      {/* Metadata Overview Banner */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-zinc-900/60 p-4 rounded-lg border border-zinc-800 text-xs">
        <div>
          <span className="text-zinc-500 block">Trigger Source</span>
          <span className="text-zinc-200 font-medium capitalize mt-0.5 inline-flex items-center gap-1">
            <Sparkles className="h-3 w-3 text-purple-400" />
            {run.trigger_source}
          </span>
        </div>
        <div>
          <span className="text-zinc-500 block">Workflow Version</span>
          <span className="text-zinc-200 font-mono mt-0.5 block">
            {run.workflow_version?.version_number ? `v${run.workflow_version.version_number}` : 'Draft Snapshot'}
          </span>
        </div>
        <div>
          <span className="text-zinc-500 block">Started At</span>
          <span className="text-zinc-200 font-mono mt-0.5 block">
            {run.started_at ? new Date(run.started_at).toLocaleTimeString() : 'Queued'}
          </span>
        </div>
        <div>
          <span className="text-zinc-500 block">Finished At</span>
          <span className="text-zinc-200 font-mono mt-0.5 block">
            {run.finished_at ? new Date(run.finished_at).toLocaleTimeString() : 'In Progress'}
          </span>
        </div>
      </div>

      {run.error_message && (
        <div className="p-3.5 rounded-lg bg-red-950/40 border border-red-800/60 text-xs text-red-200">
          <p className="font-semibold mb-0.5">Execution Failed:</p>
          <p className="font-mono text-red-300">{run.error_message}</p>
        </div>
      )}

      {/* Main Execution Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Step Timeline (Left / 5 cols) */}
        <div className="lg:col-span-5 rounded-lg border border-zinc-800 bg-zinc-900/40 overflow-hidden">
          <div className="px-4 py-3 bg-zinc-950/60 border-b border-zinc-800 flex items-center justify-between">
            <h3 className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
              <Layers className="h-4 w-4 text-purple-400" />
              <span>Step Execution Timeline ({steps.length})</span>
            </h3>
          </div>

          <div className="divide-y divide-zinc-800/60 max-h-[580px] overflow-y-auto">
            {steps.length === 0 ? (
              <div className="p-6 text-center text-xs text-zinc-500">
                Steps are pending execution...
              </div>
            ) : (
              steps.map((step, idx) => {
                const Icon = getNodeIcon(step.node_type);
                const isSelected = step.id === selectedStepId;
                return (
                  <button
                    key={step.id}
                    onClick={() => setSelectedStepId(step.id)}
                    className={`w-full text-left p-3.5 flex items-center justify-between transition-colors ${
                      isSelected
                        ? 'bg-purple-950/30 border-l-2 border-purple-500 text-white'
                        : 'hover:bg-zinc-800/30 text-zinc-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center h-7 w-7 rounded-md bg-zinc-800 text-zinc-300 border border-zinc-700/60">
                        <Icon className="h-3.5 w-3.5 text-purple-400" />
                      </div>
                      <div>
                        <div className="text-xs font-semibold flex items-center gap-1.5">
                          <span>{step.node_title}</span>
                          <span className="text-[10px] text-zinc-500 font-mono">#{idx + 1}</span>
                        </div>
                        <p className="text-[10px] font-mono text-zinc-500">{step.node_type}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {step.duration_ms !== undefined && step.duration_ms > 0 && (
                        <span className="text-[10px] font-mono text-zinc-500">
                          {step.duration_ms}ms
                        </span>
                      )}
                      {getStatusBadge(step.status)}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Step Inspector / JSON Viewer (Right / 7 cols) */}
        <div className="lg:col-span-7 rounded-lg border border-zinc-800 bg-zinc-900/40 overflow-hidden">
          <div className="px-4 py-2.5 bg-zinc-950/60 border-b border-zinc-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveTab('steps')}
                className={`px-3 py-1 text-xs rounded-md font-medium transition-colors ${
                  activeTab === 'steps'
                    ? 'bg-zinc-800 text-white'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Selected Step
              </button>
              <button
                onClick={() => setActiveTab('trigger')}
                className={`px-3 py-1 text-xs rounded-md font-medium transition-colors ${
                  activeTab === 'trigger'
                    ? 'bg-zinc-800 text-white'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Trigger Payload
              </button>
            </div>
            <span className="text-[11px] font-mono text-zinc-500">JSON Inspector</span>
          </div>

          <div className="p-4 space-y-4 max-h-[580px] overflow-y-auto">
            {activeTab === 'trigger' ? (
              <div>
                <h4 className="text-xs font-semibold text-zinc-400 mb-2 flex items-center gap-1.5">
                  <Code2 className="h-3.5 w-3.5 text-purple-400" />
                  <span>Initial Trigger Input Event</span>
                </h4>
                <pre className="p-3.5 rounded-md bg-zinc-950 text-xs font-mono text-emerald-400 border border-zinc-800/80 overflow-x-auto">
                  {JSON.stringify(run.trigger_payload || {}, null, 2)}
                </pre>
              </div>
            ) : selectedStep ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
                  <div>
                    <h4 className="text-xs font-bold text-white">{selectedStep.node_title}</h4>
                    <span className="text-[10px] font-mono text-zinc-500">
                      ID: {selectedStep.node_id}
                    </span>
                  </div>
                  {getStatusBadge(selectedStep.status)}
                </div>

                {selectedStep.error_message && (
                  <div className="p-3 rounded-md bg-red-950/40 border border-red-800/50 text-xs text-red-300">
                    <p className="font-semibold text-red-200">Step Error:</p>
                    <p className="font-mono mt-0.5">{selectedStep.error_message}</p>
                  </div>
                )}

                <div>
                  <h5 className="text-xs font-semibold text-zinc-400 mb-1.5 flex items-center gap-1.5">
                    <Code2 className="h-3.5 w-3.5 text-blue-400" />
                    <span>Resolved Step Inputs</span>
                  </h5>
                  <pre className="p-3 rounded-md bg-zinc-950 text-[11px] font-mono text-blue-300 border border-zinc-800/80 overflow-x-auto">
                    {JSON.stringify(selectedStep.input_data || {}, null, 2)}
                  </pre>
                </div>

                <div>
                  <h5 className="text-xs font-semibold text-zinc-400 mb-1.5 flex items-center gap-1.5">
                    <Code2 className="h-3.5 w-3.5 text-emerald-400" />
                    <span>Step Output Data</span>
                  </h5>
                  <pre className="p-3 rounded-md bg-zinc-950 text-[11px] font-mono text-emerald-300 border border-zinc-800/80 overflow-x-auto">
                    {JSON.stringify(selectedStep.output_data || {}, null, 2)}
                  </pre>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center text-xs text-zinc-500">
                Select a step on the left to inspect its inputs and outputs.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
