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
  Search,
  Calendar,
  AlertTriangle,
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
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [isPending, startTransition] = useTransition();

  // Rerun confirmation dialog state
  const [pendingRerunId, setPendingRerunId] = useState<string | null>(null);
  const [isExecutingRerun, setIsExecutingRerun] = useState(false);

  const filteredRuns = runs.filter((run) => {
    if (filterStatus !== 'all' && run.status !== filterStatus) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = run.workflow?.name?.toLowerCase().includes(q);
      const matchId = run.id.toLowerCase().includes(q);
      const matchTrigger = run.trigger_type.toLowerCase().includes(q);
      if (!matchName && !matchId && !matchTrigger) return false;
    }

    if (dateFilter !== 'all') {
      const runDate = new Date(run.created_at);
      const now = new Date();
      if (dateFilter === 'today') {
        if (runDate.toDateString() !== now.toDateString()) return false;
      } else if (dateFilter === '7days') {
        const diffDays = (now.getTime() - runDate.getTime()) / (1000 * 3600 * 24);
        if (diffDays > 7) return false;
      }
    }

    return true;
  });

  const confirmAndRerun = (runId: string) => {
    setIsExecutingRerun(true);
    startTransition(async () => {
      const res = await rerunWorkflowAction(runId);
      setIsExecutingRerun(false);
      setPendingRerunId(null);
      if (res.success && res.runId) {
        router.push(`/runs/${res.runId}`);
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
      {/* Search & Filter Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-zinc-900/60 p-3.5 rounded-2xl border border-zinc-800">
        <div className="flex items-center gap-2 flex-1 min-w-[240px] max-w-sm">
          <div className="relative w-full">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-zinc-500" />
            <input
              type="text"
              placeholder="Search runs by workflow name or run ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-zinc-200 placeholder:text-zinc-500 focus:outline-none focus:border-purple-500"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Status Filter */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <Filter className="h-3.5 w-3.5 text-zinc-400 mr-0.5" />
            {(['all', 'succeeded', 'failed', 'running', 'waiting', 'canceled'] as const).map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-colors ${
                  filterStatus === status
                    ? 'bg-purple-600/20 text-purple-300 border border-purple-500/40'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
                }`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>

          {/* Date Range Filter */}
          <div className="flex items-center gap-1 text-xs pl-2 border-l border-zinc-800">
            <Calendar className="h-3.5 w-3.5 text-zinc-400" />
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="rounded-lg bg-zinc-950 border border-zinc-800 px-2.5 py-1 text-xs text-zinc-300 focus:outline-none focus:border-purple-500"
            >
              <option value="all">All Dates</option>
              <option value="today">Today</option>
              <option value="7days">Last 7 Days</option>
            </select>
          </div>
        </div>
      </div>

      {/* Runs Table */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 overflow-hidden shadow-xl">
        <table className="w-full text-left text-xs text-zinc-300">
          <thead className="border-b border-zinc-800 bg-zinc-950/70 text-zinc-400 font-medium">
            <tr>
              <th className="px-4 py-3">Workflow</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Trigger Source</th>
              <th className="px-4 py-3">Started</th>
              <th className="px-4 py-3">Duration</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/60">
            {filteredRuns.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-zinc-500">
                  No workflow execution runs match the selected search or filters.
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
                        <span>{run.workflow?.name || 'Workflow Pipeline'}</span>
                        <ArrowUpRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </Link>
                      <span className="text-[10px] font-mono text-zinc-500">
                        Run ID: {run.id.slice(0, 8)}... (v{run.workflow_version_id?.slice(0, 6) || '1'})
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3.5">{getStatusBadge(run.status)}</td>
                  <td className="px-4 py-3.5">
                    <div className="inline-flex items-center gap-1 text-zinc-300 font-medium">
                      <Sparkles className="h-3 w-3 text-purple-400" />
                      <span className="capitalize">{run.trigger_type}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 text-zinc-400 font-mono text-[11px]">
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
                        onClick={() => setPendingRerunId(run.id)}
                      >
                        <RotateCcw className="h-3 w-3 mr-1" />
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

      {/* Rerun Confirmation Modal with Duplicate Warning */}
      {pendingRerunId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-400 shrink-0">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Confirm Workflow Rerun</h3>
                <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                  Rerunning this execution will re-evaluate all trigger payload inputs through the active workflow DAG.
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-amber-950/20 border border-amber-800/40 text-xs text-amber-300 space-y-1 font-medium">
              <span>⚠️ Duplicate Action Notice:</span>
              <p className="text-[11px] text-zinc-300 font-normal">
                If downstream nodes are configured with live Resend or Slack integrations, rerunning may dispatch duplicate customer emails or team notification cards.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-800">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setPendingRerunId(null)}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                disabled={isExecutingRerun}
                onClick={() => confirmAndRerun(pendingRerunId)}
                className="text-xs bg-purple-600 hover:bg-purple-500 gap-1.5"
              >
                <RotateCcw className={`h-3 w-3 ${isExecutingRerun ? 'animate-spin' : ''}`} />
                <span>{isExecutingRerun ? 'Initiating Rerun...' : 'Proceed with Rerun'}</span>
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
