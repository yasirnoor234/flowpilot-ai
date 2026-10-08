'use client';

import React, { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { WorkflowRunRecord, WorkflowRunStatus } from '@/types/execution';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Activity,
  Play,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Clock,
  Ban,
  Filter,
  ArrowUpRight,
  Sparkles,
} from 'lucide-react';
import { rerunWorkflowAction } from '@/lib/actions/execution';

interface RunListProps {
  runs: (WorkflowRunRecord & {
    workflow?: { id: string; name: string };
  })[];
  workspaceId: string;
}

export function RunList({ runs, workspaceId }: RunListProps) {
  const router = useRouter();
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [isPending, startTransition] = useTransition();
  const [rerunningId, setRerunningId] = useState<string | null>(null);

  const filteredRuns = runs.filter((run) => {
    if (filterStatus === 'all') return true;
    return run.status === filterStatus;
  });

  const handleRerun = (runId: string) => {
    setRerunningId(runId);
    startTransition(async () => {
      const res = await rerunWorkflowAction({ runId });
      setRerunningId(null);
      if (res.success && res.newRunId) {
        router.push(`/runs/${res.newRunId}`);
      }
    });
  };

  const getStatusBadge = (status: WorkflowRunStatus) => {
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

  const formatDuration = (run: WorkflowRunRecord) => {
    if (!run.started_at) return '—';
    const start = new Date(run.started_at).getTime();
    const end = run.finished_at ? new Date(run.finished_at).getTime() : Date.now();
    const diffMs = Math.max(0, end - start);
    if (diffMs < 1000) return `${diffMs}ms`;
    if (diffMs < 60000) return `${(diffMs / 1000).toFixed(1)}s`;
    return `${Math.floor(diffMs / 60000)}m ${Math.floor((diffMs % 60000) / 1000)}s`;
  };

  return (
    <div className="space-y-4">
      {/* Filters Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-zinc-900/60 p-3 rounded-lg border border-zinc-800">
        <div className="flex items-center gap-1.5 flex-wrap">
          <Filter className="h-4 w-4 text-zinc-400 mr-1" />
          {(['all', 'succeeded', 'failed', 'running', 'waiting', 'canceled'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-2.5 py-1 text-xs rounded-md font-medium transition-colors ${
                filterStatus === status
                  ? 'bg-purple-600/20 text-purple-300 border border-purple-500/40'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
              {status === 'all' && ` (${runs.length})`}
            </button>
          ))}
        </div>
      </div>

      {/* Runs Table */}
      <div className="rounded-lg border border-zinc-800 bg-zinc-900/40 overflow-hidden">
        <table className="w-full text-left text-xs text-zinc-300">
          <thead className="border-b border-zinc-800 bg-zinc-950/70 text-zinc-400 font-medium">
            <tr>
              <th className="px-4 py-3">Workflow</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Trigger</th>
              <th className="px-4 py-3">Started</th>
              <th className="px-4 py-3">Duration</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/60">
            {filteredRuns.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-zinc-500">
                  No workflow execution runs match the selected filter.
                </td>
              </tr>
            ) : (
              filteredRuns.map((run) => (
                <tr key={run.id} className="hover:bg-zinc-800/40 transition-colors group">
                  <td className="px-4 py-3.5">
                    <div className="flex flex-col gap-0.5">
                      <Link
                        href={`/runs/${run.id}`}
                        className="font-semibold text-zinc-100 group-hover:text-purple-400 transition-colors inline-flex items-center gap-1.5"
                      >
                        <span>{run.workflow?.name || 'Workflow Run'}</span>
                        <ArrowUpRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </Link>
                      <span className="text-[10px] font-mono text-zinc-500">
                        {run.id.slice(0, 8)}... (v{run.workflow_version_id?.slice(0, 6)})
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3.5">{getStatusBadge(run.status)}</td>
                  <td className="px-4 py-3.5">
                    <div className="inline-flex items-center gap-1 text-zinc-300 font-medium">
                      <Sparkles className="h-3 w-3 text-purple-400" />
                      <span className="capitalize">{run.trigger_source}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 text-zinc-400">
                    {run.started_at ? new Date(run.started_at).toLocaleString() : 'Queued'}
                  </td>
                  <td className="px-4 py-3.5 font-mono text-zinc-400">{formatDuration(run)}</td>
                  <td className="px-4 py-3.5 text-right">
                    <div className="inline-flex items-center gap-2">
                      <Link href={`/runs/${run.id}`}>
                        <Button variant="ghost" size="sm" className="h-7 text-xs px-2.5">
                          Inspect
                        </Button>
                      </Link>
                      <Button
                        variant="secondary"
                        size="sm"
                        className="h-7 text-xs px-2.5"
                        onClick={() => handleRerun(run.id)}
                        disabled={isPending && rerunningId === run.id}
                      >
                        <RotateCcw
                          className={`h-3 w-3 mr-1 ${rerunningId === run.id ? 'animate-spin' : ''}`}
                        />
                        <span>Rerun</span>
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
