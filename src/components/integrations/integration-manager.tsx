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
import {
  Mail,
  MessageSquare,
  Bot,
  Webhook,
  CheckCircle2,
  AlertCircle,
  Clock,
  Send,
  Trash2,
  RefreshCw,
  Key,
  ShieldCheck,
  ExternalLink,
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
  workspaceName,
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
              ? 'bg-emerald-950/30 border border-emerald-500/30 text-emerald-300'
              : 'bg-rose-950/30 border border-rose-500/30 text-rose-300'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
            <span>{feedback.text}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="text-zinc-500 hover:text-zinc-300 text-xs">
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
            <Card className="border-zinc-800 bg-zinc-900/50 flex flex-col justify-between shadow-lg">
              <div>
                <CardHeader className="flex flex-row items-start justify-between pb-2">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-purple-950/40 border border-purple-800/40 flex items-center justify-center text-purple-300 shadow-sm">
                      <Mail className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle className="text-base text-white">Resend Email</CardTitle>
                      <CardDescription className="text-xs">Transactional & AI response emails</CardDescription>
                    </div>
                  </div>
                  <Badge variant={isConnected ? 'success' : isDemoMode ? 'secondary' : 'outline'}>
                    {isConnected ? 'Active & Live' : isDemoMode ? 'Demo Simulator' : 'Configuration Required'}
                  </Badge>
                </CardHeader>
                <CardContent className="pt-2 space-y-3 text-xs">
                  <p className="text-zinc-400 leading-relaxed">
                    Sends automated follow-up emails, AI-drafted responses, and scheduling links directly to qualified leads.
                  </p>

                  <div className="rounded-xl bg-zinc-950/70 border border-zinc-800/80 p-3 space-y-1.5 font-mono text-[11px]">
                    <div className="flex items-center justify-between text-zinc-300">
                      <span className="text-zinc-500">Sender Address:</span>
                      <span className="text-zinc-200 truncate">{conn?.settings?.from_email || 'onboarding@resend.dev'}</span>
                    </div>
                    {conn?.masked_key && (
                      <div className="flex items-center justify-between text-zinc-300">
                        <span className="text-zinc-500">API Key:</span>
                        <span className="text-purple-300">{conn.masked_key}</span>
                      </div>
                    )}
                    {conn?.last_tested_at && (
                      <div className="flex items-center justify-between text-zinc-400 text-[10px]">
                        <span className="text-zinc-500">Last Verified:</span>
                        <span>{new Date(conn.last_tested_at).toLocaleString()}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </div>

              <div className="p-4 pt-0 border-t border-zinc-800/60 mt-4 flex items-center justify-between gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleTestDelivery('resend')}
                  disabled={isPending || testingProvider === 'resend'}
                  className="text-xs h-8 gap-1.5 border-zinc-700 text-zinc-300"
                >
                  <Send className={`h-3 w-3 ${testingProvider === 'resend' ? 'animate-spin' : ''}`} />
                  <span>{testingProvider === 'resend' ? 'Sending...' : 'Test Send Email'}</span>
                </Button>

                <div className="flex items-center gap-2">
                  {isConnected && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDisconnect('resend')}
                      className="text-xs h-8 px-2 text-rose-400 hover:text-rose-300"
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
                    <span>{isConnected ? 'Edit Credentials' : 'Configure Resend'}</span>
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
            <Card className="border-zinc-800 bg-zinc-900/50 flex flex-col justify-between shadow-lg">
              <div>
                <CardHeader className="flex flex-row items-start justify-between pb-2">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-amber-950/40 border border-amber-800/40 flex items-center justify-center text-amber-300 shadow-sm">
                      <MessageSquare className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle className="text-base text-white">Slack Incoming Webhook</CardTitle>
                      <CardDescription className="text-xs">Team notification cards & lead alerts</CardDescription>
                    </div>
                  </div>
                  <Badge variant={isConnected ? 'success' : isDemoMode ? 'secondary' : 'outline'}>
                    {isConnected ? 'Active & Live' : isDemoMode ? 'Demo Simulator' : 'Configuration Required'}
                  </Badge>
                </CardHeader>
                <CardContent className="pt-2 space-y-3 text-xs">
                  <p className="text-zinc-400 leading-relaxed">
                    Posts rich alert cards with lead qualification badges, budget summaries, and one-click lead detail links into Slack.
                  </p>

                  <div className="rounded-xl bg-zinc-950/70 border border-zinc-800/80 p-3 space-y-1.5 font-mono text-[11px]">
                    <div className="flex items-center justify-between text-zinc-300">
                      <span className="text-zinc-500">Channel Target:</span>
                      <span className="text-zinc-200">{conn?.settings?.channel || '#leads-notifications'}</span>
                    </div>
                    {conn?.masked_key && (
                      <div className="flex items-center justify-between text-zinc-300">
                        <span className="text-zinc-500">Webhook URL:</span>
                        <span className="text-amber-300">hooks.slack.com/...{conn.masked_key.slice(-6)}</span>
                      </div>
                    )}
                    {conn?.last_tested_at && (
                      <div className="flex items-center justify-between text-zinc-400 text-[10px]">
                        <span className="text-zinc-500">Last Verified:</span>
                        <span>{new Date(conn.last_tested_at).toLocaleString()}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </div>

              <div className="p-4 pt-0 border-t border-zinc-800/60 mt-4 flex items-center justify-between gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleTestDelivery('slack')}
                  disabled={isPending || testingProvider === 'slack'}
                  className="text-xs h-8 gap-1.5 border-zinc-700 text-zinc-300"
                >
                  <Send className={`h-3 w-3 ${testingProvider === 'slack' ? 'animate-spin' : ''}`} />
                  <span>{testingProvider === 'slack' ? 'Posting...' : 'Send Test Slack Alert'}</span>
                </Button>

                <div className="flex items-center gap-2">
                  {isConnected && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDisconnect('slack')}
                      className="text-xs h-8 px-2 text-rose-400 hover:text-rose-300"
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
                    <span>{isConnected ? 'Edit Webhook' : 'Configure Slack'}</span>
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
          className={`p-4 rounded-2xl border text-xs space-y-1.5 shadow-lg ${
            testResult.success
              ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-300'
              : 'bg-rose-950/20 border-rose-500/30 text-rose-300'
          }`}
        >
          <div className="flex items-center justify-between font-bold">
            <span className="flex items-center gap-1.5">
              {testResult.success ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
              <span>{testResult.success ? 'Delivery Verification Succeeded' : 'Delivery Verification Failed'}</span>
            </span>
            <button onClick={() => setTestResult(null)} className="text-[11px] underline">
              Close
            </button>
          </div>
          <p className="text-zinc-200 font-mono text-[11px]">{testResult.message}</p>
        </div>
      )}

      {/* Modal / Drawer for configuring credentials */}
      {activeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Key className="h-4 w-4 text-purple-400" />
                  <span>Configure {activeModal === 'resend' ? 'Resend API' : 'Slack Webhook'}</span>
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Credentials are encrypted server-side with AES-256-GCM and never exposed to client browsers.
                </p>
              </div>
              <button
                onClick={() => setActiveModal(null)}
                className="text-zinc-400 hover:text-white text-xs font-semibold p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveConnection} className="space-y-4 text-xs">
              {activeModal === 'resend' && (
                <>
                  <div className="space-y-1.5">
                    <label className="text-zinc-300 font-medium">Resend API Key (re_...)</label>
                    <input
                      type="password"
                      required
                      placeholder="re_1234567890abcdef..."
                      value={secretKeyInput}
                      onChange={(e) => setSecretKeyInput(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-zinc-200 font-mono text-xs focus:outline-none focus:border-purple-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-zinc-300 font-medium">Verified From Address</label>
                    <input
                      type="text"
                      value={fromEmailInput}
                      onChange={(e) => setFromEmailInput(e.target.value)}
                      placeholder="FlowPilot AI <onboarding@resend.dev>"
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-zinc-200 text-xs focus:outline-none focus:border-purple-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-zinc-300 font-medium">Demo/Testing Recipient (Optional)</label>
                    <input
                      type="email"
                      value={testRecipientInput}
                      onChange={(e) => setTestRecipientInput(e.target.value)}
                      placeholder="test-inbox@yourcompany.com"
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-zinc-200 text-xs focus:outline-none focus:border-purple-500"
                    />
                  </div>
                </>
              )}

              {activeModal === 'slack' && (
                <>
                  <div className="space-y-1.5">
                    <label className="text-zinc-300 font-medium">Incoming Webhook URL</label>
                    <input
                      type="password"
                      required
                      placeholder="https://hooks.slack.com/services/T00/B00/XXXX"
                      value={secretKeyInput}
                      onChange={(e) => setSecretKeyInput(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-zinc-200 font-mono text-xs focus:outline-none focus:border-purple-500"
                    />
                    <span className="text-[10px] text-zinc-500 block">Must strictly begin with https://hooks.slack.com/services/</span>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-zinc-300 font-medium">Slack Channel Name</label>
                    <input
                      type="text"
                      value={slackChannelInput}
                      onChange={(e) => setSlackChannelInput(e.target.value)}
                      placeholder="#leads-notifications"
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-zinc-200 text-xs focus:outline-none focus:border-purple-500"
                    />
                  </div>
                </>
              )}

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-800">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setActiveModal(null)}
                  className="text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={isPending || !secretKeyInput.trim()}
                  className="text-xs bg-purple-600 hover:bg-purple-500"
                >
                  <span>{isPending ? 'Encrypting & Saving...' : 'Save & Encrypt'}</span>
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Action Attempts Audit Log */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Clock className="h-4 w-4 text-purple-400" />
            <span>Recent Integration Action Logs ({recentAttempts.length})</span>
          </h3>
          <span className="text-[11px] text-zinc-500 font-mono">Durable Execution Audit Trail</span>
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 overflow-hidden shadow-xl">
          <table className="w-full text-left text-xs text-zinc-300">
            <thead className="border-b border-zinc-800 bg-zinc-950/70 text-zinc-400 font-medium">
              <tr>
                <th className="px-4 py-3">Action Type</th>
                <th className="px-4 py-3">Target / Recipient</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Message ID</th>
                <th className="px-4 py-3">Latency</th>
                <th className="px-4 py-3 text-right">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {recentAttempts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-zinc-500">
                    No integration actions executed yet. Trigger a workflow test or test send above.
                  </td>
                </tr>
              ) : (
                recentAttempts.map((attempt) => (
                  <tr key={attempt.id} className="hover:bg-zinc-800/40 transition-colors">
                    <td className="px-4 py-3 font-semibold text-zinc-200">
                      <span className="capitalize">{attempt.action_type.replace('_', ' ')}</span>
                    </td>
                    <td className="px-4 py-3 font-mono text-[11px] text-zinc-300">
                      {attempt.recipient_or_target || '—'}
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        variant={
                          attempt.status === 'delivered' || attempt.status === 'submitted'
                            ? 'success'
                            : attempt.status === 'simulated'
                            ? 'secondary'
                            : 'danger'
                        }
                      >
                        {attempt.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 font-mono text-[10px] text-zinc-400 truncate max-w-[140px]">
                      {attempt.provider_message_id || '—'}
                    </td>
                    <td className="px-4 py-3 font-mono text-[11px] text-zinc-400">
                      {attempt.latency_ms !== null ? `${attempt.latency_ms}ms` : '—'}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-[11px] text-zinc-400">
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
