'use client';

import React, { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { WorkflowRunRecord, WorkflowRunStatus } from '@/types/execution';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { PageHeader } from '@/components/ui/page-header';
import { EmptyState } from '@/components/ui/empty-state';
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import {
  Activity,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Clock,
  Ban,
  Search,
  AlertTriangle,
} from 'lucide-react';
import { rerunWorkflowAction } from '@/lib/actions/execution';

interface RunListProps {
  runs: (WorkflowRunRecord & {
    workflow?: { id: string; name: string };
  })[];
  workspaceId: string;
}

export function RunList({ runs, workspaceId: _workspaceId }: RunListProps) {
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
          <Badge variant="success" size="sm">
            <CheckCircle2 className="h-3 w-3" />
            <span>Succeeded</span>
          </Badge>
        );
      case 'failed':
        return (
          <Badge variant="destructive" size="sm">
            <XCircle className="h-3 w-3" />
            <span>Failed</span>
          </Badge>
        );
      case 'running':
        return (
          <Badge variant="primary" size="sm">
            <Activity className="h-3 w-3 animate-spin" />
            <span>Running</span>
          </Badge>
        );
      case 'waiting':
        return (
          <Badge variant="warning" size="sm">
            <Clock className="h-3 w-3" />
            <span>Waiting</span>
          </Badge>
        );
      case 'canceled':
        return (
          <Badge variant="muted" size="sm">
            <Ban className="h-3 w-3" />
            <span>Canceled</span>
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary" size="sm">
            <span>{status}</span>
          </Badge>
        );
    }
  };

  const calculateDuration = (run: WorkflowRunRecord) => {
    if (!run.started_at) return '—';
    const start = new Date(run.started_at).getTime();
    const end = run.finished_at ? new Date(run.finished_at).getTime() : Date.now();
    const diffMs = Math.max(0, end - start);
    if (diffMs < 1000) return `${diffMs}ms`;
    if (diffMs < 60000) return `${(diffMs / 1000).toFixed(1)}s`;
    return `${Math.floor(diffMs / 60000)}m ${Math.floor((diffMs % 60000) / 1000)}s`;
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Runs"
        description="Inspect durable workflow runs, execution duration, and step logs."
      />

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
          <input
            type="text"
            placeholder="Search by workflow name or run ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 h-10 rounded-lg border border-zinc-200 bg-white text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 shadow-xs"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="h-9 rounded-lg border border-zinc-200 bg-white px-3 text-xs font-medium text-zinc-700 focus:outline-none focus:ring-1 focus:ring-indigo-600 shadow-xs"
          >
            <option value="all">All Statuses</option>
            <option value="succeeded">Succeeded</option>
            <option value="failed">Failed</option>
            <option value="waiting">Waiting (Delay)</option>
            <option value="running">Running</option>
            <option value="canceled">Canceled</option>
          </select>

          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="h-9 rounded-lg border border-zinc-200 bg-white px-3 text-xs font-medium text-zinc-700 focus:outline-none focus:ring-1 focus:ring-indigo-600 shadow-xs"
          >
            <option value="all">All Dates</option>
            <option value="today">Today</option>
            <option value="7days">Last 7 Days</option>
          </select>
        </div>
      </div>

      {/* Runs Table */}
      {filteredRuns.length === 0 ? (
        <EmptyState
          icon={<Activity className="h-6 w-6" />}
          title={runs.length === 0 ? 'No workflow runs recorded' : 'No matching runs'}
          description={
            runs.length === 0
              ? 'Trigger a test run from the workflow builder or submit a webhook to see execution logs.'
              : 'Try clearing your status or search filters.'
          }
        />
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-zinc-50 border-b border-zinc-200/80 text-zinc-500 font-medium">
                <tr>
                  <th className="py-3 px-6">Workflow</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Trigger Type</th>
                  <th className="py-3 px-4">Started</th>
                  <th className="py-3 px-4">Duration</th>
                  <th className="py-3 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {filteredRuns.map((run) => (
                  <tr key={run.id} className="hover:bg-zinc-50/60 transition-colors">
                    <td className="py-3.5 px-6">
                      <Link
                        href={`/runs/${run.id}`}
                        className="font-semibold text-zinc-900 hover:text-indigo-600 transition-colors"
                      >
                        {run.workflow?.name || 'Untitled Workflow'}
                      </Link>
                      <div className="text-[11px] font-mono text-zinc-400">
                        {run.id.slice(0, 8)}...{run.id.slice(-4)}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">{getStatusBadge(run.status)}</td>
                    <td className="py-3.5 px-4 font-mono text-zinc-600 uppercase text-[11px]">
                      {run.trigger_type}
                    </td>
                    <td className="py-3.5 px-4 text-zinc-500 whitespace-nowrap">
                      {new Date(run.created_at).toLocaleDateString([], {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="py-3.5 px-4 text-zinc-600 font-mono text-[11px] tabular-nums">
                      {calculateDuration(run)}
                    </td>
                    <td className="py-3.5 px-6 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setPendingRerunId(run.id)}
                          className="h-7 px-2 text-xs"
                          title="Rerun Workflow"
                        >
                          <RotateCcw className="h-3.5 w-3.5" />
                        </Button>
                        <Link href={`/runs/${run.id}`}>
                          <Button variant="outline" size="sm" className="h-7 px-2.5 text-xs">
                            Inspect
                          </Button>
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Rerun Confirmation Dialog Modal */}
      <Dialog open={!!pendingRerunId} onOpenChange={(open) => !open && setPendingRerunId(null)}>
        <DialogHeader>
          <DialogTitle>Confirm Workflow Rerun</DialogTitle>
          <DialogDescription>
            Rerunning this workflow will execute all pipeline steps again with the original trigger payload.
          </DialogDescription>
          <DialogClose onClose={() => setPendingRerunId(null)} />
        </DialogHeader>

        <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-800 flex items-start gap-2">
          <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
          <p>
            <strong>Duplicate Action Warning:</strong> If this workflow sends external emails or Slack notifications, those actions will execute again for this run.
          </p>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setPendingRerunId(null)}
          >
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={() => pendingRerunId && confirmAndRerun(pendingRerunId)}
            isLoading={isExecutingRerun || isPending}
          >
            Confirm & Rerun
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
  );
}
