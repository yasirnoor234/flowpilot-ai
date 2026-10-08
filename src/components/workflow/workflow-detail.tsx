'use client';

import React, { useState, useTransition, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { WorkflowRecord, WorkflowVersionRecord, WorkflowGraph, WorkflowStatus } from '@/types/workflow';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Dialog, DialogHeader, DialogTitle, DialogFooter, DialogClose, DialogDescription } from '@/components/ui/dialog';
import { WorkflowCanvas } from './canvas/workflow-canvas';
import { WorkflowMobileView } from './canvas/workflow-mobile-view';
import { WorkflowValidatorPanel } from './workflow-validator-panel';
import { VersionHistory } from './version-history';
import { validateWorkflowForPublishing } from '@/lib/workflow/validator';
import { WORKFLOW_TEMPLATES } from '@/lib/workflow/templates';
import {
  saveDraftGraphAction,
  publishWorkflowVersionAction,
  toggleWorkflowStatusAction,
  renameWorkflowAction,
} from '@/lib/actions/workflows';
import { triggerManualRunAction } from '@/lib/actions/execution';
import {
  Save,
  Rocket,
  Power,
  History,
  ShieldCheck,
  ArrowLeft,
  FileJson,
  Play,
  LayoutGrid,
} from 'lucide-react';

interface WorkflowDetailProps {
  workflow: WorkflowRecord;
  versions: WorkflowVersionRecord[];
  workspaceName: string;
}

