'use client';

import React, { useState, useTransition } from 'react';
import Link from 'next/link';
import type { WorkflowRecord, WorkflowStatus } from '@/types/workflow';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { PageHeader } from '@/components/ui/page-header';
import { EmptyState } from '@/components/ui/empty-state';
import { Dialog, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import {
  createWorkflowAction,
  duplicateWorkflowAction,
  deleteWorkflowAction,
  toggleWorkflowStatusAction,
  renameWorkflowAction,
} from '@/lib/actions/workflows';
import { WORKFLOW_TEMPLATES } from '@/lib/workflow/templates';
import {
  Plus,
  Search,
  Copy,
  Trash2,
  Edit2,
  Power,
  ArrowRight,
  Workflow,
  Layers,
} from 'lucide-react';

interface WorkflowListProps {
  workflows: WorkflowRecord[];
  workspaceName: string;
}

export function WorkflowList({ workflows, workspaceName: _workspaceName }: WorkflowListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('lead-qualification-and-response');
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
    if (!confirm(`Are you sure you want to delete "${workflowName}"? All published versions and execution logs will be removed.`)) {
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
      {/* Page Header */}
      <PageHeader
        title="Workflows"
        description="Design, test, and publish automated DAG workflows."
      >
        <Button onClick={() => setIsCreateModalOpen(true)} size="sm">
          <Plus className="h-4 w-4" />
          <span>New workflow</span>
        </Button>
      </PageHeader>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
          <input
            type="text"
            placeholder="Search workflows..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 h-10 rounded-lg border border-zinc-200 bg-white text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 shadow-xs"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {['all', 'active', 'draft', 'inactive'].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors cursor-pointer ${
                statusFilter === status
                  ? 'bg-zinc-900 text-white'
                  : 'bg-white text-zinc-600 hover:bg-zinc-100 border border-zinc-200/80'
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
          icon={<Workflow className="h-6 w-6" />}
          title={workflows.length === 0 ? 'No workflows created yet' : 'No matching workflows'}
          description={
            workflows.length === 0
              ? 'Get started by creating your first workflow or choose an established production template.'
              : 'No workflows match your search or filter criteria.'
          }
          action={
            workflows.length === 0 ? (
              <Button onClick={() => setIsCreateModalOpen(true)} size="sm">
                Create First Workflow
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredWorkflows.map((wf) => {
            const nodeCount = wf.draft_graph?.nodes?.length || 0;
            const hasPublishedVersion = !!wf.active_version_id;

            return (
              <Card
                key={wf.id}
                className="p-5 flex flex-col justify-between hover:border-zinc-300 transition-colors group"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <Badge
                      variant={
                        wf.status === 'active'
                          ? 'success'
                          : wf.status === 'draft'
                          ? 'default'
                          : 'secondary'
                      }
                      size="sm"
                    >
                      {wf.status}
                    </Badge>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          setRenameTarget(wf);
                          setRenameName(wf.name);
                        }}
                        title="Rename"
                        className="p-1 rounded-md text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors cursor-pointer"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleDuplicate(wf.id)}
                        title="Duplicate"
                        className="p-1 rounded-md text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors cursor-pointer"
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(wf.id, wf.name)}
                        title="Delete"
                        className="p-1 rounded-md text-zinc-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  <Link href={`/workflows/${wf.id}`} className="block">
                    <h3 className="text-sm font-semibold text-zinc-900 group-hover:text-indigo-600 transition-colors line-clamp-1">
                      {wf.name}
                    </h3>
                  </Link>
                  <p className="text-xs text-zinc-500 mt-1 line-clamp-2 leading-relaxed">
                    {wf.description || 'No description provided.'}
                  </p>
                </div>

                <div className="pt-4 mt-4 border-t border-zinc-100 flex items-center justify-between text-xs text-zinc-500">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1">
                      <Layers className="h-3.5 w-3.5 text-zinc-400" />
                      <span>{nodeCount} nodes</span>
                    </span>
                    {hasPublishedVersion && (
                      <span className="text-emerald-600 font-medium">Published</span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {hasPublishedVersion && (
                      <button
                        onClick={() => handleToggleStatus(wf.id, wf.status)}
                        className={`p-1 rounded transition-colors cursor-pointer ${
                          wf.status === 'active'
                            ? 'text-emerald-600 hover:text-amber-600'
                            : 'text-zinc-400 hover:text-emerald-600'
                        }`}
                        title={wf.status === 'active' ? 'Deactivate' : 'Activate'}
                      >
                        <Power className="h-3.5 w-3.5" />
                      </button>
                    )}
                    <Link
                      href={`/workflows/${wf.id}`}
                      className="inline-flex items-center text-xs font-medium text-indigo-600 hover:text-indigo-700 gap-1"
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
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogHeader>
          <DialogTitle>Create New Workflow</DialogTitle>
          <DialogClose onClose={() => setIsCreateModalOpen(false)} />
        </DialogHeader>

        <form
          action={async (formData: FormData) => {
            await createWorkflowAction(formData);
          }}
          className="space-y-4"
        >
          <div>
            <label className="block text-xs font-medium text-zinc-700 mb-1.5">
              Workflow Name
            </label>
            <Input
              name="name"
              placeholder="e.g. Inbound Lead Qualification Pipeline"
              required
              defaultValue="Lead Qualification & Response"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-700 mb-1.5">
              Description (Optional)
            </label>
            <textarea
              name="description"
              rows={2}
              placeholder="Describe the automation objective..."
              className="w-full rounded-lg border border-zinc-200 bg-white p-2.5 text-xs text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-600"
              defaultValue="Ingests leads via webhook, performs AI qualification, creates CRM record, and dispatches automated confirmation."
            />
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-medium text-zinc-700">
              Select Starting Template
            </label>
            <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
              {WORKFLOW_TEMPLATES.map((tmpl) => (
                <label
                  key={tmpl.id}
                  className={`block p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedTemplateId === tmpl.id
                      ? 'border-indigo-600 bg-indigo-50/50'
                      : 'border-zinc-200 bg-white hover:border-zinc-300'
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
                        className="text-indigo-600 focus:ring-indigo-600"
                      />
                      <span className="text-xs font-semibold text-zinc-900">{tmpl.name}</span>
                    </div>
                    <Badge variant="secondary" size="sm">
                      {tmpl.category}
                    </Badge>
                  </div>
                  <p className="text-[11px] text-zinc-500 mt-1 pl-5 leading-relaxed">
                    {tmpl.description}
                  </p>
                </label>
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsCreateModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" size="sm">
              Create Workflow
            </Button>
          </DialogFooter>
        </form>
      </Dialog>

      {/* Rename Workflow Modal */}
      <Dialog open={!!renameTarget} onOpenChange={(open) => !open && setRenameTarget(null)}>
        <DialogHeader>
          <DialogTitle>Rename Workflow</DialogTitle>
          <DialogClose onClose={() => setRenameTarget(null)} />
        </DialogHeader>

        <form onSubmit={handleSaveRename} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-zinc-700 mb-1.5">New Name</label>
            <Input
              value={renameName}
              onChange={(e) => setRenameName(e.target.value)}
              required
              autoFocus
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setRenameTarget(null)}
            >
              Cancel
            </Button>
            <Button type="submit" size="sm" isLoading={isPending}>
              Save Name
            </Button>
          </DialogFooter>
        </form>
      </Dialog>
    </div>
  );
}
