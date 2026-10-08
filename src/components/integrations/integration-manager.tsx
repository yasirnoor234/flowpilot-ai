'use client';

import React, { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import type {
  IntegrationConnectionRecord,
  IntegrationProvider,
  IntegrationActionAttemptRecord,
} from '@/types/integrations';
import {
  saveIntegrationConnectionAction,
  testIntegrationConnectionAction,
  disconnectIntegrationAction,
} from '@/lib/actions/integrations';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import {
  Mail,
  MessageSquare,
  Bot,
  CheckCircle2,
  AlertCircle,
  Clock,
  Send,
  Trash2,
  Sliders,
  Check,
} from 'lucide-react';

interface IntegrationManagerProps {
  connections: IntegrationConnectionRecord[];
  recentAttempts: IntegrationActionAttemptRecord[];
  workspaceName: string;
  isDemoMode: boolean;
}

export function IntegrationManager({
  connections,
  recentAttempts,
  isDemoMode,
}: IntegrationManagerProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Active configuration modal state
  const [activeModal, setActiveModal] = useState<IntegrationProvider | null>(null);
  const [secretKeyInput, setSecretKeyInput] = useState('');
  const [fromEmailInput, setFromEmailInput] = useState('FlowPilot <onboarding@resend.dev>');
  const [testRecipientInput, setTestRecipientInput] = useState('');
  const [slackChannelInput, setSlackChannelInput] = useState('#leads-notifications');
  const [openaiModelInput, setOpenaiModelInput] = useState('gpt-4o-mini');

  // Test send state
  const [testingProvider, setTestingProvider] = useState<IntegrationProvider | null>(null);
  const [testResult, setTestResult] = useState<{
    provider: IntegrationProvider;
    success: boolean;
    message: string;
  } | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const getConnection = (provider: IntegrationProvider) => {
    return connections.find((c) => c.provider === provider);
  };

  const handleOpenConfig = (provider: IntegrationProvider) => {
    const existing = getConnection(provider);
    setActiveModal(provider);
    setSecretKeyInput('');
    setFeedback(null);
    setTestResult(null);

    if (provider === 'resend') {
      setFromEmailInput(existing?.settings?.from_email || 'FlowPilot <onboarding@resend.dev>');
      setTestRecipientInput(existing?.settings?.test_recipient || '');
    } else if (provider === 'slack') {
      setSlackChannelInput(existing?.settings?.channel || '#leads-notifications');
    } else if (provider === 'openai') {
      setOpenaiModelInput(existing?.settings?.model || 'gpt-4o-mini');
    }
  };

  const handleSaveConnection = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeModal) return;

    let settings: Record<string, any> = {};
    let providerName = 'Resend';

    if (activeModal === 'resend') {
      settings = {
        from_email: fromEmailInput.trim() || 'FlowPilot <onboarding@resend.dev>',
        test_recipient: testRecipientInput.trim() || undefined,
      };
      providerName = 'Resend';
    } else if (activeModal === 'slack') {
      settings = {
        channel: slackChannelInput.trim() || '#leads-notifications',
      };
      providerName = 'Slack Incoming Webhooks';
    } else if (activeModal === 'openai') {
      settings = {
        model: openaiModelInput.trim() || 'gpt-4o-mini',
      };
      providerName = 'OpenAI';
    }

    startTransition(async () => {
      const res = await saveIntegrationConnectionAction({
        provider: activeModal,
        name: providerName,
        secretKey: secretKeyInput,
        settings,
      });

      if (res.success) {
        setFeedback({ type: 'success', text: `${providerName} connection configured successfully.` });
        setActiveModal(null);
        router.refresh();
      } else {
        setFeedback({ type: 'error', text: res.error || 'Failed to save connection' });
      }
    });
  };

  const handleTestDelivery = (provider: IntegrationProvider) => {
    setTestingProvider(provider);
    setTestResult(null);

    startTransition(async () => {
      const res = await testIntegrationConnectionAction({
        provider,
        testTarget: provider === 'resend' ? testRecipientInput : undefined,
      });

      setTestingProvider(null);
      setTestResult({
        provider,
        success: res.success,
        message: res.message,
      });
      router.refresh();
    });
  };

  const handleDisconnect = (provider: IntegrationProvider) => {
    if (!confirm(`Are you sure you want to disconnect ${provider}?`)) return;

    startTransition(async () => {
      const res = await disconnectIntegrationAction(provider);
      if (res.success) {
        setFeedback({ type: 'success', text: `${provider} connection removed.` });
        router.refresh();
      } else {
        setFeedback({ type: 'error', text: res.error || 'Failed to disconnect' });
      }
    });
  };

  return (
    <div className="space-y-8">
      {/* Feedback Banner */}
      {feedback && (
        <div
          className={`p-3.5 rounded-xl text-xs flex items-center justify-between gap-2 ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
              : 'bg-red-50 border border-red-200 text-red-800'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : <AlertCircle className="h-4 w-4 text-red-600" />}
            <span>{feedback.text}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="text-zinc-500 hover:text-zinc-700 text-xs font-medium">
            Dismiss
          </button>
        </div>
      )}

      {/* Grid of Integration Adapters */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* 1. Resend Email */}
        {(() => {
          const conn = getConnection('resend');
          const isConnected = !!conn && conn.is_active;
          return (
            <Card className="flex flex-col justify-between">
              <div>
                <CardHeader className="flex flex-row items-start justify-between pb-2">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
                      <Mail className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle className="text-base text-zinc-900">Resend Email</CardTitle>
                      <CardDescription className="text-xs text-zinc-500">Transactional and follow-up emails</CardDescription>
                    </div>
                  </div>
                  <Badge variant={isConnected ? 'success' : isDemoMode ? 'secondary' : 'warning'}>
                    {isConnected ? 'Connected' : isDemoMode ? 'Demo Simulator' : 'Not configured'}
                  </Badge>
                </CardHeader>
                <CardContent className="pt-2 space-y-3 text-xs">
                  <p className="text-zinc-600 leading-relaxed">
                    Sends automated follow-up emails, AI responses, and scheduling links directly to qualified leads.
                  </p>

                  <div className="rounded-lg bg-zinc-50 border border-zinc-200 p-3 space-y-1.5 font-mono text-[11px]">
                    <div className="flex items-center justify-between text-zinc-700">
                      <span className="text-zinc-500 font-sans">Sender address:</span>
                      <span className="text-zinc-900 font-medium truncate">{conn?.settings?.from_email || 'onboarding@resend.dev'}</span>
                    </div>
                    {conn?.masked_key && (
                      <div className="flex items-center justify-between text-zinc-700">
                        <span className="text-zinc-500 font-sans">API key:</span>
                        <span className="text-zinc-900">{conn.masked_key}</span>
                      </div>
                    )}
                    {conn?.last_tested_at && (
                      <div className="flex items-center justify-between text-zinc-500 text-[10px]">
                        <span className="text-zinc-500 font-sans">Last verified:</span>
                        <span className="tabular-nums">{new Date(conn.last_tested_at).toLocaleString()}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </div>

              <div className="p-4 pt-0 border-t border-zinc-100 mt-4 flex items-center justify-between gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleTestDelivery('resend')}
                  disabled={isPending || testingProvider === 'resend'}
                  className="text-xs h-8 gap-1.5"
                >
                  <Send className={`h-3 w-3 ${testingProvider === 'resend' ? 'animate-spin' : ''}`} />
                  <span>{testingProvider === 'resend' ? 'Sending...' : 'Test email'}</span>
                </Button>

                <div className="flex items-center gap-2">
                  {isConnected && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDisconnect('resend')}
                      className="text-xs h-8 px-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleOpenConfig('resend')}
                    className="text-xs h-8 gap-1"
                  >
                    <Sliders className="h-3 w-3" />
                    <span>{isConnected ? 'Edit credentials' : 'Configure Resend'}</span>
                  </Button>
                </div>
              </div>
            </Card>
          );
        })()}

        {/* 2. Slack Incoming Webhooks */}
        {(() => {
          const conn = getConnection('slack');
          const isConnected = !!conn && conn.is_active;
          return (
            <Card className="flex flex-col justify-between">
              <div>
                <CardHeader className="flex flex-row items-start justify-between pb-2">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
                      <MessageSquare className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle className="text-base text-zinc-900">Slack Notifications</CardTitle>
                      <CardDescription className="text-xs text-zinc-500">Team notifications and lead alerts</CardDescription>
                    </div>
                  </div>
                  <Badge variant={isConnected ? 'success' : isDemoMode ? 'secondary' : 'warning'}>
                    {isConnected ? 'Connected' : isDemoMode ? 'Demo Simulator' : 'Not configured'}
                  </Badge>
                </CardHeader>
                <CardContent className="pt-2 space-y-3 text-xs">
                  <p className="text-zinc-600 leading-relaxed">
                    Posts lead notifications, qualification scores, and CRM links directly into your team Slack channels.
                  </p>

                  <div className="rounded-lg bg-zinc-50 border border-zinc-200 p-3 space-y-1.5 font-mono text-[11px]">
                    <div className="flex items-center justify-between text-zinc-700">
                      <span className="text-zinc-500 font-sans">Channel target:</span>
                      <span className="text-zinc-900 font-medium">{conn?.settings?.channel || '#leads-notifications'}</span>
                    </div>
                    {conn?.masked_key && (
                      <div className="flex items-center justify-between text-zinc-700">
                        <span className="text-zinc-500 font-sans">Webhook URL:</span>
                        <span className="text-zinc-900">hooks.slack.com/...{conn.masked_key.slice(-6)}</span>
                      </div>
                    )}
                    {conn?.last_tested_at && (
                      <div className="flex items-center justify-between text-zinc-500 text-[10px]">
                        <span className="text-zinc-500 font-sans">Last verified:</span>
                        <span className="tabular-nums">{new Date(conn.last_tested_at).toLocaleString()}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </div>

              <div className="p-4 pt-0 border-t border-zinc-100 mt-4 flex items-center justify-between gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleTestDelivery('slack')}
                  disabled={isPending || testingProvider === 'slack'}
                  className="text-xs h-8 gap-1.5"
                >
                  <Send className={`h-3 w-3 ${testingProvider === 'slack' ? 'animate-spin' : ''}`} />
                  <span>{testingProvider === 'slack' ? 'Posting...' : 'Test Slack alert'}</span>
                </Button>

                <div className="flex items-center gap-2">
                  {isConnected && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDisconnect('slack')}
                      className="text-xs h-8 px-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleOpenConfig('slack')}
                    className="text-xs h-8 gap-1"
                  >
                    <Sliders className="h-3 w-3" />
                    <span>{isConnected ? 'Edit webhook' : 'Configure Slack'}</span>
                  </Button>
                </div>
              </div>
            </Card>
          );
        })()}
      </div>

      {/* Test Execution Diagnostic Toast / Banner */}
      {testResult && (
        <div
          className={`p-4 rounded-xl border text-xs space-y-1 ${
            testResult.success
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-red-50 border-red-200 text-red-900'
          }`}
        >
          <div className="flex items-center justify-between font-semibold">
            <span className="flex items-center gap-1.5">
              {testResult.success ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : <AlertCircle className="h-4 w-4 text-red-600" />}
              <span>{testResult.success ? 'Delivery verification succeeded' : 'Delivery verification failed'}</span>
            </span>
            <button onClick={() => setTestResult(null)} className="text-[11px] underline text-zinc-600 hover:text-zinc-900">
              Close
            </button>
          </div>
          <p className="text-zinc-700 font-mono text-[11px]">{testResult.message}</p>
        </div>
      )}

      {/* Modal for configuring credentials */}
      <Dialog
        isOpen={!!activeModal}
        onClose={() => setActiveModal(null)}
        title={`Configure ${activeModal === 'resend' ? 'Resend API' : 'Slack Webhook'}`}
        description="Credentials are encrypted server-side with AES-256-GCM and never exposed to client browsers."
      >
        <form onSubmit={handleSaveConnection} className="space-y-4 text-xs">
          {activeModal === 'resend' && (
            <>
              <div className="space-y-1.5">
                <label className="text-zinc-700 font-medium">Resend API key (re_...)</label>
                <input
                  type="password"
                  required
                  placeholder="re_1234567890abcdef..."
                  value={secretKeyInput}
                  onChange={(e) => setSecretKeyInput(e.target.value)}
                  className="w-full bg-white border border-zinc-300 rounded-lg px-3 py-2 text-zinc-900 font-mono text-xs focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-zinc-700 font-medium">Verified from address</label>
                <input
                  type="text"
                  value={fromEmailInput}
                  onChange={(e) => setFromEmailInput(e.target.value)}
                  placeholder="FlowPilot AI <onboarding@resend.dev>"
                  className="w-full bg-white border border-zinc-300 rounded-lg px-3 py-2 text-zinc-900 text-xs focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-zinc-700 font-medium">Test recipient (optional)</label>
                <input
                  type="email"
                  value={testRecipientInput}
                  onChange={(e) => setTestRecipientInput(e.target.value)}
                  placeholder="test-inbox@yourcompany.com"
                  className="w-full bg-white border border-zinc-300 rounded-lg px-3 py-2 text-zinc-900 text-xs focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </>
          )}

          {activeModal === 'slack' && (
            <>
              <div className="space-y-1.5">
                <label className="text-zinc-700 font-medium">Incoming webhook URL</label>
                <input
                  type="password"
                  required
                  placeholder="https://hooks.slack.com/services/T00/B00/XXXX"
                  value={secretKeyInput}
                  onChange={(e) => setSecretKeyInput(e.target.value)}
                  className="w-full bg-white border border-zinc-300 rounded-lg px-3 py-2 text-zinc-900 font-mono text-xs focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
                <span className="text-[11px] text-zinc-500 block">Must begin with https://hooks.slack.com/services/</span>
              </div>

              <div className="space-y-1.5">
                <label className="text-zinc-700 font-medium">Slack channel name</label>
                <input
                  type="text"
                  value={slackChannelInput}
                  onChange={(e) => setSlackChannelInput(e.target.value)}
                  placeholder="#leads-notifications"
                  className="w-full bg-white border border-zinc-300 rounded-lg px-3 py-2 text-zinc-900 text-xs focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </>
          )}

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setActiveModal(null)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isPending || !secretKeyInput.trim()}
            >
              <span>{isPending ? 'Saving...' : 'Save and encrypt'}</span>
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Action Attempts Audit Log */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-zinc-900 flex items-center gap-2">
            <Clock className="h-4 w-4 text-zinc-500" />
            <span>Recent integration activity ({recentAttempts.length})</span>
          </h3>
        </div>

        <div className="rounded-xl border border-zinc-200 bg-white overflow-hidden shadow-sm">
          <table className="w-full text-left text-xs text-zinc-700">
            <thead className="border-b border-zinc-200 bg-zinc-50 text-zinc-500 font-medium">
              <tr>
                <th className="px-4 py-3">Action type</th>
                <th className="px-4 py-3">Target / recipient</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Message ID</th>
                <th className="px-4 py-3">Latency</th>
                <th className="px-4 py-3 text-right">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {recentAttempts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-zinc-500">
                    No integration actions recorded yet.
                  </td>
                </tr>
              ) : (
                recentAttempts.map((attempt) => (
                  <tr key={attempt.id} className="hover:bg-zinc-50/60 transition-colors">
                    <td className="px-4 py-3 font-medium text-zinc-900">
                      <span className="capitalize">{attempt.action_type.replace(/_/g, ' ')}</span>
                    </td>
                    <td className="px-4 py-3 font-mono text-[11px] text-zinc-600">
                      {attempt.recipient_or_target || '—'}
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        variant={
                          attempt.status === 'delivered' || attempt.status === 'submitted'
                            ? 'success'
                            : attempt.status === 'simulated'
                            ? 'secondary'
                            : 'destructive'
                        }
                      >
                        {attempt.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 font-mono text-[10px] text-zinc-500 truncate max-w-[140px]">
                      {attempt.provider_message_id || '—'}
                    </td>
                    <td className="px-4 py-3 font-mono text-[11px] text-zinc-500 tabular-nums">
                      {attempt.latency_ms !== null ? `${attempt.latency_ms}ms` : '—'}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-[11px] text-zinc-500 tabular-nums">
                      {new Date(attempt.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