export function WorkflowDetail({
  workflow,
  versions,
  workspaceName: _workspaceName,
}: WorkflowDetailProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'canvas' | 'json' | 'validator' | 'history'>('canvas');
  const [draftGraph, setDraftGraph] = useState<WorkflowGraph>(workflow.draft_graph);
  const [rawJsonText, setRawJsonText] = useState(JSON.stringify(workflow.draft_graph, null, 2));
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [isEditingMetadata, setIsEditingMetadata] = useState(false);
  const [name, setName] = useState(workflow.name);
  const [description, setDescription] = useState(workflow.description || '');
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
  const [isTestRunModalOpen, setIsTestRunModalOpen] = useState(false);
  const [changeSummary, setChangeSummary] = useState('');
  const [publishError, setPublishError] = useState<string | null>(null);
  const [testRunError, setTestRunError] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const defaultSamplePayload = useMemo(() => {
    const triggerNode = workflow.draft_graph?.nodes?.find(
      (n) => n.type === 'trigger_manual' || n.type === 'trigger_webhook'
    );
    return JSON.stringify(
      triggerNode?.config?.sample_payload || {
        email: 'lead@enterprise.com',
        name: 'Jordan Miller',
        company: 'Enterprise AI Corp',
        budget: '$25,000',
        message: 'Need an immediate enterprise AI solution.',
      },
      null,
      2
    );
  }, [workflow.draft_graph]);

  const [testPayloadText, setTestPayloadText] = useState(defaultSamplePayload);

  // Run live validation on current draft graph in state
  const validationResult = useMemo(() => {
    return validateWorkflowForPublishing(draftGraph);
  }, [draftGraph]);

  const handleJsonChange = (text: string) => {
    setRawJsonText(text);
    try {
      const parsed = JSON.parse(text);
      if (parsed && typeof parsed === 'object' && Array.isArray(parsed.nodes) && Array.isArray(parsed.edges)) {
        setDraftGraph(parsed);
        setJsonError(null);
      } else {
        setJsonError('JSON must contain "nodes" and "edges" arrays.');
      }
    } catch (e: unknown) {
      setJsonError(e instanceof Error ? e.message : 'Invalid JSON format.');
    }
  };

  const handleLoadTemplate = (templateId: string) => {
    const tmpl = WORKFLOW_TEMPLATES.find((t) => t.id === templateId);
    if (!tmpl) return;

    if (confirm(`Load "${tmpl.name}"? This will replace your current draft canvas.`)) {
      setDraftGraph(tmpl.graph);
      setRawJsonText(JSON.stringify(tmpl.graph, null, 2));
      setJsonError(null);
    }
  };

  const handleSaveDraft = () => {
    startTransition(async () => {
      setSaveMessage(null);
      const result = await saveDraftGraphAction(workflow.id, draftGraph);
      if (result.error) {
        alert(result.error);
      } else {
        setSaveMessage('Draft saved');
        setTimeout(() => setSaveMessage(null), 3000);
      }
    });
  };

  const handlePublish = (e: React.FormEvent) => {
    e.preventDefault();
    setPublishError(null);

    startTransition(async () => {
      const result = await publishWorkflowVersionAction(workflow.id, changeSummary);
      if (result.error) {
        setPublishError(result.error);
      } else {
        setIsPublishModalOpen(false);
        setChangeSummary('');
        setActiveTab('history');
      }
    });
  };

  const handleTestRun = (e: React.FormEvent) => {
    e.preventDefault();
    setTestRunError(null);

    let parsedPayload: Record<string, any> = {};
    try {
      parsedPayload = JSON.parse(testPayloadText);
    } catch {
      setTestRunError('Invalid JSON in payload.');
      return;
    }

    startTransition(async () => {
      const result = await triggerManualRunAction(workflow.id, parsedPayload);
      if (result.error) {
        setTestRunError(result.error);
      } else if (result.runId) {
        setIsTestRunModalOpen(false);
        router.push(`/runs/${result.runId}`);
      }
    });
  };

  const handleToggleStatus = () => {
    const nextStatus: WorkflowStatus = workflow.status === 'active' ? 'inactive' : 'active';
    startTransition(async () => {
      const result = await toggleWorkflowStatusAction(workflow.id, nextStatus);
      if (result?.error) {
        alert(result.error);
      }
    });
  };

  const handleSaveMetadata = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const result = await renameWorkflowAction(workflow.id, name, description);
      if (result.error) {
        alert(result.error);
      } else {
        setIsEditingMetadata(false);
      }
    });
  };

  const handleSaveCanvasGraph = async (newGraph: WorkflowGraph) => {
    setDraftGraph(newGraph);
    setRawJsonText(JSON.stringify(newGraph, null, 2));
    const result = await saveDraftGraphAction(workflow.id, newGraph);
    if (result.error) {
      alert(result.error);
      return { error: result.error };
    } else {
      setSaveMessage('Draft saved');
      setTimeout(() => setSaveMessage(null), 3000);
      return { success: true };
    }
  };

  return (
    <div className="space-y-6">
      {/* Back to Workflows Breadcrumb */}
      <div className="flex items-center justify-between">
        <Link
          href="/workflows"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-500 hover:text-zinc-900 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Workflows</span>
        </Link>

        {saveMessage && (
          <span className="text-xs text-emerald-600 font-medium">
            ✓ {saveMessage}
          </span>
        )}
      </div>

      {/* Workflow Title & Control Actions Card */}
      <Card className="p-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1 min-w-0">
            {isEditingMetadata ? (
              <form onSubmit={handleSaveMetadata} className="space-y-3 max-w-lg">
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Workflow Name"
                  required
                />
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Workflow description..."
                  rows={2}
                  className="w-full rounded-lg border border-zinc-200 bg-white p-2.5 text-xs text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                />
                <div className="flex items-center gap-2">
                  <Button type="submit" size="sm" isLoading={isPending}>
                    Save Details
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditingMetadata(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            ) : (
              <div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h2 className="text-xl font-bold text-zinc-900 tracking-tight">{workflow.name}</h2>
                  <Badge
                    variant={
                      workflow.status === 'active'
                        ? 'success'
                        : workflow.status === 'draft'
                        ? 'default'
                        : 'secondary'
                    }
                    size="sm"
                  >
                    {workflow.status}
                  </Badge>
                  {workflow.active_version_id && (
                    <Badge variant="primary" size="sm">
                      Published
                    </Badge>
                  )}
                  <button
                    onClick={() => setIsEditingMetadata(true)}
                    className="text-xs text-zinc-500 hover:text-zinc-900 underline ml-1 cursor-pointer"
                  >
                    Edit details
                  </button>
                </div>
                <p className="text-xs text-zinc-500 mt-1 max-w-2xl leading-relaxed">
                  {workflow.description || 'No description provided.'}
                </p>
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <Button variant="outline" size="sm" onClick={handleSaveDraft} isLoading={isPending}>
              <Save className="h-3.5 w-3.5" />
              <span>Save Draft</span>
            </Button>

            <Button
              size="sm"
              onClick={() => setIsPublishModalOpen(true)}
              disabled={!validationResult.isValid}
            >
              <Rocket className="h-3.5 w-3.5" />
              <span>Publish Version</span>
            </Button>

            {workflow.active_version_id && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsTestRunModalOpen(true)}
                >
                  <Play className="h-3.5 w-3.5 fill-current" />
                  <span>Test Run</span>
                </Button>

                <Button
                  variant={workflow.status === 'active' ? 'outline' : 'secondary'}
                  size="sm"
                  onClick={handleToggleStatus}
                  isLoading={isPending}
                >
                  <Power className="h-3.5 w-3.5" />
                  <span>{workflow.status === 'active' ? 'Deactivate' : 'Activate'}</span>
                </Button>
              </>
            )}
          </div>
        </div>
      </Card>

      {/* Tabs Navigation */}
      <div className="flex items-center justify-between border-b border-zinc-200">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setActiveTab('canvas')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-medium border-b-2 transition-colors cursor-pointer ${
              activeTab === 'canvas'
                ? 'border-indigo-600 text-indigo-700 font-semibold'
                : 'border-transparent text-zinc-500 hover:text-zinc-900'
            }`}
          >
            <LayoutGrid className="h-4 w-4" />
            <span>Visual Builder</span>
          </button>

          <button
            onClick={() => setActiveTab('json')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-medium border-b-2 transition-colors cursor-pointer ${
              activeTab === 'json'
                ? 'border-indigo-600 text-indigo-700 font-semibold'
                : 'border-transparent text-zinc-500 hover:text-zinc-900'
            }`}
          >
            <FileJson className="h-4 w-4" />
            <span>Graph JSON ({draftGraph.nodes.length} Nodes)</span>
          </button>

          <button
            onClick={() => setActiveTab('validator')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-medium border-b-2 transition-colors cursor-pointer ${
              activeTab === 'validator'
                ? 'border-indigo-600 text-indigo-700 font-semibold'
                : 'border-transparent text-zinc-500 hover:text-zinc-900'
            }`}
          >
            <ShieldCheck className="h-4 w-4" />
            <span>Validation Rules</span>
            <span
              className={`h-2 w-2 rounded-full ${
                validationResult.isValid ? 'bg-emerald-500' : 'bg-red-500'
              }`}
            />
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-medium border-b-2 transition-colors cursor-pointer ${
              activeTab === 'history'
                ? 'border-indigo-600 text-indigo-700 font-semibold'
                : 'border-transparent text-zinc-500 hover:text-zinc-900'
            }`}
          >
            <History className="h-4 w-4" />
            <span>Versions ({versions.length})</span>
          </button>
        </div>

        {/* Template Shortcut Dropdown */}
        <div className="flex items-center gap-2 pb-2">
          <span className="text-[11px] text-zinc-500 hidden sm:inline">Load Template:</span>
          <select
            onChange={(e) => {
              if (e.target.value) {
                handleLoadTemplate(e.target.value);
                e.target.value = '';
              }
            }}
            defaultValue=""
            className="rounded-lg border border-zinc-200 bg-white px-2.5 py-1 text-xs text-zinc-700 focus:outline-none focus:ring-1 focus:ring-indigo-600"
          >
            <option value="" disabled>
              Select Template...
            </option>
            {WORKFLOW_TEMPLATES.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Tab 1: Visual Drag-and-Drop Builder */}
      {activeTab === 'canvas' && (
        <div>
          <div className="hidden md:block">
            <WorkflowCanvas
              initialGraph={draftGraph}
              workflowId={workflow.id}
              isPublished={!!workflow.active_version_id}
              onSaveGraph={handleSaveCanvasGraph}
              onOpenPublishModal={() => setIsPublishModalOpen(true)}
              onOpenTestRunModal={() => setIsTestRunModalOpen(true)}
              isSaving={isPending}
            />
          </div>
          <div className="block md:hidden">
            <WorkflowMobileView graph={draftGraph} />
          </div>
        </div>
      )}

      {/* Tab 2: Draft Graph & Nodes JSON Inspector */}
      {activeTab === 'json' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 space-y-3">
              <div className="text-xs font-semibold text-zinc-500 uppercase tracking-wider px-1">
                Workflow Nodes ({draftGraph.nodes.length})
              </div>

              <div className="space-y-2 max-h-[500px] overflow-y-auto">
                {draftGraph.nodes.map((node, idx) => (
                  <Card key={node.id} className="p-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold text-zinc-900">
                        {idx + 1}. {node.title}
                      </span>
                      <Badge variant="secondary" size="sm">{node.type}</Badge>
                    </div>
                    <div className="text-[11px] font-mono text-zinc-500 truncate">
                      ID: {node.id}
                    </div>
                  </Card>
                ))}
              </div>
            </div>

            <div className="lg:col-span-2 space-y-3">
              <div className="flex items-center justify-between px-1">
                <div className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                  Raw Graph JSON
                </div>
                {jsonError && (
                  <span className="text-xs text-red-600 font-medium">{jsonError}</span>
                )}
              </div>

              <textarea
                value={rawJsonText}
                onChange={(e) => handleJsonChange(e.target.value)}
                rows={20}
                className="w-full rounded-xl bg-zinc-900 text-emerald-400 font-mono text-xs p-4 focus:outline-none focus:ring-2 focus:ring-indigo-600"
              />
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Validator */}
      {activeTab === 'validator' && (
        <WorkflowValidatorPanel
          validationResult={validationResult}
          onOpenPublishModal={() => setIsPublishModalOpen(true)}
        />
      )}

      {/* Tab 4: Version History */}
      {activeTab === 'history' && (
        <VersionHistory
          versions={versions}
          activeVersionId={workflow.active_version_id}
          workflowId={workflow.id}
        />
      )}

      {/* Publish Version Dialog Modal */}
      <Dialog open={isPublishModalOpen} onOpenChange={setIsPublishModalOpen}>
        <DialogHeader>
          <DialogTitle>Publish Workflow Version</DialogTitle>
          <DialogDescription>
            Creates an immutable version snapshot. Running and scheduled executions will reference this version.
          </DialogDescription>
          <DialogClose onClose={() => setIsPublishModalOpen(false)} />
        </DialogHeader>

        <form onSubmit={handlePublish} className="space-y-4">
          {publishError && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700">
              {publishError}
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-zinc-700 mb-1.5">
              Change Summary (Optional)
            </label>
            <textarea
              value={changeSummary}
              onChange={(e) => setChangeSummary(e.target.value)}
              placeholder="e.g. Added 24-hr follow-up timer with CRM status re-reading"
              rows={3}
              className="w-full rounded-lg border border-zinc-200 bg-white p-2.5 text-xs text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-600"
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsPublishModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" size="sm" isLoading={isPending}>
              Publish Version
            </Button>
          </DialogFooter>
        </form>
      </Dialog>

      {/* Test Run Dialog Modal */}
      <Dialog open={isTestRunModalOpen} onOpenChange={setIsTestRunModalOpen}>
        <DialogHeader>
          <DialogTitle>Execute Test Run</DialogTitle>
          <DialogDescription>
            Dispatch a test event against the active published workflow version.
          </DialogDescription>
          <DialogClose onClose={() => setIsTestRunModalOpen(false)} />
        </DialogHeader>

        <form onSubmit={handleTestRun} className="space-y-4">
          {testRunError && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700">
              {testRunError}
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-zinc-700 mb-1.5">
              Sample Trigger Payload (JSON)
            </label>
            <textarea
              value={testPayloadText}
              onChange={(e) => setTestPayloadText(e.target.value)}
              rows={8}
              className="w-full rounded-lg bg-zinc-900 text-emerald-400 font-mono text-xs p-3 focus:outline-none focus:ring-2 focus:ring-indigo-600"
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsTestRunModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" size="sm" isLoading={isPending}>
              Dispatch Run
            </Button>
          </DialogFooter>
        </form>
      </Dialog>
    </div>
  );
}
