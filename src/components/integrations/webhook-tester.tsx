'use client';

import React, { useState, useTransition } from 'react';
import type { WebhookEndpointRecord } from '@/types/crm';
import { rotateWebhookSecretAction } from '@/lib/actions/crm';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Webhook,
  Key,
  RefreshCw,
  Copy,
  Check,
  Send,
  Eye,
  EyeOff,
  Code,
  Sparkles,
  ShieldAlert,
  ArrowRight,
  Terminal,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import Link from 'next/link';

interface WebhookTesterProps {
  endpoints: WebhookEndpointRecord[];
  workspaceId: string;
  baseUrl: string;
}

export function WebhookTester({ endpoints, workspaceId, baseUrl }: WebhookTesterProps) {
  const [selectedEndpointId, setSelectedEndpointId] = useState<string>(
    endpoints[0]?.id || ''
  );
  const [showSecret, setShowSecret] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [isRotating, startRotating] = useTransition();

  // Test Form State
  const [formName, setFormName] = useState('Sarah Connor');
  const [formEmail, setFormEmail] = useState('sarah.connor@skydefense.ai');
  const [formPhone, setFormPhone] = useState('+1 (555) 019-2834');
  const [formCompany, setFormCompany] = useState('Cyberdyne Systems');
  const [formService, setFormService] = useState('Enterprise AI Automation');
  const [formBudget, setFormBudget] = useState('25000');
  const [formMessage, setFormMessage] = useState(
    'Looking to automate our inbound RFP evaluation pipeline with GPT-4o and Slack routing.'
  );
  const [customIdempotencyKey, setCustomIdempotencyKey] = useState(
    `req_${Date.now()}`
  );
  const [invalidSecretTest, setInvalidSecretTest] = useState(false);

  // Response State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [testResponse, setTestResponse] = useState<{
    status: number;
    ok: boolean;
    data: any;
    durationMs: number;
  } | null>(null);

  // Code Tab state
  const [activeCodeTab, setActiveCodeTab] = useState<'curl' | 'fetch' | 'python'>('curl');

  const currentEndpoint = endpoints.find((e) => e.id === selectedEndpointId) || endpoints[0];

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleRotateSecret = () => {
    if (!currentEndpoint) return;
    if (!confirm('Are you sure you want to rotate this webhook secret? Any external forms using the old secret will fail.')) {
      return;
    }

    startRotating(async () => {
      const res = await rotateWebhookSecretAction(currentEndpoint.id);
      if (res.success && res.newSecret) {
        currentEndpoint.secret_token = res.newSecret;
      }
    });
  };

  const fullWebhookUrl = currentEndpoint
    ? `${baseUrl}/api/v1/webhook/${currentEndpoint.path_slug}`
    : `${baseUrl}/api/v1/webhook/demo-endpoint`;

  const handleSendTestPayload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentEndpoint) return;

    setIsSubmitting(true);
    setTestResponse(null);
    const startTime = performance.now();

    const payload = {
      name: formName,
      email: formEmail,
      phone: formPhone,
      company: formCompany,
      service_interest: formService,
      estimated_budget: formBudget ? parseFloat(formBudget) : undefined,
      message: formMessage,
      source: 'webhook_test_form',
    };

    const secretToUse = invalidSecretTest ? 'invalid_secret_token_123' : currentEndpoint.secret_token;

    try {
      const res = await fetch(fullWebhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-flowpilot-secret': secretToUse,
          'x-idempotency-key': customIdempotencyKey,
        },
        body: JSON.stringify(payload),
      });

      const durationMs = Math.round(performance.now() - startTime);
      const data = await res.json();

      setTestResponse({
        status: res.status,
        ok: res.ok,
        data,
        durationMs,
      });
    } catch (err: any) {
      const durationMs = Math.round(performance.now() - startTime);
      setTestResponse({
        status: 500,
        ok: false,
        data: { error: err.message || 'Network request failed' },
        durationMs,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const curlSnippet = `curl -X POST "${fullWebhookUrl}" \\
  -H "Content-Type: application/json" \\
  -H "x-flowpilot-secret: ${currentEndpoint?.secret_token || 'whsec_your_secret'}" \\
  -H "x-idempotency-key: ${customIdempotencyKey}" \\
  -d '{
    "name": "${formName}",
    "email": "${formEmail}",
    "phone": "${formPhone}",
    "company": "${formCompany}",
    "service_interest": "${formService}",
    "estimated_budget": ${formBudget || 0},
    "message": "${formMessage.replace(/"/g, '\\"')}",
    "source": "website_contact_form"
  }'`;

  const fetchSnippet = `const response = await fetch("${fullWebhookUrl}", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "x-flowpilot-secret": "${currentEndpoint?.secret_token || 'whsec_your_secret'}",
    "x-idempotency-key": "${customIdempotencyKey}"
  },
  body: JSON.stringify({
    name: "${formName}",
    email: "${formEmail}",
    phone: "${formPhone}",
    company: "${formCompany}",
    service_interest: "${formService}",
    estimated_budget: ${formBudget || 0},
    message: "${formMessage.replace(/"/g, '\\"')}",
    source: "website_contact_form"
  })
});

const result = await response.json();
console.log(result);`;

  const pythonSnippet = `import requests

url = "${fullWebhookUrl}"
headers = {
    "Content-Type": "application/json",
    "x-flowpilot-secret": "${currentEndpoint?.secret_token || 'whsec_your_secret'}",
    "x-idempotency-key": "${customIdempotencyKey}"
}
payload = {
    "name": "${formName}",
    "email": "${formEmail}",
    "phone": "${formPhone}",
    "company": "${formCompany}",
    "service_interest": "${formService}",
    "estimated_budget": ${formBudget || 0},
    "message": "${formMessage.replace(/"/g, '\\"')}",
    "source": "website_contact_form"
}

response = requests.post(url, json=payload, headers=headers)
print(response.status_code, response.json())`;

  if (!currentEndpoint) {
    return (
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-8 text-center space-y-3">
        <Webhook className="h-8 w-8 text-zinc-500 mx-auto" />
        <h3 className="text-base font-semibold text-white">No Ingestion Webhook Configured</h3>
        <p className="text-xs text-zinc-400 max-w-md mx-auto">
          Publish a workflow with a <strong>Webhook Trigger</strong> to automatically generate your secure workspace endpoint.
        </p>
        <Link href="/workflows">
          <Button size="sm" className="mt-2 text-xs">
            Go to Workflows
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Endpoint Configuration Bar */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 space-y-4 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-500/20 border border-purple-500/30 text-purple-400">
              <Webhook className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white">Lead Capture Webhook Endpoint</h3>
                <Badge variant="success">Active</Badge>
              </div>
              <p className="text-xs text-zinc-400">
                Workflow: <strong className="text-zinc-200">{currentEndpoint.workflow?.name || 'Default Pipeline'}</strong>
              </p>
            </div>
          </div>

          {endpoints.length > 1 && (
            <select
              value={selectedEndpointId}
              onChange={(e) => setSelectedEndpointId(e.target.value)}
              className="rounded-lg bg-zinc-950 border border-zinc-800 px-3 py-1.5 text-xs text-zinc-300 focus:outline-none focus:border-purple-500"
            >
              {endpoints.map((ep) => (
                <option key={ep.id} value={ep.id}>
                  {ep.workflow?.name || ep.path_slug}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* URL and Secret Info */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 pt-2">
          {/* Target URL */}
          <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-800 space-y-1">
            <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block">
              Endpoint Ingestion URL (POST)
            </span>
            <div className="flex items-center justify-between gap-2">
              <span className="font-mono text-xs text-purple-300 truncate">{fullWebhookUrl}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyToClipboard(fullWebhookUrl, 'url')}
                className="h-7 px-2 text-zinc-400 hover:text-white"
              >
                {copiedKey === 'url' ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
              </Button>
            </div>
          </div>

          {/* Secret Token */}
          <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-800 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                Authentication Secret (x-flowpilot-secret)
              </span>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowSecret(!showSecret)}
                  className="h-6 px-1.5 text-zinc-500 hover:text-zinc-300 text-[11px]"
                >
                  {showSecret ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRotateSecret}
                  disabled={isRotating}
                  className="h-6 px-1.5 text-amber-400 hover:text-amber-300 text-[11px] gap-1"
                >
                  <RefreshCw className={`h-3 w-3 ${isRotating ? 'animate-spin' : ''}`} />
                  <span>Rotate</span>
                </Button>
              </div>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="font-mono text-xs text-zinc-200 truncate">
                {showSecret ? currentEndpoint.secret_token : '••••••••••••••••••••••••••••••••••••••••'}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyToClipboard(currentEndpoint.secret_token, 'secret')}
                className="h-7 px-2 text-zinc-400 hover:text-white"
              >
                {copiedKey === 'secret' ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Grid: Interactive Form vs Request Code Example */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sample Lead Form */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5 shadow-lg space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <Send className="h-4 w-4 text-purple-400" />
              <span>Interactive Lead Intake Tester</span>
            </h4>
            <span className="text-[11px] text-zinc-500 font-mono">Live HTTP Submissions</span>
          </div>

          <form onSubmit={handleSendTestPayload} className="space-y-3 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] text-zinc-400 font-medium">Full Name</label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-zinc-200 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] text-zinc-400 font-medium">Email Address</label>
                <input
                  type="email"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-zinc-200 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] text-zinc-400 font-medium">Phone</label>
                <input
                  type="text"
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-zinc-200 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] text-zinc-400 font-medium">Company Name</label>
                <input
                  type="text"
                  value={formCompany}
                  onChange={(e) => setFormCompany(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-zinc-200 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] text-zinc-400 font-medium">Service Interest</label>
                <input
                  type="text"
                  value={formService}
                  onChange={(e) => setFormService(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-zinc-200 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] text-zinc-400 font-medium">Estimated Budget ($)</label>
                <input
                  type="number"
                  value={formBudget}
                  onChange={(e) => setFormBudget(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-zinc-200 focus:outline-none focus:border-purple-500 font-mono"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] text-zinc-400 font-medium">Inquiry Message</label>
              <textarea
                rows={2}
                value={formMessage}
                onChange={(e) => setFormMessage(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-zinc-200 focus:outline-none focus:border-purple-500 resize-none"
              />
            </div>

            <div className="space-y-1 pt-1">
              <div className="flex items-center justify-between">
                <label className="text-[11px] text-zinc-400 font-medium">Idempotency Key (x-idempotency-key)</label>
                <button
                  type="button"
                  onClick={() => setCustomIdempotencyKey(`req_${Date.now()}`)}
                  className="text-[10px] text-purple-400 hover:underline"
                >
                  Regenerate Key
                </button>
              </div>
              <input
                type="text"
                value={customIdempotencyKey}
                onChange={(e) => setCustomIdempotencyKey(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-zinc-300 font-mono text-xs focus:outline-none focus:border-purple-500"
              />
            </div>

            {/* Test Toggle: Invalid Secret */}
            <div className="flex items-center justify-between pt-1 text-xs">
              <label className="flex items-center gap-2 cursor-pointer text-zinc-400">
                <input
                  type="checkbox"
                  checked={invalidSecretTest}
                  onChange={(e) => setInvalidSecretTest(e.target.checked)}
                  className="rounded border-zinc-700 bg-zinc-950 text-purple-600 focus:ring-0"
                />
                <span>Simulate Invalid Authentication Secret (401 Verification)</span>
              </label>
            </div>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full text-xs font-semibold gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-lg"
            >
              <Send className="h-3.5 w-3.5" />
              <span>{isSubmitting ? 'Sending Request...' : 'Trigger Webhook & Execute Pipeline'}</span>
            </Button>
          </form>

          {/* Response Box */}
          {testResponse && (
            <div
              className={`p-3.5 rounded-xl border text-xs space-y-2 font-mono ${
                testResponse.ok
                  ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-300'
                  : 'bg-rose-950/20 border-rose-500/30 text-rose-300'
              }`}
            >
              <div className="flex items-center justify-between font-bold text-xs">
                <span className="flex items-center gap-1.5">
                  {testResponse.ok ? <CheckCircle2 className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
                  HTTP {testResponse.status} {testResponse.ok ? 'Accepted' : 'Error'}
                </span>
                <span className="text-[10px] text-zinc-400">{testResponse.durationMs}ms</span>
              </div>
              <pre className="bg-zinc-950/80 p-2.5 rounded-lg border border-zinc-800/80 overflow-x-auto text-[11px] text-zinc-200">
                {JSON.stringify(testResponse.data, null, 2)}
              </pre>
              {testResponse.data?.lead?.id && (
                <div className="pt-1 flex items-center justify-end">
                  <Link
                    href={`/leads/${testResponse.data.lead.id}`}
                    className="text-[11px] font-sans text-purple-400 hover:underline inline-flex items-center gap-1 font-semibold"
                  >
                    <span>View Newly Ingested Lead Record</span>
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Copyable Request Examples */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5 shadow-lg space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <Code className="h-4 w-4 text-purple-400" />
                <span>Copyable Integration Examples</span>
              </h4>
              <div className="flex items-center gap-1 bg-zinc-950 p-1 rounded-lg border border-zinc-800">
                <button
                  type="button"
                  onClick={() => setActiveCodeTab('curl')}
                  className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                    activeCodeTab === 'curl' ? 'bg-purple-600 text-white' : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  cURL
                </button>
                <button
                  type="button"
                  onClick={() => setActiveCodeTab('fetch')}
                  className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                    activeCodeTab === 'fetch' ? 'bg-purple-600 text-white' : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  JavaScript
                </button>
                <button
                  type="button"
                  onClick={() => setActiveCodeTab('python')}
                  className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                    activeCodeTab === 'python' ? 'bg-purple-600 text-white' : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  Python
                </button>
              </div>
            </div>

            <div className="relative">
              <pre className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 text-[11px] font-mono text-zinc-300 overflow-x-auto leading-relaxed max-h-[360px]">
                {activeCodeTab === 'curl' && curlSnippet}
                {activeCodeTab === 'fetch' && fetchSnippet}
                {activeCodeTab === 'python' && pythonSnippet}
              </pre>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  const content =
                    activeCodeTab === 'curl'
                      ? curlSnippet
                      : activeCodeTab === 'fetch'
                      ? fetchSnippet
                      : pythonSnippet;
                  copyToClipboard(content, 'code');
                }}
                className="absolute top-3 right-3 h-7 px-2.5 text-xs bg-zinc-900/90 border border-zinc-700 text-zinc-300 hover:text-white"
              >
                {copiedKey === 'code' ? (
                  <span className="flex items-center gap-1 text-emerald-400">
                    <Check className="h-3 w-3" /> Copied
                  </span>
                ) : (
                  <span className="flex items-center gap-1">
                    <Copy className="h-3 w-3" /> Copy Snippet
                  </span>
                )}
              </Button>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-purple-950/20 border border-purple-800/30 text-xs text-purple-300 space-y-1">
            <span className="font-semibold text-purple-200 flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-purple-400" />
              Webhook Security & Normalization Policy
            </span>
            <p className="text-[11px] text-zinc-400 leading-normal">
              FlowPilot enforces <code>lower(trim(email))</code> workspace-level deduplication. Duplicate events with matching <code>x-idempotency-key</code> or identical payloads within 5 minutes return cached responses without duplicating workflow runs.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
