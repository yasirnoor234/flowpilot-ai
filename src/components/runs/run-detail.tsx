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
  AlertTriangle,
  Info,
} from 'lucide-react';
import { cancelWorkflowRunAction, rerunWorkflowAction } from '@/lib/actions/execution';
import { redactSecrets } from '@/lib/security/encryption';

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
  const [showRerunConfirm, setShowRerunConfirm] = useState(false);

  const selectedStep = steps.find((s) => s.id === selectedStepId);

  const handleCancel = () => {
    if (!confirm('Are you sure you want to cancel this in-flight run?')) return;
    startTransition(async () => {
      await cancelWorkflowRunAction(run.id);
      router.refresh();
    });
  };

  const handleRerun = () => {
    startTransition(async () => {
      const res = await rerunWorkflowAction(run.id);
      setShowRerunConfirm(false);
      if (res.success && res.runId) {
        router.push(`/runs/${res.runId}`);
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
    if (type === 'action_slack_notify') return MessageSquare;
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
          <Badge variant="danger" className="gap-1">
            <XCircle className="h-3 w-3" />
            <span>Failed</span>
          </Badge>
        );
      case 'running':
        return (
          <Badge variant="outline" className="gap-1 text-purple-400 border-purple-500/40 animate-pulse">
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
          <Badge variant="secondary" className="gap-1 opacity-70">
            <Ban className="h-3 w-3" />
            <span>Skipped</span>
          </Badge>
        );
      case 'canceled':
        return (
          <Badge variant="secondary" className="gap-1">
            <Ban className="h-3 w-3" />
            <span>Canceled</span>
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary" className="gap-1">
            <Clock className="h-3 w-3" />
            <span>{status}</span>
          </Badge>
        );
    }
  };

  const safeJsonRender = (data: any) => {
    if (!data) return '{}';
    const raw = JSON.stringify(data, null, 2);
    return redactSecrets(raw);
  };

  return (
    <div className="space-y-6">
      {/* Header & Actions */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-zinc-800 pb-4">
        <div className="flex items-center gap-3">
          <Link href="/runs">
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-full bg-zinc-900 border border-zinc-800">
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
                  (Linked Rerun of {run.parent_run_id.slice(0, 8)}...)
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
              variant="danger"
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
            onClick={() => setShowRerunConfirm(true)}
            disabled={isPending}
            className="gap-1 text-xs bg-purple-600 hover:bg-purple-500"
          >
            <RotateCcw className={`h-3.5 w-3.5 ${isPending ? 'animate-spin' : ''}`} />
            <span>Rerun Execution</span>
          </Button>
        </div>
      </div>

      {/* Metadata Overview Banner */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-zinc-900/60 p-4 rounded-2xl border border-zinc-800 text-xs">
        <div>
          <span className="text-zinc-500 block text-[11px]">Trigger Source</span>
          <span className="text-zinc-200 font-medium capitalize mt-0.5 inline-flex items-center gap-1">
            <Sparkles className="h-3 w-3 text-purple-400" />
            {run.trigger_type}
          </span>
        </div>
        <div>
          <span className="text-zinc-500 block text-[11px]">Workflow Version</span>
          <span className="text-zinc-200 font-mono mt-0.5 block">
            {run.workflow_version?.version_number ? `v${run.workflow_version.version_number}` : 'Draft Snapshot'}
          </span>
        </div>
        <div>
          <span className="text-zinc-500 block text-[11px]">Started At</span>
          <span className="text-zinc-200 font-mono mt-0.5 block">
            {run.started_at ? new Date(run.started_at).toLocaleTimeString() : 'Queued'}
          </span>
        </div>
        <div>
          <span className="text-zinc-500 block text-[11px]">Finished At</span>
          <span className="text-zinc-200 font-mono mt-0.5 block">
            {run.finished_at ? new Date(run.finished_at).toLocaleTimeString() : 'In Progress'}
          </span>
        </div>
      </div>

      {run.error_message && (
        <div className="p-4 rounded-2xl bg-rose-950/30 border border-rose-800/50 text-xs text-rose-200 space-y-1 shadow-lg">
          <p className="font-bold flex items-center gap-1.5 text-rose-300">
            <XCircle className="h-4 w-4 text-rose-400" />
            <span>Execution Interrupted / Failed:</span>
          </p>
          <p className="font-mono text-rose-300 text-[11px] leading-relaxed pl-5">
            {redactSecrets(run.error_message)}
          </p>
        </div>
      )}

      {/* Main Execution Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Step Timeline (Left / 5 cols) */}
        <div className="lg:col-span-5 rounded-2xl border border-zinc-800 bg-zinc-900/40 overflow-hidden shadow-xl">
          <div className="px-4 py-3 bg-zinc-950/60 border-b border-zinc-800 flex items-center justify-between">
            <h3 className="text-xs font-bold text-zinc-200 flex items-center gap-1.5">
              <Layers className="h-4 w-4 text-purple-400" />
              <span>Step Execution Timeline ({steps.length})</span>
            </h3>
          </div>

          <div className="divide-y divide-zinc-800/60 max-h-[600px] overflow-y-auto">
            {steps.length === 0 ? (
              <div className="p-8 text-center text-xs text-zinc-500 italic">
                Execution steps are pending queue dispatch...
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
                      <div className="flex items-center justify-center h-8 w-8 rounded-xl bg-zinc-800 text-zinc-300 border border-zinc-700/60 shrink-0">
                        <Icon className="h-4 w-4 text-purple-400" />
                      </div>
                      <div>
                        <div className="text-xs font-semibold flex items-center gap-1.5">
                          <span>{step.node_title}</span>
                          <span className="text-[10px] text-zinc-500 font-mono">#{idx + 1}</span>
                        </div>
                        <p className="text-[10px] font-mono text-zinc-500 mt-0.5">{step.node_type}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {step.duration_ms !== null && step.duration_ms !== undefined && step.duration_ms > 0 && (
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
        <div className="lg:col-span-7 rounded-2xl border border-zinc-800 bg-zinc-900/40 overflow-hidden shadow-xl">
          <div className="px-4 py-2.5 bg-zinc-950/60 border-b border-zinc-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveTab('steps')}
                className={`px-3 py-1 text-xs rounded-lg font-medium transition-colors ${
                  activeTab === 'steps' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Selected Step
              </button>
              <button
                onClick={() => setActiveTab('trigger')}
                className={`px-3 py-1 text-xs rounded-lg font-medium transition-colors ${
                  activeTab === 'trigger' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Trigger Payload
              </button>
            </div>
            <span className="text-[11px] font-mono text-zinc-500">Sanitized JSON Inspector</span>
          </div>

          <div className="p-4 space-y-4 max-h-[600px] overflow-y-auto">
            {activeTab === 'trigger' ? (
              <div>
                <h4 className="text-xs font-semibold text-zinc-400 mb-2 flex items-center gap-1.5">
                  <Code2 className="h-3.5 w-3.5 text-purple-400" />
                  <span>Initial Inbound Trigger Event (Secrets Redacted)</span>
                </h4>
                <pre className="p-3.5 rounded-xl bg-zinc-950 text-xs font-mono text-emerald-400 border border-zinc-800/80 overflow-x-auto leading-relaxed">
                  {safeJsonRender(run.trigger_payload)}
                </pre>
              </div>
            ) : selectedStep ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
                  <div>
                    <h4 className="text-xs font-bold text-white">{selectedStep.node_title}</h4>
                    <span className="text-[10px] font-mono text-zinc-500">
                      Node ID: {selectedStep.node_id}
                    </span>
                  </div>
                  {getStatusBadge(selectedStep.status)}
                </div>

                {/* Reason Banner for Skipped or Failed Steps */}
                {selectedStep.error_message && (
                  <div
                    className={`p-3.5 rounded-xl text-xs space-y-1 ${
                      selectedStep.status === 'skipped'
                        ? 'bg-zinc-800/60 border border-zinc-700/60 text-zinc-300'
                        : 'bg-rose-950/30 border border-rose-800/40 text-rose-300'
                    }`}
                  >
                    <p className="font-semibold flex items-center gap-1.5">
                      {selectedStep.status === 'skipped' ? <Info className="h-4 w-4 text-purple-400" /> : <XCircle className="h-4 w-4 text-rose-400" />}
                      <span>{selectedStep.status === 'skipped' ? 'Step Skipped Reason:' : 'Step Error Message:'}</span>
                    </p>
                    <p className="font-mono text-[11px] pl-5 leading-relaxed">
                      {redactSecrets(selectedStep.error_message)}
                    </p>
                  </div>
                )}

                <div>
                  <h5 className="text-xs font-semibold text-zinc-400 mb-1.5 flex items-center gap-1.5">
                    <Code2 className="h-3.5 w-3.5 text-blue-400" />
                    <span>Resolved Step Inputs (Redacted)</span>
                  </h5>
                  <pre className="p-3.5 rounded-xl bg-zinc-950 text-[11px] font-mono text-blue-300 border border-zinc-800/80 overflow-x-auto leading-relaxed">
                    {safeJsonRender(selectedStep.input_data)}
                  </pre>
                </div>

                <div>
                  <h5 className="text-xs font-semibold text-zinc-400 mb-1.5 flex items-center gap-1.5">
                    <Code2 className="h-3.5 w-3.5 text-emerald-400" />
                    <span>Step Output Data (Redacted)</span>
                  </h5>
                  <pre className="p-3.5 rounded-xl bg-zinc-950 text-[11px] font-mono text-emerald-300 border border-zinc-800/80 overflow-x-auto leading-relaxed">
                    {safeJsonRender(selectedStep.output_data)}
                  </pre>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center text-xs text-zinc-500">
                Select a step on the left timeline to inspect its inputs and outputs.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Rerun Confirmation Modal */}
      {showRerunConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-400 shrink-0">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Confirm Workflow Rerun</h3>
                <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                  Rerunning will instantiate a new durable execution run linked to parent run <code>{run.id.slice(0, 8)}</code>.
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-amber-950/20 border border-amber-800/40 text-xs text-amber-300 space-y-1 font-medium">
              <span>⚠️ Duplicate Delivery Warning:</span>
              <p className="text-[11px] text-zinc-300 font-normal">
                If downstream steps are configured for live email or Slack alerts, a rerun may re-trigger external deliveries.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-800">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowRerunConfirm(false)}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                disabled={isPending}
                onClick={handleRerun}
                className="text-xs bg-purple-600 hover:bg-purple-500 gap-1.5"
              >
                <RotateCcw className={`h-3.5 w-3.5 ${isPending ? 'animate-spin' : ''}`} />
                <span>{isPending ? 'Starting Rerun...' : 'Confirm & Rerun'}</span>
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
