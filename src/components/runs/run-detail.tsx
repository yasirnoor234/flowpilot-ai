'use client';

import React, { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { WorkflowRunRecord, WorkflowStepRunRecord } from '@/types/execution';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog } from '@/components/ui/dialog';
import {
  Activity,
  ArrowLeft,
  RotateCcw,
  Ban,
  CheckCircle2,
  XCircle,
  Clock,
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
  Code2,
  Workflow as WorkflowIcon,
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

export function RunDetail({ run, steps }: RunDetailProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [selectedStepId, setSelectedStepId] = useState<string | null>(steps[0]?.id || null);
  const [activeTab, setActiveTab] = useState<'steps' | 'trigger'>('steps');
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
    if (type.startsWith('trigger_')) return WorkflowIcon;
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
          <Badge variant="destructive" className="gap-1">
            <XCircle className="h-3 w-3" />
            <span>Failed</span>
          </Badge>
        );
      case 'running':
        return (
          <Badge variant="primary" className="gap-1">
            <Activity className="h-3 w-3 animate-spin" />
            <span>Running</span>
          </Badge>
        );
      case 'waiting':
        return (
          <Badge variant="warning" className="gap-1">
            <Clock className="h-3 w-3" />
            <span>Waiting</span>
          </Badge>
        );
      case 'skipped':
        return (
          <Badge variant="secondary" className="gap-1">
            <Ban className="h-3 w-3" />
            <span>Skipped</span>
          </Badge>
        );
      case 'canceled':
        return (
          <Badge variant="muted" className="gap-1">
            <Ban className="h-3 w-3" />
            <span>Canceled</span>
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary" className="gap-1 capitalize">
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
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-zinc-200 pb-5">
        <div className="flex items-center gap-3">
          <Link href="/runs">
            <Button variant="outline" size="sm" className="h-9 w-9 p-0 rounded-lg">
              <ArrowLeft className="h-4 w-4 text-zinc-600" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl font-bold text-zinc-900 tracking-tight">
                {run.workflow?.name || 'Workflow Run'}
              </h1>
              {getStatusBadge(run.status)}
            </div>
            <p className="text-xs font-mono text-zinc-500 mt-1">
              Run ID: <span className="text-zinc-700">{run.id}</span>
              {run.parent_run_id && (
                <span className="text-indigo-600 ml-2 font-sans font-medium">
                  (Rerun of {run.parent_run_id.slice(0, 8)}...)
                </span>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {run.workflow_id && (
            <Link href={`/workflows/${run.workflow_id}`}>
              <Button variant="outline" size="sm" className="gap-1.5 text-xs">
                <span>View workflow</span>
                <ExternalLink className="h-3.5 w-3.5 text-zinc-400" />
              </Button>
            </Link>
          )}

          {['running', 'waiting', 'queued'].includes(run.status) && (
            <Button
              variant="destructive"
              size="sm"
              onClick={handleCancel}
              disabled={isPending}
              className="gap-1.5 text-xs"
            >
              <Ban className="h-3.5 w-3.5" />
              <span>Cancel run</span>
            </Button>
          )}

          <Button
            variant="default"
            size="sm"
            onClick={() => setShowRerunConfirm(true)}
            disabled={isPending}
            className="gap-1.5 text-xs"
          >
            <RotateCcw className={`h-3.5 w-3.5 ${isPending ? 'animate-spin' : ''}`} />
            <span>Rerun</span>
          </Button>
        </div>
      </div>

      {/* Metadata Overview Banner */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-white p-4 rounded-xl border border-zinc-200 shadow-sm text-xs">
        <div>
          <span className="text-zinc-500 block text-[11px] font-medium">Trigger source</span>
          <span className="text-zinc-900 font-semibold capitalize mt-1 block">
            {run.trigger_type.replace(/_/g, ' ')}
          </span>
        </div>
        <div>
          <span className="text-zinc-500 block text-[11px] font-medium">Workflow version</span>
          <span className="text-zinc-900 font-mono mt-1 block font-medium">
            {run.workflow_version?.version_number ? `v${run.workflow_version.version_number}` : 'Draft Snapshot'}
          </span>
        </div>
        <div>
          <span className="text-zinc-500 block text-[11px] font-medium">Started</span>
          <span className="text-zinc-900 font-mono mt-1 block tabular-nums">
            {run.started_at ? new Date(run.started_at).toLocaleTimeString() : 'Queued'}
          </span>
        </div>
        <div>
          <span className="text-zinc-500 block text-[11px] font-medium">Finished</span>
          <span className="text-zinc-900 font-mono mt-1 block tabular-nums">
            {run.finished_at ? new Date(run.finished_at).toLocaleTimeString() : 'In Progress'}
          </span>
        </div>
      </div>

      {run.error_message && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-xs text-red-900 space-y-1">
          <p className="font-semibold flex items-center gap-1.5 text-red-700">
            <XCircle className="h-4 w-4 text-red-600" />
            <span>Execution failed</span>
          </p>
          <p className="font-mono text-red-800 text-[11px] leading-relaxed pl-5">
            {redactSecrets(run.error_message)}
          </p>
        </div>
      )}

      {/* Main Execution Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Step Timeline (Left / 5 cols) */}
        <div className="lg:col-span-5 rounded-xl border border-zinc-200 bg-white overflow-hidden shadow-sm">
          <div className="px-4 py-3 bg-zinc-50 border-b border-zinc-200 flex items-center justify-between">
            <h2 className="text-xs font-semibold text-zinc-900 flex items-center gap-1.5">
              <Layers className="h-4 w-4 text-zinc-500" />
              <span>Step execution timeline ({steps.length})</span>
            </h2>
          </div>

          <div className="divide-y divide-zinc-100 max-h-[580px] overflow-y-auto">
            {steps.length === 0 ? (
              <div className="p-8 text-center text-xs text-zinc-500">
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
                        ? 'bg-indigo-50/60 border-l-2 border-indigo-600 text-zinc-900'
                        : 'hover:bg-zinc-50 text-zinc-700'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-zinc-100 text-zinc-600 border border-zinc-200 shrink-0">
                        <Icon className="h-4 w-4 text-zinc-600" />
                      </div>
                      <div>
                        <div className="text-xs font-semibold flex items-center gap-1.5 text-zinc-900">
                          <span>{step.node_title}</span>
                          <span className="text-[10px] text-zinc-400 font-mono">#{idx + 1}</span>
                        </div>
                        <p className="text-[10px] font-mono text-zinc-500 mt-0.5">{step.node_type}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {step.duration_ms !== null && step.duration_ms !== undefined && step.duration_ms > 0 && (
                        <span className="text-[10px] font-mono text-zinc-500 tabular-nums">
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
        <div className="lg:col-span-7 rounded-xl border border-zinc-200 bg-white overflow-hidden shadow-sm">
          <div className="px-4 py-2.5 bg-zinc-50 border-b border-zinc-200 flex items-center justify-between">
            <div className="flex items-center gap-1 bg-zinc-200/60 p-0.5 rounded-lg">
              <button
                onClick={() => setActiveTab('steps')}
                className={`px-3 py-1 text-xs rounded-md font-medium transition-colors ${
                  activeTab === 'steps' ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-600 hover:text-zinc-900'
                }`}
              >
                Selected step
              </button>
              <button
                onClick={() => setActiveTab('trigger')}
                className={`px-3 py-1 text-xs rounded-md font-medium transition-colors ${
                  activeTab === 'trigger' ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-600 hover:text-zinc-900'
                }`}
              >
                Trigger payload
              </button>
            </div>
            <span className="text-[11px] font-mono text-zinc-400">Sanitized inspector</span>
          </div>

          <div className="p-4 space-y-4 max-h-[580px] overflow-y-auto">
            {activeTab === 'trigger' ? (
              <div>
                <h3 className="text-xs font-semibold text-zinc-700 mb-2 flex items-center gap-1.5">
                  <Code2 className="h-3.5 w-3.5 text-zinc-500" />
                  <span>Initial trigger event (secrets redacted)</span>
                </h3>
                <pre className="p-3.5 rounded-lg bg-zinc-900 text-xs font-mono text-zinc-200 border border-zinc-800 overflow-x-auto leading-relaxed">
                  {safeJsonRender(run.trigger_payload)}
                </pre>
              </div>
            ) : selectedStep ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-zinc-100">
                  <div>
                    <h3 className="text-sm font-bold text-zinc-900">{selectedStep.node_title}</h3>
                    <span className="text-[11px] font-mono text-zinc-500">
                      Node ID: {selectedStep.node_id}
                    </span>
                  </div>
                  {getStatusBadge(selectedStep.status)}
                </div>

                {/* Reason Banner for Skipped or Failed Steps */}
                {selectedStep.error_message && (
                  <div
                    className={`p-3.5 rounded-lg text-xs space-y-1 ${
                      selectedStep.status === 'skipped'
                        ? 'bg-zinc-50 border border-zinc-200 text-zinc-700'
                        : 'bg-red-50 border border-red-200 text-red-900'
                    }`}
                  >
                    <p className="font-semibold flex items-center gap-1.5">
                      {selectedStep.status === 'skipped' ? <Info className="h-4 w-4 text-zinc-500" /> : <XCircle className="h-4 w-4 text-red-600" />}
                      <span>{selectedStep.status === 'skipped' ? 'Skip reason:' : 'Error details:'}</span>
                    </p>
                    <p className="font-mono text-[11px] pl-5 leading-relaxed">
                      {redactSecrets(selectedStep.error_message)}
                    </p>
                  </div>
                )}

                <div>
                  <h4 className="text-xs font-semibold text-zinc-700 mb-1.5 flex items-center gap-1.5">
                    <Code2 className="h-3.5 w-3.5 text-zinc-500" />
                    <span>Resolved inputs (secrets redacted)</span>
                  </h4>
                  <pre className="p-3.5 rounded-lg bg-zinc-900 text-[11px] font-mono text-zinc-200 border border-zinc-800 overflow-x-auto leading-relaxed">
                    {safeJsonRender(selectedStep.input_data)}
                  </pre>
                </div>

                <div>
                  <h4 className="text-xs font-semibold text-zinc-700 mb-1.5 flex items-center gap-1.5">
                    <Code2 className="h-3.5 w-3.5 text-zinc-500" />
                    <span>Step outputs (secrets redacted)</span>
                  </h4>
                  <pre className="p-3.5 rounded-lg bg-zinc-900 text-[11px] font-mono text-emerald-300 border border-zinc-800 overflow-x-auto leading-relaxed">
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
      <Dialog
        isOpen={showRerunConfirm}
        onClose={() => setShowRerunConfirm(false)}
        title="Confirm workflow rerun"
        description={`This will trigger a new durable execution linked to parent run ${run.id.slice(0, 8)}.`}
      >
        <div className="space-y-4">
          <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-1">
            <span className="font-semibold flex items-center gap-1 text-amber-800">
              <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
              External delivery notice
            </span>
            <p className="text-[11px] text-amber-800">
              If downstream actions send live emails or Slack notifications, rerunning may dispatch new alerts.
            </p>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowRerunConfirm(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={isPending}
              onClick={handleRerun}
              className="gap-1.5"
            >
              <RotateCcw className={`h-3.5 w-3.5 ${isPending ? 'animate-spin' : ''}`} />
              <span>{isPending ? 'Starting rerun...' : 'Confirm and rerun'}</span>
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
