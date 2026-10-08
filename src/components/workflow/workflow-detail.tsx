import React, { useState, useTransition, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { WorkflowRecord, WorkflowVersionRecord, WorkflowGraph, WorkflowStatus } from '@/types/workflow';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
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
  Layers,
  History,
  ShieldCheck,
  ArrowLeft,
  CheckCircle2,
  FileJson,
  Play,
  Activity,
  Sparkles,
} from 'lucide-react';

interface WorkflowDetailProps {
  workflow: WorkflowRecord;
  versions: WorkflowVersionRecord[];
  workspaceName: string;
}

export function WorkflowDetail({
  workflow,
  versions,
  workspaceName,
}: WorkflowDetailProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'editor' | 'validator' | 'history'>('editor');
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
        first_name: 'Jordan',
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
        setSaveMessage('Draft graph saved successfully!');
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

  return (
    <div className="space-y-6">
      {/* Back to Workflows Breadcrumb & Header */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <Link
            href="/workflows"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-400 hover:text-zinc-200 transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to Workflows</span>
          </Link>
          <span className="text-zinc-600 text-xs">/</span>
          <span className="text-xs text-zinc-400">{workspaceName}</span>
        </div>

        {/* Workflow Title & Control Actions */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-5 rounded-2xl border border-zinc-800 bg-zinc-900/60 backdrop-blur-xl">
          <div className="space-y-1">
            {isEditingMetadata ? (
              <form onSubmit={handleSaveMetadata} className="space-y-2 max-w-lg">
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  label="Workflow Title"
                  required
                />
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Workflow description..."
                  rows={2}
                  className="w-full rounded-lg border border-zinc-800 bg-zinc-950 p-2 text-xs text-zinc-200 focus:border-indigo-500 focus:outline-none"
                />
                <div className="flex items-center gap-2">
                  <Button type="submit" size="sm" isLoading={isPending}>
                    Save Details
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsEditingMetadata(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            ) : (
              <div>
                <div className="flex items-center gap-3">
                  <h2 className="text-xl font-bold text-white tracking-tight">{workflow.name}</h2>
                  <Badge
                    variant={
                      workflow.status === 'active'
                        ? 'success'
                        : workflow.status === 'draft'
                        ? 'default'
                        : 'secondary'
                    }
                    className="capitalize text-[10px]"
                  >
                    {workflow.status}
                  </Badge>
                  {workflow.active_version_id && (
                    <Badge variant="outline" className="text-[10px]">
                      Live Version Snapshot Active
                    </Badge>
                  )}
                  <button
                    onClick={() => setIsEditingMetadata(true)}
                    className="text-xs text-zinc-500 hover:text-zinc-300 underline"
                  >
                    Edit details
                  </button>
                </div>
                <p className="text-xs text-zinc-400 mt-1 max-w-2xl">
                  {workflow.description || 'No description provided.'}
                </p>
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {saveMessage && (
              <span className="text-xs text-emerald-400 font-medium animate-pulse">
                {saveMessage}
              </span>
            )}

            <Button variant="secondary" size="sm" onClick={handleSaveDraft} isLoading={isPending}>
              <Save className="mr-1.5 h-3.5 w-3.5" />
              <span>Save Draft</span>
            </Button>

            <Button
              size="sm"
              onClick={() => setIsPublishModalOpen(true)}
              disabled={!validationResult.isValid}
            >
              <Rocket className="mr-1.5 h-3.5 w-3.5" />
              <span>Publish Version</span>
            </Button>

            {workflow.active_version_id && (
              <>
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => setIsTestRunModalOpen(true)}
                  className="bg-purple-600 hover:bg-purple-500 text-white"
                >
                  <Play className="mr-1.5 h-3.5 w-3.5 fill-current" />
                  <span>Test Run</span>
                </Button>

                <Button
                  variant={workflow.status === 'active' ? 'outline' : 'secondary'}
                  size="sm"
                  onClick={handleToggleStatus}
                  isLoading={isPending}
                >
                  <Power className="mr-1.5 h-3.5 w-3.5" />
                  <span>{workflow.status === 'active' ? 'Deactivate' : 'Activate'}</span>
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center justify-between border-b border-zinc-800">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setActiveTab('editor')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-medium border-b-2 transition-colors ${
              activeTab === 'editor'
                ? 'border-indigo-500 text-indigo-400 font-semibold'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Layers className="h-4 w-4" />
            <span>Draft DAG Graph ({draftGraph.nodes.length} Nodes)</span>
          </button>

          <button
            onClick={() => setActiveTab('validator')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-medium border-b-2 transition-colors ${
              activeTab === 'validator'
                ? 'border-indigo-500 text-indigo-400 font-semibold'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <ShieldCheck className="h-4 w-4" />
            <span>Publication Rules</span>
            <span
              className={`h-2 w-2 rounded-full ${
                validationResult.isValid ? 'bg-emerald-400' : 'bg-red-400'
              }`}
            />
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-medium border-b-2 transition-colors ${
              activeTab === 'history'
                ? 'border-indigo-500 text-indigo-400 font-semibold'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <History className="h-4 w-4" />
            <span>Version History ({versions.length})</span>
          </button>
        </div>

        {/* Template Shortcut Dropdown */}
        {activeTab === 'editor' && (
          <div className="flex items-center gap-2 pb-2">
            <span className="text-[11px] text-zinc-500 hidden sm:inline">Load Preset:</span>
            <select
              onChange={(e) => {
                if (e.target.value) {
                  handleLoadTemplate(e.target.value);
                  e.target.value = '';
                }
              }}
              defaultValue=""
              className="rounded-lg border border-zinc-800 bg-zinc-900 px-2.5 py-1 text-xs text-zinc-300 focus:outline-none focus:border-indigo-500"
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
        )}
      </div>

      {/* Tab 1: Draft Graph & Nodes Inspector */}
      {activeTab === 'editor' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: Interactive Node Steps Explorer */}
            <div className="lg:col-span-1 space-y-3">
              <div className="text-xs font-semibold text-zinc-400 uppercase tracking-wider px-1">
                Workflow Nodes ({draftGraph.nodes.length})
              </div>

              <div className="space-y-2 max-h-[500px] overflow-y-auto">
                {draftGraph.nodes.map((node, idx) => {
                  const outgoingEdges = draftGraph.edges.filter((e) => e.source === node.id);

                  return (
                    <div
                      key={node.id}
                      className="p-3.5 rounded-xl border border-zinc-800 bg-zinc-900/70 space-y-2 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="h-5 w-5 rounded-md bg-indigo-500/15 text-indigo-400 font-mono text-[10px] flex items-center justify-center font-bold">
                            {idx + 1}
                          </span>
                          <span className="font-semibold text-white">{node.title}</span>
                        </div>
                        <span className="text-[9px] font-mono text-zinc-400 uppercase px-1.5 py-0.5 rounded bg-zinc-950 border border-zinc-800">
                          {node.type.replace('action_', '').replace('trigger_', '')}
                        </span>
                      </div>

                      <div className="text-[11px] text-zinc-400 bg-zinc-950/60 p-2 rounded-lg font-mono">
                        ID: {node.id}
                      </div>

                      {outgoingEdges.length > 0 && (
                        <div className="text-[10px] text-zinc-500 pt-1 border-t border-zinc-800/60 space-y-1">
                          {outgoingEdges.map((edge) => (
                            <div key={edge.id} className="flex items-center gap-1.5">
                              <span>↳</span>
                              {edge.source_handle && (
                                <span className="text-indigo-400 font-semibold uppercase">
                                  [{edge.source_handle}]
                                </span>
                              )}
                              <span>Points to:</span>
                              <span className="text-zinc-300 font-mono">{edge.target}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right: Draft Graph JSON Inspector & Direct Schema Editor */}
            <div className="lg:col-span-2 space-y-3">
              <div className="flex items-center justify-between px-1">
                <div className="text-xs font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                  <FileJson className="h-3.5 w-3.5 text-indigo-400" />
                  <span>Draft Graph JSON Specification</span>
                </div>
                <Badge variant={jsonError ? 'danger' : 'success'} className="text-[10px]">
                  {jsonError ? 'Syntax Error' : 'Valid JSON'}
                </Badge>
              </div>

              {jsonError && (
                <div className="p-2.5 rounded-lg border border-red-500/30 bg-red-500/10 text-xs text-red-300">
                  {jsonError}
                </div>
              )}

              <textarea
                value={rawJsonText}
                onChange={(e) => handleJsonChange(e.target.value)}
                rows={20}
                className="w-full font-mono text-xs p-4 rounded-xl border border-zinc-800 bg-zinc-950 text-zinc-200 focus:outline-none focus:border-indigo-500 leading-relaxed resize-y"
              />
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Publication Rules Checklist */}
      {activeTab === 'validator' && (
        <WorkflowValidatorPanel validationResult={validationResult} />
      )}

      {/* Tab 3: Version History */}
      {activeTab === 'history' && (
        <VersionHistory
          versions={versions}
          activeVersionId={workflow.active_version_id}
        />
      )}

      {/* Publish Modal */}
      {isPublishModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-zinc-800 bg-zinc-900 p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Rocket className="h-4 w-4 text-indigo-400" />
                <span>Publish Immutable Workflow Version</span>
              </h3>
              <button
                onClick={() => setIsPublishModalOpen(false)}
                className="text-xs text-zinc-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handlePublish} className="space-y-4 pt-4">
              {publishError && (
                <div className="p-3 rounded-lg border border-red-500/30 bg-red-500/10 text-xs text-red-400">
                  {publishError}
                </div>
              )}

              <div className="p-3.5 rounded-xl border border-emerald-500/20 bg-emerald-950/20 text-xs text-emerald-300 space-y-1">
                <div className="font-semibold flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>All 8 Publication Constraints Verified</span>
                </div>
                <p className="text-emerald-400/90 text-[11px]">
                  An immutable snapshot of this DAG will be locked. Any in-flight background runs will reference this version snapshot safely.
                </p>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-medium uppercase tracking-wider text-zinc-400">
                  Version Change Summary / Notes
                </label>
                <textarea
                  value={changeSummary}
                  onChange={(e) => setChangeSummary(e.target.value)}
                  placeholder="e.g. Initial lead qualification flow with 48h follow-up delay"
                  rows={3}
                  className="w-full rounded-lg border border-zinc-800 bg-zinc-950 p-2.5 text-xs text-zinc-100 placeholder:text-zinc-500 focus:border-indigo-500 focus:outline-none"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-800">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsPublishModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" size="sm" isLoading={isPending}>
                  Publish & Activate Snapshot
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
