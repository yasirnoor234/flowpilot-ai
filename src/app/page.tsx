import React from 'react';
import Link from 'next/link';
import { getCurrentUser, getActiveWorkspaceContext } from '@/lib/auth/workspace-context';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Bot,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Zap,
} from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const user = await getCurrentUser();
  const context = user ? await getActiveWorkspaceContext() : null;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col selection:bg-indigo-500 selection:text-white">
      {/* Background Ambient Glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-b from-indigo-600/20 via-purple-600/10 to-transparent blur-[140px] pointer-events-none" />

      {/* Navigation Bar */}
      <header className="border-b border-zinc-800/80 bg-zinc-950/60 backdrop-blur-md sticky top-0 z-30 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/25">
              <Bot className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-bold tracking-tight text-white">
              FlowPilot <span className="text-indigo-400 font-medium">AI</span>
            </span>
          </div>

          <div className="flex items-center gap-3">
            {user ? (
              <Link href="/overview">
                <Button size="sm">
                  <span>Go to Workspace ({context?.workspace.name || 'Dashboard'})</span>
                  <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                </Button>
              </Link>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="ghost" size="sm">
                    Sign In
                  </Button>
                </Link>
                <Link href="/signup">
                  <Button size="sm">
                    <span>Get Started</span>
                    <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 max-w-5xl mx-auto px-6 pt-20 pb-16 flex flex-col items-center text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold mb-6">
          <Sparkles className="h-3.5 w-3.5" />
          <span>AI-Native Workflow Engine for Small Businesses</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white max-w-3xl leading-tight">
          Turn incoming leads into revenue with{' '}
          <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            autonomous AI actions
          </span>
        </h1>

        <p className="mt-6 text-base sm:text-lg text-zinc-400 max-w-2xl leading-relaxed">
          FlowPilot AI automatically evaluates inbound leads, scores intent with GPT-4o, synchronizes CRM records, dispatches personalized Resend emails, triggers Slack team alerts, and orchestrates durable multi-day follow-up sequences.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row items-center gap-3">
          <Link href={user ? '/overview' : '/signup'}>
            <Button size="lg" className="px-8 shadow-xl shadow-indigo-500/25">
              <span>Launch Your Workspace</span>
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
          <Link href="/login">
            <Button variant="outline" size="lg">
              <span>Sign In with Existing Account</span>
            </Button>
          </Link>
        </div>

        {/* Feature Visual Preview Card */}
        <div className="mt-16 w-full rounded-2xl border border-zinc-800/80 bg-zinc-900/60 p-6 shadow-2xl backdrop-blur-xl text-left">
          <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-red-500/70" />
              <div className="h-3 w-3 rounded-full bg-yellow-500/70" />
              <div className="h-3 w-3 rounded-full bg-green-500/70" />
              <span className="ml-2 text-xs font-mono text-zinc-400">flowpilot.dag.compiled // Primary Lead Pipeline</span>
            </div>
            <Badge variant="success">Immutable DAG Snapshot</Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-6">
            <div className="rounded-xl border border-zinc-800 bg-zinc-950/70 p-4 space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-indigo-400">
                <Bot className="h-4 w-4" />
                <span>AI Qualification</span>
              </div>
              <p className="text-xs text-zinc-400">
                GPT-4o parses lead budget, timeline, and company size into structured qualification metrics.
              </p>
            </div>

            <div className="rounded-xl border border-zinc-800 bg-zinc-950/70 p-4 space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400">
                <ShieldCheck className="h-4 w-4" />
                <span>Workspace RLS Isolation</span>
              </div>
              <p className="text-xs text-zinc-400">
                Every workflow, lead record, and execution log is strictly isolated by workspace ID with Postgres RLS.
              </p>
            </div>

            <div className="rounded-xl border border-zinc-800 bg-zinc-950/70 p-4 space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-amber-400">
                <Zap className="h-4 w-4" />
                <span>Durable Delays (Inngest)</span>
              </div>
              <p className="text-xs text-zinc-400">
                Pause workflows for 24-72 hours reliably without holding HTTP connections or running fragile timers.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-900 py-6 text-center text-xs text-zinc-500">
        FlowPilot AI © {new Date().getFullYear()} — Enterprise-Grade Small Business Automation
      </footer>
    </div>
  );
}
