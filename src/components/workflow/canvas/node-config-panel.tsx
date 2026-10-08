'use client';

import React, { useState, useEffect } from 'react';
import type { WorkflowNode } from '@/types/workflow';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import {
  X,
  Trash2,
  Copy,
  Plus,
  AlertTriangle,
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
  }, [node?.id]);

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
    '{{trigger.name}}',
    '{{trigger.company}}',
    '{{trigger.message}}',
    '{{ai_qualify.qualification_score}}',
    '{{ai_qualify.lead_tier}}',
  ];

  return (
    <div className="absolute top-4 right-4 z-20 w-88 max-h-[calc(100%-2rem)] flex flex-col rounded-xl bg-white border border-zinc-200 shadow-xl overflow-hidden animate-in fade-in slide-in-from-right-2">
      {/* Header */}
      <div className="p-3.5 border-b border-zinc-100 flex items-center justify-between">
        <div className="min-w-0 flex-1 pr-2">
          <div className="flex items-center gap-1.5">
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-medium uppercase bg-indigo-50 text-indigo-700">
              {node.type.replace('action_', '').replace('trigger_', '')}
            </span>
            <span className="text-[10px] font-mono text-zinc-400 truncate">
              ID: {node.id}
            </span>
          </div>
          <input
            type="text"
            value={title}
            onChange={(e) => handleTitleChange(e.target.value)}
            className="mt-1 w-full bg-transparent text-sm font-semibold text-zinc-900 border-b border-transparent hover:border-zinc-300 focus:border-indigo-600 focus:outline-none transition-colors"
          />
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-md text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors cursor-pointer"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Validation Errors Notice */}
      {validationErrors.length > 0 && (
        <div className="p-3 bg-red-50 border-b border-red-200 text-xs text-red-700 space-y-1">
          <div className="flex items-center gap-1.5 font-semibold text-red-800">
            <AlertTriangle className="h-3.5 w-3.5 text-red-600" />
            <span>Configuration Issues</span>
          </div>
          <ul className="list-disc pl-4 space-y-0.5 text-[11px]">
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
              <label className="block text-xs font-medium text-zinc-700 mb-1">
                Description
              </label>
              <Input
                value={config.description || ''}
                onChange={(e) => handleConfigChange('description', e.target.value)}
                placeholder="Manual trigger description..."
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1">
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
                className="w-full rounded-lg bg-zinc-50 border border-zinc-200 p-2.5 font-mono text-[11px] text-zinc-800 focus:outline-none focus:ring-1 focus:ring-indigo-600"
              />
              {jsonParseError && (
                <p className="text-[10px] text-red-600 mt-1">{jsonParseError}</p>
              )}
            </div>
          </div>
        )}

        {/* 2. Trigger: Webhook */}
        {node.type === 'trigger_webhook' && (
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1">
                Webhook Path Slug
              </label>
              <Input
                value={config.path_slug || ''}
                onChange={(e) => handleConfigChange('path_slug', e.target.value)}
                placeholder="e.g. website-leads"
              />
              <span className="text-[10px] text-zinc-400 font-mono mt-1 block">
                URL: /api/v1/webhook/{config.path_slug || 'slug'}
              </span>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1">
                HTTP Method
              </label>
              <Select
                value={config.http_method || 'POST'}
                onChange={(e) => handleConfigChange('http_method', e.target.value)}
              >
                <option value="POST">POST (Recommended)</option>
                <option value="GET">GET</option>
              </Select>
            </div>
          </div>
        )}

        {/* 3. AI Qualify */}
        {node.type === 'action_ai_qualify' && (
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1">
                Model
              </label>
              <Select
                value={config.model || 'gpt-4o-mini'}
                onChange={(e) => handleConfigChange('model', e.target.value)}
              >
                <option value="gpt-4o-mini">gpt-4o-mini (Fast & Cost-Effective)</option>
                <option value="gpt-4o">gpt-4o (High Precision)</option>
              </Select>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-medium text-zinc-700">Prompt Instructions</label>
                <div className="flex gap-1">
                  {commonTemplateTags.slice(0, 2).map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => handleInsertTag('prompt_template', tag)}
                      className="px-1.5 py-0.5 rounded bg-zinc-100 hover:bg-zinc-200 text-[10px] font-mono text-zinc-600 transition-colors cursor-pointer"
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
              <textarea
                value={config.prompt_template || ''}
                onChange={(e) => handleConfigChange('prompt_template', e.target.value)}
                rows={3}
                placeholder="Analyze and score inbound lead: {{trigger.message}}"
                className="w-full rounded-lg bg-white border border-zinc-200 p-2.5 text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-indigo-600"
              />
            </div>
          </div>
        )}

        {/* 4. CRM Upsert */}
        {node.type === 'action_crm_upsert' && (
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1">
                Email Field Reference
              </label>
              <Input
                value={config.email_field || '{{trigger.email}}'}
                onChange={(e) => handleConfigChange('email_field', e.target.value)}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1">
                Initial Lead Status
              </label>
              <Select
                value={config.status || 'new'}
                onChange={(e) => handleConfigChange('status', e.target.value)}
              >
                <option value="new">New</option>
                <option value="contacted">Contacted</option>
                <option value="qualified">Qualified</option>
              </Select>
            </div>
          </div>
        )}

        {/* 5. Condition IF/ELSE */}
        {node.type === 'condition_if_else' && (
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1">
                Field Path
              </label>
              <Input
                value={config.field_path || 'ai_qualify.lead_tier'}
                onChange={(e) => handleConfigChange('field_path', e.target.value)}
                placeholder="ai_qualify.lead_tier"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1">
                Operator
              </label>
              <Select
                value={config.operator || 'equals'}
                onChange={(e) => handleConfigChange('operator', e.target.value)}
              >
                <option value="equals">Equals</option>
                <option value="not_equals">Not Equals</option>
                <option value="greater_than">Greater Than</option>
                <option value="less_than">Less Than</option>
                <option value="contains">Contains</option>
              </Select>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1">
                Compare Value
              </label>
              <Input
                value={config.compare_value || ''}
                onChange={(e) => handleConfigChange('compare_value', e.target.value)}
                placeholder="hot"
              />
            </div>
          </div>
        )}

        {/* 6. Send Email */}
        {node.type === 'action_send_email' && (
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1">
                To (Recipient)
              </label>
              <Input
                value={config.to || '{{trigger.email}}'}
                onChange={(e) => handleConfigChange('to', e.target.value)}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1">
                Subject Line
              </label>
              <Input
                value={config.subject || ''}
                onChange={(e) => handleConfigChange('subject', e.target.value)}
                placeholder="Thank you for contacting us"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1">
                Body (HTML / Markdown)
              </label>
              <textarea
                value={config.body_markdown || ''}
                onChange={(e) => handleConfigChange('body_markdown', e.target.value)}
                rows={3}
                className="w-full rounded-lg bg-white border border-zinc-200 p-2.5 text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-indigo-600"
              />
            </div>
          </div>
        )}

        {/* 7. Slack Notify */}
        {node.type === 'action_slack_notify' && (
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1">
                Channel
              </label>
              <Input
                value={config.channel_name || '#general'}
                onChange={(e) => handleConfigChange('channel_name', e.target.value)}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1">
                Message Template
              </label>
              <textarea
                value={config.message_template || ''}
                onChange={(e) => handleConfigChange('message_template', e.target.value)}
                rows={3}
                placeholder="🚨 New lead: {{trigger.name}}"
                className="w-full rounded-lg bg-white border border-zinc-200 p-2.5 text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-indigo-600"
              />
            </div>
          </div>
        )}

        {/* 8. Delay */}
        {node.type === 'action_delay' && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-medium text-zinc-700 mb-1">
                  Duration
                </label>
                <Input
                  type="number"
                  min="1"
                  value={config.duration || 24}
                  onChange={(e) => handleConfigChange('duration', parseInt(e.target.value, 10) || 1)}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-700 mb-1">
                  Unit
                </label>
                <Select
                  value={config.unit || 'hours'}
                  onChange={(e) => handleConfigChange('unit', e.target.value)}
                >
                  <option value="minutes">Minutes</option>
                  <option value="hours">Hours</option>
                  <option value="days">Days</option>
                </Select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-zinc-100 bg-zinc-50/50 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onDuplicateNode(node.id)}
          >
            <Copy className="h-3.5 w-3.5" />
            <span>Duplicate</span>
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onDeleteNode(node.id)}
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>

        <Button size="sm" onClick={onClose}>
          Done
        </Button>
      </div>
    </div>
  );
}
