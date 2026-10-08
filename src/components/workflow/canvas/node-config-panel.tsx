'use client';

import React, { useState, useEffect } from 'react';
import type { WorkflowNode, WorkflowNodeType } from '@/types/workflow';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  X,
  Trash2,
  Copy,
  Plus,
  Minus,
  Sparkles,
  AlertTriangle,
  Code2,
  Layers,
  HelpCircle,
} from 'lucide-react';

interface NodeConfigPanelProps {
  node: WorkflowNode | null;
  onUpdateNode: (updatedNode: WorkflowNode) => void;
  onDeleteNode: (nodeId: string) => void;
  onDuplicateNode: (nodeId: string) => void;
  onClose: () => void;
  validationErrors?: string[];
}

export function NodeConfigPanel({
  node,
  onUpdateNode,
  onDeleteNode,
  onDuplicateNode,
  onClose,
  validationErrors = [],
}: NodeConfigPanelProps) {
  const [title, setTitle] = useState('');
  const [config, setConfig] = useState<Record<string, any>>({});
  const [jsonText, setJsonText] = useState('');
  const [jsonParseError, setJsonParseError] = useState<string | null>(null);

  useEffect(() => {
    if (node) {
      setTitle(node.title);
      setConfig(node.config || {});
      if (node.type === 'trigger_manual' && node.config?.sample_payload) {
        setJsonText(JSON.stringify(node.config.sample_payload, null, 2));
      }
    }
  }, [node]);

  if (!node) return null;

  const handleTitleChange = (newTitle: string) => {
    setTitle(newTitle);
    onUpdateNode({
      ...node,
      title: newTitle,
      config,
    });
  };

  const handleConfigChange = (key: string, value: any) => {
    const updatedConfig = { ...config, [key]: value };
    setConfig(updatedConfig);
    onUpdateNode({
      ...node,
      title,
      config: updatedConfig,
    });
  };

  const handleInsertTag = (targetKey: string, tag: string) => {
    const currentVal = config[targetKey] || '';
    const updatedVal = `${currentVal} ${tag}`.trim();
    handleConfigChange(targetKey, updatedVal);
  };

  const commonTemplateTags = [
    '{{trigger.email}}',
    '{{trigger.first_name}}',
    '{{trigger.company}}',
    '{{trigger.budget}}',
    '{{ai_qualify.qualification_score}}',
    '{{ai_qualify.lead_tier}}',
    '{{crm_upsert.crm_record_id}}',
  ];

  return (
    <div className="absolute top-4 right-4 z-20 w-96 max-h-[calc(100%-2rem)] flex flex-col rounded-2xl bg-zinc-900/95 border border-zinc-800 shadow-2xl backdrop-blur-xl overflow-hidden animate-in fade-in slide-in-from-right-4">
      {/* Header */}
      <div className="p-4 border-b border-zinc-800/80 flex items-center justify-between">
        <div className="min-w-0 flex-1 pr-2">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold uppercase bg-purple-500/20 text-purple-300 border border-purple-500/30">
              {node.type.replace('action_', '').replace('trigger_', '')}
            </span>
            <span className="text-[10px] font-mono text-zinc-500 truncate">
              ID: {node.id}
            </span>
          </div>
          <input
            type="text"
            value={title}
            onChange={(e) => handleTitleChange(e.target.value)}
            className="mt-1.5 w-full bg-transparent text-sm font-bold text-white border-b border-transparent hover:border-zinc-700 focus:border-purple-500 focus:outline-none transition-colors"
          />
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Validation Errors Notice */}
      {validationErrors.length > 0 && (
        <div className="p-3 bg-red-950/40 border-b border-red-800/50 text-xs text-red-300 space-y-1">
          <div className="flex items-center gap-1.5 font-semibold text-red-200">
            <AlertTriangle className="h-3.5 w-3.5 text-red-400" />
            <span>Configuration Issues</span>
          </div>
          <ul className="list-disc pl-4 space-y-0.5 text-[11px] text-red-300/90">
            {validationErrors.map((err, idx) => (
              <li key={idx}>{err}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Form Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
        {/* 1. Trigger: Manual */}
        {node.type === 'trigger_manual' && (
          <div className="space-y-3">
            <div>
              <label className="block text-[11px] font-medium text-zinc-400 mb-1">
                Description
              </label>
              <Input
                value={config.description || ''}
                onChange={(e) => handleConfigChange('description', e.target.value)}
                placeholder="Manual trigger description..."
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-zinc-400 mb-1">
                Sample Trigger Payload (JSON)
              </label>
              <textarea
                value={jsonText}
                onChange={(e) => {
                  setJsonText(e.target.value);
                  try {
                    const parsed = JSON.parse(e.target.value);
                    setJsonParseError(null);
                    handleConfigChange('sample_payload', parsed);
                  } catch (err: unknown) {
                    setJsonParseError(err instanceof Error ? err.message : 'Invalid JSON');
                  }
                }}
                rows={6}
                className="w-full rounded-lg bg-zinc-950 border border-zinc-800 p-2.5 font-mono text-[11px] text-emerald-400 focus:border-purple-500 focus:outline-none"
              />
              {jsonParseError && (
                <p className="text-[10px] text-red-400 mt-1">{jsonParseError}</p>
              )}
            </div>
          </div>
        )}

        {/* 2. Trigger: Webhook */}
        {node.type === 'trigger_webhook' && (
          <div className="space-y-3">
            <div>
              <label className="block text-[11px] font-medium text-zinc-400 mb-1">
                Webhook Path Slug
              </label>
              <Input
                value={config.path_slug || ''}
                onChange={(e) => handleConfigChange('path_slug', e.target.value)}
                placeholder="e.g. website-leads"
              />
              <span className="text-[10px] text-zinc-500 font-mono mt-1 block">
                Target: /api/v1/webhook/{config.path_slug || 'slug'}
              </span>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-zinc-400 mb-1">
                HTTP Method
              </label>
              <select
                value={config.http_method || 'POST'}
                onChange={(e) => handleConfigChange('http_method', e.target.value)}
                className="w-full rounded-lg bg-zinc-950 border border-zinc-800 p-2 text-xs text-zinc-200 focus:border-purple-500 focus:outline-none"
              >
                <option value="POST">POST (Recommended)</option>
                <option value="GET">GET</option>
              </select>
            </div>
          </div>
        )}

        {/* 3. Logic: Field Mapping */}
        {node.type === 'action_field_mapping' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-medium text-zinc-400">Field Mappings</label>
              <button
                type="button"
                onClick={() => {
                  const current = config.mappings || [];
                  handleConfigChange('mappings', [
                    ...current,
                    { source_field: 'trigger.email', target_field: 'lead_email' },
                  ]);
                }}
                className="inline-flex items-center gap-1 text-[11px] text-purple-400 hover:text-purple-300"
              >
                <Plus className="h-3 w-3" />
                <span>Add Field</span>
              </button>
            </div>

            <div className="space-y-2">
              {(config.mappings || []).map((m: any, idx: number) => (
                <div
                  key={idx}
                  className="p-2.5 rounded-lg bg-zinc-950/60 border border-zinc-800 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono text-zinc-500">Mapping #{idx + 1}</span>
                    <button
                      type="button"
                      onClick={() => {
                        const next = [...config.mappings];
                        next.splice(idx, 1);
                        handleConfigChange('mappings', next);
                      }}
                      className="text-zinc-500 hover:text-red-400"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                  <Input
                    label="Source Path (e.g. trigger.contact.email)"
                    value={m.source_field || ''}
                    onChange={(e) => {
                      const next = [...config.mappings];
                      next[idx] = { ...next[idx], source_field: e.target.value };
                      handleConfigChange('mappings', next);
                    }}
                  />
                  <Input
                    label="Target Key"
                    value={m.target_field || ''}
                    onChange={(e) => {
                      const next = [...config.mappings];
                      next[idx] = { ...next[idx], target_field: e.target.value };
                      handleConfigChange('mappings', next);
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 4. Logic: IF / ELSE Condition */}
        {node.type === 'condition_if_else' && (
          <div className="space-y-3">
            <div>
              <label className="block text-[11px] font-medium text-zinc-400 mb-1">
                Field Path to Evaluate
              </label>
              <Input
                value={config.field_path || ''}
                onChange={(e) => handleConfigChange('field_path', e.target.value)}
                placeholder="e.g. ai_qualify.lead_tier or trigger.budget"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-zinc-400 mb-1">
                Comparison Operator
              </label>
              <select
                value={config.operator || 'equals'}
                onChange={(e) => handleConfigChange('operator', e.target.value)}
                className="w-full rounded-lg bg-zinc-950 border border-zinc-800 p-2 text-xs text-zinc-200 focus:border-purple-500 focus:outline-none"
              >
                <option value="equals">Equals (==)</option>
                <option value="not_equals">Not Equals (!=)</option>
                <option value="greater_than">Greater Than (&gt;)</option>
                <option value="less_than">Less Than (&lt;)</option>
                <option value="contains">Contains Substring</option>
                <option value="starts_with">Starts With</option>
                <option value="exists">Exists / Is Defined</option>
                <option value="is_empty">Is Empty</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-zinc-400 mb-1">
                Compare Value
              </label>
              <Input
                value={config.compare_value || ''}
                onChange={(e) => handleConfigChange('compare_value', e.target.value)}
                placeholder="e.g. hot or $10,000"
              />
            </div>
          </div>
        )}

        {/* 5. Logic: Delay */}
        {node.type === 'action_delay' && (
          <div className="space-y-3">
            <div>
              <label className="block text-[11px] font-medium text-zinc-400 mb-1">
                Duration
              </label>
              <Input
                type="number"
                min="1"
                value={config.duration || 24}
                onChange={(e) => handleConfigChange('duration', parseInt(e.target.value) || 1)}
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-zinc-400 mb-1">
                Time Unit
              </label>
              <select
                value={config.unit || 'hours'}
                onChange={(e) => handleConfigChange('unit', e.target.value)}
                className="w-full rounded-lg bg-zinc-950 border border-zinc-800 p-2 text-xs text-zinc-200 focus:border-purple-500 focus:outline-none"
              >
                <option value="minutes">Minutes</option>
                <option value="hours">Hours</option>
                <option value="days">Days</option>
                <option value="seconds">Seconds (Testing)</option>
              </select>
            </div>
          </div>
        )}

        {/* 6. AI: Lead Qualification */}
        {node.type === 'action_ai_qualify' && (
          <div className="space-y-3">
            <div>
              <label className="block text-[11px] font-medium text-zinc-400 mb-1">
                OpenAI Model
              </label>
              <select
                value={config.model || 'gpt-4o-mini'}
                onChange={(e) => handleConfigChange('model', e.target.value)}
                className="w-full rounded-lg bg-zinc-950 border border-zinc-800 p-2 text-xs text-zinc-200 focus:border-purple-500 focus:outline-none"
              >
                <option value="gpt-4o-mini">GPT-4o Mini (Fast & Cost Effective)</option>
                <option value="gpt-4o">GPT-4o (High Reasoning)</option>
                <option value="gpt-4-turbo">GPT-4 Turbo</option>
              </select>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-medium text-zinc-400">Prompt Instructions</label>
              </div>
              <textarea
                value={config.prompt_template || ''}
                onChange={(e) => handleConfigChange('prompt_template', e.target.value)}
                rows={4}
                placeholder="Analyze this lead: {{trigger.message}}"
                className="w-full rounded-lg bg-zinc-950 border border-zinc-800 p-2.5 text-xs text-zinc-100 focus:border-purple-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-zinc-400 mb-1">
                Insert Context Variable
              </label>
              <div className="flex flex-wrap gap-1">
                {commonTemplateTags.slice(0, 4).map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => handleInsertTag('prompt_template', tag)}
                    className="px-2 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-[10px] font-mono text-purple-300 transition-colors"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 7. Integration: CRM Upsert */}
        {node.type === 'action_crm_upsert' && (
          <div className="space-y-3">
            <Input
              label="Email Field Reference"
              value={config.email_field || ''}
              onChange={(e) => handleConfigChange('email_field', e.target.value)}
              placeholder="{{trigger.email}}"
            />
            <Input
              label="First Name Field"
              value={config.first_name_field || ''}
              onChange={(e) => handleConfigChange('first_name_field', e.target.value)}
              placeholder="{{trigger.first_name}}"
            />
            <Input
              label="Company Field"
              value={config.company_field || ''}
              onChange={(e) => handleConfigChange('company_field', e.target.value)}
              placeholder="{{trigger.company}}"
            />
            <div>
              <label className="block text-[11px] font-medium text-zinc-400 mb-1">
                Lead Status
              </label>
              <select
                value={config.status || 'new'}
                onChange={(e) => handleConfigChange('status', e.target.value)}
                className="w-full rounded-lg bg-zinc-950 border border-zinc-800 p-2 text-xs text-zinc-200 focus:border-purple-500 focus:outline-none"
              >
                <option value="new">New</option>
                <option value="contacted">Contacted</option>
                <option value="qualified">Qualified</option>
                <option value="unqualified">Unqualified</option>
                <option value="converted">Converted</option>
              </select>
            </div>
          </div>
        )}

        {/* 8. Integration: Send Email */}
        {node.type === 'action_send_email' && (
          <div className="space-y-3">
            <Input
              label="Recipient (To)"
              value={config.to || ''}
              onChange={(e) => handleConfigChange('to', e.target.value)}
              placeholder="{{trigger.email}}"
            />
            <Input
              label="Subject Line"
              value={config.subject || ''}
              onChange={(e) => handleConfigChange('subject', e.target.value)}
              placeholder="e.g. Welcome {{trigger.first_name}}!"
            />
            <div>
              <label className="block text-[11px] font-medium text-zinc-400 mb-1">
                Email Body (Markdown)
              </label>
              <textarea
                value={config.body_markdown || ''}
                onChange={(e) => handleConfigChange('body_markdown', e.target.value)}
                rows={5}
                placeholder="Hi {{trigger.first_name}}..."
                className="w-full rounded-lg bg-zinc-950 border border-zinc-800 p-2.5 text-xs text-zinc-100 font-mono focus:border-purple-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-zinc-400 mb-1">
                Insert Variable
              </label>
              <div className="flex flex-wrap gap-1">
                {commonTemplateTags.slice(0, 4).map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => handleInsertTag('body_markdown', tag)}
                    className="px-2 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-[10px] font-mono text-purple-300 transition-colors"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 9. Integration: Slack Notification */}
        {node.type === 'action_slack_notify' && (
          <div className="space-y-3">
            <Input
              label="Slack Channel"
              value={config.channel_name || ''}
              onChange={(e) => handleConfigChange('channel_name', e.target.value)}
              placeholder="#sales-alerts"
            />
            <div>
              <label className="block text-[11px] font-medium text-zinc-400 mb-1">
                Message Template
              </label>
              <textarea
                value={config.message_template || ''}
                onChange={(e) => handleConfigChange('message_template', e.target.value)}
                rows={4}
                placeholder="🚨 *New Lead*: {{trigger.company}} (Tier: {{ai_qualify.lead_tier}})"
                className="w-full rounded-lg bg-zinc-950 border border-zinc-800 p-2.5 text-xs text-zinc-100 focus:border-purple-500 focus:outline-none"
              />
            </div>
          </div>
        )}
      </div>

      {/* Footer Actions */}
      <div className="p-3.5 border-t border-zinc-800/80 bg-zinc-950/60 flex items-center justify-between gap-2">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => onDuplicateNode(node.id)}
          className="text-xs gap-1.5"
        >
          <Copy className="h-3.5 w-3.5" />
          <span>Duplicate</span>
        </Button>

        <Button
          variant="danger"
          size="sm"
          onClick={() => onDeleteNode(node.id)}
          className="text-xs gap-1.5"
        >
          <Trash2 className="h-3.5 w-3.5" />
          <span>Delete Node</span>
        </Button>
      </div>
    </div>
  );
}
