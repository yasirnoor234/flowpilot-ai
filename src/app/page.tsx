import React from 'react';
import Link from 'next/link';
import { getCurrentUser, getActiveWorkspaceContext } from '@/lib/auth/workspace-context';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ArrowRight,
  CheckCircle2,
  Sparkles,
  Zap,
  Bot,
  Mail,
  MessageSquare,
  Clock,
  Shield,
  Layers,
  Activity,
  FileText,
  Workflow,
  HelpCircle,
  Menu,
  X,
  ExternalLink,
} from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const user = await getCurrentUser();
  const context = user ? await getActiveWorkspaceContext() : null;

  return (
    <div className="min-h-screen bg-[#FAFAF8] text-zinc-900 flex flex-col font-sans selection:bg-indigo-100 selection:text-indigo-900">
      {/* Navigation */}
      <header className="sticky top-0 z-40 w-full border-b border-zinc-200/80 bg-[#FAFAF8]/90 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-xs">
              <Workflow className="h-4 w-4" />
            </div>
            <span className="text-base font-semibold tracking-tight text-zinc-900">
              FlowPilot <span className="text-indigo-600 font-normal">AI</span>
            </span>
          </Link>

          {/* Desktop Links */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-zinc-600">
            <a href="#features" className="hover:text-zinc-900 transition-colors">
              Features
            </a>
            <a href="#how-it-works" className="hover:text-zinc-900 transition-colors">
              How It Works
            </a>
            <a href="#templates" className="hover:text-zinc-900 transition-colors">
              Templates
            </a>
            <a href="#faq" className="hover:text-zinc-900 transition-colors">
              FAQ
            </a>
          </nav>

          {/* Action CTAs */}
          <div className="flex items-center gap-3">
            {user ? (
              <Link href="/overview">
                <Button size="sm">
                  <span>Open Workspace</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            ) : (
              <>
                <Link href="/login" className="hidden sm:inline-flex">
                  <Button variant="ghost" size="sm">
                    Sign In
                  </Button>
                </Link>
                <Link href="/signup">
                  <Button size="sm">
                    <span>Get started</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-16 pb-20 sm:pt-24 sm:pb-28 border-b border-zinc-200/80 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            {/* Left Column: Value Proposition */}
            <div className="lg:col-span-6 space-y-6 text-left">
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-medium">
                <span className="flex h-1.5 w-1.5 rounded-full bg-indigo-600" />
                <span>Autonomous Lead & Follow-up Platform</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-[52px] font-bold tracking-tight text-zinc-900 leading-[1.15]">
                Capture every lead.
                <br />
                <span className="text-indigo-600">Keep every follow-up moving.</span>
              </h1>

              <p className="text-base sm:text-lg text-zinc-600 leading-relaxed max-w-xl">
                Connect lead capture, AI qualification, your CRM, and team notifications in one visual workflow.
              </p>

              <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <Link href={user ? '/overview' : '/signup'}>
                  <Button size="lg" className="w-full sm:w-auto shadow-sm">
                    <span>Get started</span>
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <a href="#how-it-works">
                  <Button variant="outline" size="lg" className="w-full sm:w-auto">
                    <span>Explore the demo</span>
                  </Button>
                </a>
              </div>

              <div className="pt-4 flex items-center gap-6 text-xs text-zinc-500">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  No code required
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  Real-time CRM sync
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  Durable delays
                </span>
              </div>
            </div>

            {/* Right Column: Illustrative Product Preview */}
            <div className="lg:col-span-6">
              <div className="rounded-xl border border-zinc-200 bg-[#FAFAF8] p-5 shadow-sm space-y-3.5">
                <div className="flex items-center justify-between pb-3 border-b border-zinc-200">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-zinc-800">Lead Pipeline Flow</span>
                    <Badge variant="muted" size="sm">Active</Badge>
                  </div>
                  <span className="text-[11px] font-medium text-zinc-400">Illustrative Preview</span>
                </div>

                {/* Step 1: Lead Intake */}
                <div className="p-3 rounded-lg bg-white border border-zinc-200/80 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-7 w-7 rounded-md bg-zinc-100 flex items-center justify-center text-zinc-600 text-xs font-medium">1</div>
                    <div>
                      <div className="text-xs font-medium text-zinc-900">Lead Received via Webhook</div>
                      <div className="text-[11px] text-zinc-500">sarah@skydefense.ai ($45k budget)</div>
                    </div>
                  </div>
                  <Badge variant="success" size="sm">Received</Badge>
                </div>

                {/* Step 2: AI Qualification */}
                <div className="p-3 rounded-lg bg-white border border-zinc-200/80 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-7 w-7 rounded-md bg-indigo-50 flex items-center justify-center text-indigo-600 text-xs font-medium">2</div>
                    <div>
                      <div className="text-xs font-medium text-zinc-900">AI Qualification (GPT-4o)</div>
                      <div className="text-[11px] text-zinc-500">Score 94/100 · Tier: HOT · High Intent</div>
                    </div>
                  </div>
                  <Badge variant="primary" size="sm">Qualified</Badge>
                </div>

                {/* Step 3: CRM Record Sync */}
                <div className="p-3 rounded-lg bg-white border border-zinc-200/80 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-7 w-7 rounded-md bg-zinc-100 flex items-center justify-center text-zinc-600 text-xs font-medium">3</div>
                    <div>
                      <div className="text-xs font-medium text-zinc-900">CRM Record Updated</div>
                      <div className="text-[11px] text-zinc-500">Contact created with activity history</div>
                    </div>
                  </div>
                  <Badge variant="success" size="sm">Synced</Badge>
                </div>

                {/* Step 4: Email & Slack */}
                <div className="p-3 rounded-lg bg-white border border-zinc-200/80 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-7 w-7 rounded-md bg-zinc-100 flex items-center justify-center text-zinc-600 text-xs font-medium">4</div>
                    <div>
                      <div className="text-xs font-medium text-zinc-900">Email Response & Team Alert</div>
                      <div className="text-[11px] text-zinc-500">Confirmation sent · Slack #hot-leads pinged</div>
                    </div>
                  </div>
                  <Badge variant="success" size="sm">Dispatched</Badge>
                </div>

                {/* Step 5: Follow-up Timer */}
                <div className="p-3 rounded-lg bg-white border border-zinc-200/80 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-7 w-7 rounded-md bg-amber-50 flex items-center justify-center text-amber-700 text-xs font-medium">5</div>
                    <div>
                      <div className="text-xs font-medium text-zinc-900">24-Hour Follow-up Check</div>
                      <div className="text-[11px] text-zinc-500">Re-reads CRM status before sending reminder</div>
                    </div>
                  </div>
                  <Badge variant="warning" size="sm">Waiting</Badge>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Integration Strip */}
      <section className="py-10 border-b border-zinc-200/80 bg-[#FAFAF8]">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-6">
            Works with your existing tools
          </p>
          <div className="flex flex-wrap items-center justify-center gap-8 sm:gap-14 text-zinc-600">
            <div className="flex items-center gap-2 font-medium text-sm">
              <Bot className="h-4 w-4 text-indigo-600" />
              <span>OpenAI GPT-4o</span>
            </div>
            <div className="flex items-center gap-2 font-medium text-sm">
              <Mail className="h-4 w-4 text-zinc-800" />
              <span>Resend Email</span>
            </div>
            <div className="flex items-center gap-2 font-medium text-sm">
              <MessageSquare className="h-4 w-4 text-emerald-600" />
              <span>Slack Incoming Webhooks</span>
            </div>
            <div className="flex items-center gap-2 font-medium text-sm">
              <Zap className="h-4 w-4 text-amber-600" />
              <span>Custom Webhooks</span>
            </div>
          </div>
        </div>
      </section>

      {/* Product Walkthrough */}
      <section id="features" className="py-20 border-b border-zinc-200/80 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-14 space-y-3">
            <h2 className="text-3xl font-bold tracking-tight text-zinc-900">
              Build the process once. Follow every run.
            </h2>
            <p className="text-base text-zinc-600 leading-relaxed">
              Design multi-step business logic visually with drag-and-drop nodes. Every execution is audited with full input and output visibility.
            </p>
          </div>

          <div className="rounded-xl border border-zinc-200 bg-[#FAFAF8] p-6 shadow-sm">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Node palette column */}
              <div className="lg:col-span-3 bg-white p-4 rounded-lg border border-zinc-200 space-y-3">
                <div className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Available Steps</div>
                <div className="space-y-2 text-xs">
                  <div className="p-2 rounded bg-zinc-50 border border-zinc-200 text-zinc-700 font-medium">Inbound Webhook</div>
                  <div className="p-2 rounded bg-indigo-50 border border-indigo-100 text-indigo-700 font-medium">AI Qualification</div>
                  <div className="p-2 rounded bg-zinc-50 border border-zinc-200 text-zinc-700 font-medium">CRM Upsert</div>
                  <div className="p-2 rounded bg-zinc-50 border border-zinc-200 text-zinc-700 font-medium">IF / ELSE Branch</div>
                  <div className="p-2 rounded bg-zinc-50 border border-zinc-200 text-zinc-700 font-medium">Email Dispatch</div>
                  <div className="p-2 rounded bg-zinc-50 border border-zinc-200 text-zinc-700 font-medium">Slack Alert</div>
                  <div className="p-2 rounded bg-amber-50 border border-amber-100 text-amber-800 font-medium">Durable Delay</div>
                </div>
              </div>

              {/* Canvas diagram preview */}
              <div className="lg:col-span-9 bg-white p-5 rounded-lg border border-zinc-200 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
                  <div>
                    <h4 className="text-sm font-semibold text-zinc-900">Lead Intake & Priority Routing</h4>
                    <p className="text-xs text-zinc-500">Published Version 1 · 8 Nodes · Trigger: Webhook</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="success" size="sm">Published & Active</Badge>
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-zinc-50/70 border border-zinc-200/60 font-mono text-xs text-zinc-700 space-y-2">
                  <div className="text-zinc-500 font-sans font-medium text-xs">Configuration Inspector: AI Qualification</div>
                  <div className="bg-white p-3 rounded border border-zinc-200 space-y-1">
                    <div><span className="text-zinc-400">Model:</span> gpt-4o-mini</div>
                    <div><span className="text-zinc-400">Prompt:</span> Analyze lead interest: {'{{trigger.message}}'}</div>
                    <div><span className="text-zinc-400">Target Output:</span> score, priority_tier, suggested_action</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Three Benefit Sections */}
      <section className="py-20 border-b border-zinc-200/80 bg-[#FAFAF8] space-y-20">
        <div className="max-w-6xl mx-auto px-6">
          {/* Benefit 1 */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            <div className="lg:col-span-6 space-y-4 text-left">
              <div className="h-8 w-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                <Sparkles className="h-4 w-4" />
              </div>
              <h3 className="text-2xl font-bold tracking-tight text-zinc-900">
                1. Qualify incoming leads automatically
              </h3>
              <p className="text-sm sm:text-base text-zinc-600 leading-relaxed">
                Evaluate every inquiry the moment it arrives. FlowPilot uses structured AI evaluation to score budget, urgency, and fit from 0 to 100 before updating your CRM.
              </p>
              <ul className="space-y-2 text-sm text-zinc-600 pt-2">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  Categorize inquiries into priority tiers (Hot, Warm, Cool).
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  Generate concise executive summaries and suggested next steps.
                </li>
              </ul>
            </div>
            <div className="lg:col-span-6">
              <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-xs space-y-3">
                <div className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">AI Evaluation Result</div>
                <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
                  <span className="text-sm font-semibold text-zinc-900">CyberDynamix AI Inquiry</span>
                  <Badge variant="success" size="sm">Score: 94 / 100</Badge>
                </div>
                <p className="text-xs text-zinc-600 leading-relaxed">
                  "Prospect has a defined budget ($45,000) and immediate timeline. Recommended next action: Schedule solutions call within 2 hours."
                </p>
              </div>
            </div>
          </div>

          {/* Benefit 2 */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center pt-16">
            <div className="lg:col-span-6 order-2 lg:order-1">
              <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-xs space-y-3">
                <div className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Team Notification Card</div>
                <div className="p-3.5 rounded-lg bg-zinc-50 border border-zinc-200/80 space-y-2 text-xs">
                  <div className="font-semibold text-zinc-900">🚨 High-Priority Inbound Lead</div>
                  <div className="text-zinc-600">Elena Rostova from CyberDynamix (Budget: $45,000)</div>
                  <div className="pt-2 flex items-center gap-2">
                    <span className="text-[11px] text-indigo-600 font-medium">View in CRM →</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="lg:col-span-6 space-y-4 text-left order-1 lg:order-2">
              <div className="h-8 w-8 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
                <MessageSquare className="h-4 w-4" />
              </div>
              <h3 className="text-2xl font-bold tracking-tight text-zinc-900">
                2. Respond instantly and alert your team
              </h3>
              <p className="text-sm sm:text-base text-zinc-600 leading-relaxed">
                Send professional confirmation emails through Resend and post formatted Slack cards with direct links to the new CRM lead profile.
              </p>
              <ul className="space-y-2 text-sm text-zinc-600 pt-2">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  Route urgent opportunities straight to designated team channels.
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  Deliver personalized replies matching customer inquiry context.
                </li>
              </ul>
            </div>
          </div>

          {/* Benefit 3 */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center pt-16">
            <div className="lg:col-span-6 space-y-4 text-left">
              <div className="h-8 w-8 rounded-lg bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-700">
                <Clock className="h-4 w-4" />
              </div>
              <h3 className="text-2xl font-bold tracking-tight text-zinc-900">
                3. Keep follow-ups moving on schedule
              </h3>
              <p className="text-sm sm:text-base text-zinc-600 leading-relaxed">
                Never let an inquiry stall. Durable delay timers wait 24 hours or 3 days, then re-check the lead's live status in your database before sending reminders.
              </p>
              <ul className="space-y-2 text-sm text-zinc-600 pt-2">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  Automatically skips follow-ups if the deal was already won or closed.
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  Survives server restarts and deployments with zero dropped runs.
                </li>
              </ul>
            </div>
            <div className="lg:col-span-6">
              <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-xs space-y-3">
                <div className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Follow-up Eligibility Engine</div>
                <div className="p-3.5 rounded-lg bg-emerald-50/60 border border-emerald-200/60 space-y-1.5 text-xs text-emerald-900">
                  <div className="font-semibold">✓ Live Lead Re-Check Passed</div>
                  <div className="text-[11px] text-emerald-800 leading-relaxed">
                    Lead status is "Contacted" — Deal remains active. Follow-up reminder scheduled for Account Executive.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 border-b border-zinc-200/80 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-14 space-y-3">
            <h2 className="text-3xl font-bold tracking-tight text-zinc-900">
              How FlowPilot Works
            </h2>
            <p className="text-base text-zinc-600 leading-relaxed">
              Launch enterprise-grade automations in three straightforward steps.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 rounded-xl border border-zinc-200 bg-[#FAFAF8] space-y-3 text-left">
              <div className="h-8 w-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center text-sm font-bold">1</div>
              <h4 className="text-base font-semibold text-zinc-900">Choose a template</h4>
              <p className="text-xs text-zinc-600 leading-relaxed">
                Start from an established workflow template or configure custom triggers, conditions, and actions on the visual canvas.
              </p>
            </div>

            <div className="p-6 rounded-xl border border-zinc-200 bg-[#FAFAF8] space-y-3 text-left">
              <div className="h-8 w-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center text-sm font-bold">2</div>
              <h4 className="text-base font-semibold text-zinc-900">Connect your tools</h4>
              <p className="text-xs text-zinc-600 leading-relaxed">
                Connect your OpenAI, Resend, and Slack credentials or test with built-in sandbox demo adapters without external dependencies.
              </p>
            </div>

            <div className="p-6 rounded-xl border border-zinc-200 bg-[#FAFAF8] space-y-3 text-left">
              <div className="h-8 w-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center text-sm font-bold">3</div>
              <h4 className="text-base font-semibold text-zinc-900">Publish and monitor</h4>
              <p className="text-xs text-zinc-600 leading-relaxed">
                Publish immutable workflow versions and track execution logs, step durations, and sanitized outputs in real time.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Workflow Templates Section */}
      <section id="templates" className="py-20 border-b border-zinc-200/80 bg-[#FAFAF8]">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-14 space-y-3">
            <h2 className="text-3xl font-bold tracking-tight text-zinc-900">
              Prebuilt Workflow Templates
            </h2>
            <p className="text-base text-zinc-600 leading-relaxed">
              Instantiate editable drafts tailored for high-impact business processes.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Template 1 */}
            <div className="p-6 rounded-xl border border-zinc-200 bg-white shadow-xs space-y-4 flex flex-col justify-between text-left">
              <div className="space-y-2.5">
                <Badge variant="primary" size="sm">Lead Capture</Badge>
                <h4 className="text-base font-semibold text-zinc-900">Lead Qualification & Response</h4>
                <p className="text-xs text-zinc-600 leading-relaxed">
                  Ingests leads via webhook, performs GPT-4o qualification scoring, synchronizes CRM, routes Slack alerts, dispatches confirmation email, and schedules a 24-hr follow-up.
                </p>
              </div>
              <div className="pt-4 border-t border-zinc-100 flex items-center justify-between text-xs">
                <span className="text-zinc-500 font-medium">OpenAI · Resend · Slack</span>
                <Link href={user ? '/workflows/new?templateId=lead-qualification-and-response' : '/signup'}>
                  <Button size="sm" variant="outline">Use Template</Button>
                </Link>
              </div>
            </div>

            {/* Template 2 */}
            <div className="p-6 rounded-xl border border-zinc-200 bg-white shadow-xs space-y-4 flex flex-col justify-between text-left">
              <div className="space-y-2.5">
                <Badge variant="secondary" size="sm">Customer Support</Badge>
                <h4 className="text-base font-semibold text-zinc-900">Customer Inquiry Routing</h4>
                <p className="text-xs text-zinc-600 leading-relaxed">
                  Categorizes incoming questions into billing, technical, or sales inquiries using AI and routes notification cards to the appropriate team channel.
                </p>
              </div>
              <div className="pt-4 border-t border-zinc-100 flex items-center justify-between text-xs">
                <span className="text-zinc-500 font-medium">OpenAI · Slack</span>
                <Link href={user ? '/workflows/new?templateId=customer-inquiry-classification' : '/signup'}>
                  <Button size="sm" variant="outline">Use Template</Button>
                </Link>
              </div>
            </div>

            {/* Template 3 */}
            <div className="p-6 rounded-xl border border-zinc-200 bg-white shadow-xs space-y-4 flex flex-col justify-between text-left">
              <div className="space-y-2.5">
                <Badge variant="warning" size="sm">Sales Pipeline</Badge>
                <h4 className="text-base font-semibold text-zinc-900">Proposal Follow-up Reminder</h4>
                <p className="text-xs text-zinc-600 leading-relaxed">
                  Waits 3 days following proposal submission, re-evaluates lead status from the CRM database, and skips follow-up if already converted or closed.
                </p>
              </div>
              <div className="pt-4 border-t border-zinc-100 flex items-center justify-between text-xs">
                <span className="text-zinc-500 font-medium">CRM Status · Delay · Slack</span>
                <Link href={user ? '/workflows/new?templateId=proposal-followup-reminder' : '/signup'}>
                  <Button size="sm" variant="outline">Use Template</Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Reliability & Operations Section */}
      <section className="py-20 border-b border-zinc-200/80 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-14 space-y-3">
            <h2 className="text-3xl font-bold tracking-tight text-zinc-900">
              Engineered for operational reliability
            </h2>
            <p className="text-base text-zinc-600 leading-relaxed">
              Designed from the ground up to protect your customer relationships and data integrity.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-left">
            <div className="p-5 rounded-xl border border-zinc-200 bg-[#FAFAF8] space-y-2">
              <Activity className="h-5 w-5 text-indigo-600" />
              <h5 className="text-sm font-semibold text-zinc-900">Track every action</h5>
              <p className="text-xs text-zinc-600 leading-relaxed">
                Inspect every run with full step inputs, outputs, timestamps, and sanitized error messages.
              </p>
            </div>

            <div className="p-5 rounded-xl border border-zinc-200 bg-[#FAFAF8] space-y-2">
              <Shield className="h-5 w-5 text-indigo-600" />
              <h5 className="text-sm font-semibold text-zinc-900">Workspace data protection</h5>
              <p className="text-xs text-zinc-600 leading-relaxed">
                Strict multi-tenant isolation ensures data and workflows are accessible only to authorized workspace members.
              </p>
            </div>

            <div className="p-5 rounded-xl border border-zinc-200 bg-[#FAFAF8] space-y-2">
              <Clock className="h-5 w-5 text-indigo-600" />
              <h5 className="text-sm font-semibold text-zinc-900">Durable execution</h5>
              <p className="text-xs text-zinc-600 leading-relaxed">
                Long-running delays pause and resume reliably without memory leaks or dropped state during deployments.
              </p>
            </div>

            <div className="p-5 rounded-xl border border-zinc-200 bg-[#FAFAF8] space-y-2">
              <Zap className="h-5 w-5 text-indigo-600" />
              <h5 className="text-sm font-semibold text-zinc-900">Encrypted credentials</h5>
              <p className="text-xs text-zinc-600 leading-relaxed">
                API keys and webhook secrets are encrypted at rest with AES-256-GCM and never exposed to the client.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-20 border-b border-zinc-200/80 bg-[#FAFAF8]">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-14 space-y-3">
            <h2 className="text-3xl font-bold tracking-tight text-zinc-900">
              Frequently Asked Questions
            </h2>
            <p className="text-base text-zinc-600 leading-relaxed">
              Clear answers about FlowPilot capabilities, integrations, and setup.
            </p>
          </div>

          <div className="space-y-4 text-left">
            <div className="p-5 rounded-xl border border-zinc-200 bg-white space-y-2">
              <h5 className="text-sm font-semibold text-zinc-900">What does FlowPilot AI automate?</h5>
              <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed">
                FlowPilot automates inbound lead qualification, customer inquiry classification, CRM contact creation, transactional confirmation emails, team Slack alerts, and scheduled follow-up sequences.
              </p>
            </div>

            <div className="p-5 rounded-xl border border-zinc-200 bg-white space-y-2">
              <h5 className="text-sm font-semibold text-zinc-900">Do I need coding experience to build workflows?</h5>
              <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed">
                No. You can build, configure, and publish complete workflows visually using prebuilt nodes, or customize one of the pre-configured production templates.
              </p>
            </div>

            <div className="p-5 rounded-xl border border-zinc-200 bg-white space-y-2">
              <h5 className="text-sm font-semibold text-zinc-900">Which integrations are supported?</h5>
              <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed">
                FlowPilot natively supports OpenAI (GPT-4o), Resend for transactional email, Slack incoming webhooks, and public authenticated HTTP webhook endpoints for form intake.
              </p>
            </div>

            <div className="p-5 rounded-xl border border-zinc-200 bg-white space-y-2">
              <h5 className="text-sm font-semibold text-zinc-900">How do I inspect failed workflow runs?</h5>
              <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed">
                The Runs page displays a complete execution timeline for every workflow run. You can inspect step-by-step inputs, outputs, duration, and sanitized error messages with one click.
              </p>
            </div>

            <div className="p-5 rounded-xl border border-zinc-200 bg-white space-y-2">
              <h5 className="text-sm font-semibold text-zinc-900">How does demo mode work?</h5>
              <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed">
                Demo workspaces use built-in mock adapters and synthetic sample leads so you can test complete end-to-end pipelines without configuring external API keys or sending real emails.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-20 bg-white border-b border-zinc-200/80 text-center">
        <div className="max-w-4xl mx-auto px-6 space-y-6">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-zinc-900">
            Give your team a clearer way to automate.
          </h2>
          <p className="text-base text-zinc-600 max-w-xl mx-auto leading-relaxed">
            Start qualifying leads and managing follow-ups with intelligent, durable workflows today.
          </p>
          <div className="pt-2">
            <Link href={user ? '/overview' : '/signup'}>
              <Button size="lg" className="shadow-sm">
                <span>Get started</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-[#FAFAF8] text-xs text-zinc-500">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-md bg-indigo-600 flex items-center justify-center text-white text-[10px] font-bold">
              FP
            </div>
            <span className="font-semibold text-zinc-800">FlowPilot AI</span>
            <span>· Built by CodexveTech</span>
          </div>

          <div className="flex items-center gap-6">
            <Link href="/login" className="hover:text-zinc-800 transition-colors">
              Sign In
            </Link>
            <Link href="/signup" className="hover:text-zinc-800 transition-colors">
              Get Started
            </Link>
            <a href="#templates" className="hover:text-zinc-800 transition-colors">
              Templates
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
