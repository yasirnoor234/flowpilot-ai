'use client';

import React, { useState, useTransition } from 'react';
import Link from 'next/link';
import type { WorkflowRecord, WorkflowStatus } from '@/types/workflow';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { EmptyState } from '@/components/ui/empty-state';
import {
  createWorkflowAction,
  duplicateWorkflowAction,
  deleteWorkflowAction,
  toggleWorkflowStatusAction,
  renameWorkflowAction,
} from '@/lib/actions/workflows';
import { WORKFLOW_TEMPLATES } from '@/lib/workflow/templates';
import {
  GitFork,
  Plus,
  Search,
  Copy,
  Trash2,
  Edit2,
  Power,
  Sparkles,
  ArrowRight,
  Workflow,
  Layers,
} from 'lucide-react';

interface WorkflowListProps {
  workflows: WorkflowRecord[];
  workspaceName: string;
}

export function WorkflowList({ workflows, workspaceName }: WorkflowListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('primary-mvp-lead-pipeline');
  const [renameTarget, setRenameTarget] = useState<WorkflowRecord | null>(null);
  const [renameName, setRenameName] = useState('');
  const [isPending, startTransition] = useTransition();

  const filteredWorkflows = workflows.filter((wf) => {
    const matchesSearch =
      wf.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (wf.description && wf.description.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus = statusFilter === 'all' || wf.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleDuplicate = (workflowId: string) => {
    startTransition(async () => {
      await duplicateWorkflowAction(workflowId);
    });
  };

  const handleDelete = (workflowId: string, workflowName: string) => {
    if (!confirm(`Are you sure you want to delete "${workflowName}"? All published versions and runs will be removed.`)) {
      return;
    }
    startTransition(async () => {
      await deleteWorkflowAction(workflowId);
    });
  };

  const handleToggleStatus = (workflowId: string, currentStatus: WorkflowStatus) => {
    const nextStatus: WorkflowStatus = currentStatus === 'active' ? 'inactive' : 'active';
    startTransition(async () => {
      const result = await toggleWorkflowStatusAction(workflowId, nextStatus);
      if (result?.error) {
        alert(result.error);
      }
    });
  };

  const handleSaveRename = (e: React.FormEvent) => {
    e.preventDefault();
    if (!renameTarget || !renameName.trim()) return;

    startTransition(async () => {
      const result = await renameWorkflowAction(renameTarget.id, renameName);
      if (result?.error) {
        alert(result.error);
      } else {
        setRenameTarget(null);
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Workflows</h2>
          <p className="text-xs text-zinc-400">
            Design, validate, and manage DAG automation pipelines for {workspaceName}.
          </p>
        </div>

        <Button onClick={() => setIsCreateModalOpen(true)} size="sm">
          <Plus className="mr-1.5 h-4 w-4" />
          <span>New Workflow</span>
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-500" />
          <input
            type="text"
            placeholder="Search workflows..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-zinc-800 bg-zinc-900/70 text-xs text-zinc-200 placeholder:text-zinc-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto">
          {['all', 'active', 'draft', 'inactive'].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1 rounded-lg text-xs capitalize transition-colors ${
                statusFilter === status
                  ? 'bg-indigo-600/20 text-indigo-300 font-medium border border-indigo-500/30'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Workflows Grid / List */}
      {filteredWorkflows.length === 0 ? (
        <EmptyState
          icon={Workflow}
          title={workflows.length === 0 ? 'No workflows created yet' : 'No matching workflows'}
          description={
            workflows.length === 0
              ? 'Get started by creating your first workflow or launch with the pre-built Primary MVP Lead Pipeline template.'
              : 'No workflows match your search or filter criteria.'
          }
          actionLabel={workflows.length === 0 ? 'Create First Workflow' : undefined}
          onAction={() => setIsCreateModalOpen(true)}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredWorkflows.map((wf) => {
            const nodeCount = wf.draft_graph?.nodes?.length || 0;
            const hasPublishedVersion = !!wf.active_version_id;

            return (
              <Card
                key={wf.id}
                className="border-zinc-800 bg-zinc-900/60 hover:border-zinc-700 transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
                        <GitFork className="h-4 w-4" />
                      </div>
                      <Badge
                        variant={
                          wf.status === 'active'
                            ? 'success'
                            : wf.status === 'draft'
                            ? 'default'
                            : 'secondary'
                        }
                        className="text-[10px] capitalize"
                      >
                        {wf.status}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          setRenameTarget(wf);
                          setRenameName(wf.name);
                        }}
                        title="Rename"
                        className="p-1 rounded text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleDuplicate(wf.id)}
                        title="Duplicate"
                        className="p-1 rounded text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800"
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(wf.id, wf.name)}
                        title="Delete"
                        className="p-1 rounded text-zinc-500 hover:text-red-400 hover:bg-red-500/10"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  <Link href={`/workflows/${wf.id}`} className="block group-hover:text-indigo-300 transition-colors">
                    <h3 className="text-sm font-semibold text-white group-hover:text-indigo-300 line-clamp-1">
                      {wf.name}
                    </h3>
                  </Link>
                  <p className="text-xs text-zinc-400 mt-1 line-clamp-2 leading-relaxed">
                    {wf.description || 'No description provided.'}
                  </p>
                </div>

                <div className="pt-4 mt-4 border-t border-zinc-800/60 flex items-center justify-between text-[11px] text-zinc-500">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1">
                      <Layers className="h-3 w-3" />
                      <span>{nodeCount} nodes</span>
                    </span>
                    {hasPublishedVersion && (
                      <span className="text-emerald-400 font-medium">Published</span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {hasPublishedVersion && (
                      <button
                        onClick={() => handleToggleStatus(wf.id, wf.status)}
                        className={`p-1 rounded transition-colors ${
                          wf.status === 'active'
                            ? 'text-emerald-400 hover:text-amber-400'
                            : 'text-zinc-400 hover:text-emerald-400'
                        }`}
                        title={wf.status === 'active' ? 'Deactivate' : 'Activate'}
                      >
                        <Power className="h-3.5 w-3.5" />
                      </button>
                    )}
                    <Link
                      href={`/workflows/${wf.id}`}
                      className="inline-flex items-center text-xs font-medium text-indigo-400 hover:text-indigo-300 gap-1"
                    >
                      <span>Open</span>
                      <ArrowRight className="h-3 w-3" />
                    </Link>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create Workflow Dialog Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-xl rounded-2xl border border-zinc-800 bg-zinc-900 p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-indigo-400" />
                <span>Create New Workflow</span>
              </h3>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-xs text-zinc-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form
              action={async (formData: FormData) => {
                await createWorkflowAction(formData);
              }}
              className="space-y-4 pt-4"
            >
              <Input
                name="name"
                label="Workflow Name"
                placeholder="e.g. Lead Ingest & AI Qualification Flow"
                required
                defaultValue="Autonomous Lead Pipeline"
              />

              <div className="space-y-1">
                <label className="block text-xs font-medium uppercase tracking-wider text-zinc-400">
                  Description (Optional)
                </label>
                <textarea
                  name="description"
                  rows={2}
                  placeholder="Describe the automation objective..."
                  className="w-full rounded-lg border border-zinc-800 bg-zinc-900/70 p-2.5 text-xs text-zinc-100 placeholder:text-zinc-500 focus:border-indigo-500 focus:outline-none"
                  defaultValue="Ingests leads via webhook, performs AI qualification, creates CRM record, and dispatches automated confirmation."
                />
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-medium uppercase tracking-wider text-zinc-400">
                  Select Starting Template
                </label>
                <div className="space-y-2">
                  {WORKFLOW_TEMPLATES.map((tmpl) => (
                    <label
                      key={tmpl.id}
                      className={`block p-3 rounded-xl border cursor-pointer transition-all ${
                        selectedTemplateId === tmpl.id
                          ? 'border-indigo-500 bg-indigo-500/10'
                          : 'border-zinc-800 bg-zinc-950/40 hover:border-zinc-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <input
                            type="radio"
                            name="templateId"
                            value={tmpl.id}
                            checked={selectedTemplateId === tmpl.id}
                            onChange={() => setSelectedTemplateId(tmpl.id)}
                            className="text-indigo-600 focus:ring-indigo-500"
                          />
                          <span className="text-xs font-semibold text-white">{tmpl.name}</span>
                        </div>
                        <Badge variant="default" className="text-[9px] py-0">
                          {tmpl.category}
                        </Badge>
                      </div>
                      <p className="text-[11px] text-zinc-400 mt-1 pl-5 leading-relaxed">
                        {tmpl.description}
                      </p>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-800">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsCreateModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" size="sm">
                  Create & Launch Editor
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Rename Workflow Modal */}
      {renameTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-900 p-6 shadow-2xl">
            <h3 className="text-base font-bold text-white mb-4">Rename Workflow</h3>
            <form onSubmit={handleSaveRename} className="space-y-4">
              <Input
                value={renameName}
                onChange={(e) => setRenameName(e.target.value)}
                label="New Name"
                required
                autoFocus
              />
              <div className="flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setRenameTarget(null)}
                >
                  Cancel
                </Button>
                <Button type="submit" size="sm" isLoading={isPending}>
                  Save Name
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
