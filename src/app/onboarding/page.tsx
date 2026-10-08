'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { createWorkspaceAction } from '@/lib/actions/workspaces';
import { AlertCircle, ArrowRight, Building2, Sparkles, CheckCircle2 } from 'lucide-react';

export default function OnboardingPage() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    try {
      const result = await createWorkspaceAction(formData);
      if (result?.error) {
        setError(result.error);
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create workspace.';
      if (!errorMessage.includes('NEXT_REDIRECT')) {
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative min-h-screen bg-zinc-950 text-zinc-100 flex flex-col justify-center items-center p-4 selection:bg-indigo-500 selection:text-white">
      {/* Background Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] rounded-full bg-indigo-600/15 blur-[140px] pointer-events-none" />

      <div className="w-full max-w-lg z-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-4">
            <Sparkles className="h-3.5 w-3.5" /> Workspace Onboarding
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">
            Name your workspace
          </h1>
          <p className="text-sm text-zinc-400 mt-2">
            Workspaces keep your AI workflows, leads, and integration credentials isolated.
          </p>
        </div>

        <Card className="border-zinc-800 bg-zinc-900/80 shadow-2xl backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Building2 className="h-5 w-5 text-indigo-400" />
              <span>Workspace Setup</span>
            </CardTitle>
            <CardDescription>
              You will be assigned as the Workspace Owner with full administrative controls.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-400">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <Input
                id="name"
                name="name"
                type="text"
                label="Organization / Company Name"
                placeholder="Acme Revenue Systems"
                required
                defaultValue="My Company Workspace"
                helperText="You can invite team members and add integrations after setup."
              />

              <div className="rounded-lg border border-zinc-800/80 bg-zinc-950/40 p-3.5 text-xs text-zinc-400 space-y-2">
                <div className="font-medium text-zinc-200">Included in your workspace:</div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                  <span>Row Level Security (RLS) tenant isolation</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                  <span>Built-in CRM & Lead Activity Inbox</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                  <span>Serverless Inngest Durable Workflow Orchestrator</span>
                </div>
              </div>

              <Button type="submit" className="w-full mt-4" size="lg" isLoading={loading}>
                <span>Launch Workspace</span>
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
