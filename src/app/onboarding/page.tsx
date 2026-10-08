'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { createWorkspaceAction } from '@/lib/actions/workspaces';
import { AlertCircle, ArrowRight, Building2, CheckCircle2, Workflow } from 'lucide-react';
import Link from 'next/link';

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
    <div className="min-h-screen bg-[#FAFAF8] text-zinc-900 flex flex-col justify-center items-center p-4 selection:bg-indigo-500 selection:text-white">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2.5 mb-6">
            <div className="h-9 w-9 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-sm">
              <Workflow className="h-5 w-5" />
            </div>
            <span className="text-xl font-bold tracking-tight text-zinc-900">
              FlowPilot <span className="text-indigo-600 font-semibold">AI</span>
            </span>
          </Link>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900">
            Name your workspace
          </h1>
          <p className="text-sm text-zinc-500 mt-1.5">
            Workspaces keep your workflows, leads, and connected tools organized.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center gap-2 text-zinc-900">
              <Building2 className="h-4 w-4 text-zinc-500" />
              <span>Workspace setup</span>
            </CardTitle>
            <CardDescription className="text-xs text-zinc-500">
              You will be assigned as the Workspace Owner with full administrative controls.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-800">
                  <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
                  <span>{error}</span>
                </div>
              )}

              <Input
                id="name"
                name="name"
                type="text"
                label="Organization or Company Name"
                placeholder="Acme Revenue Systems"
                required
                defaultValue="My Company Workspace"
                helperText="You can invite team members and add integrations after setup."
              />

              <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3.5 text-xs text-zinc-600 space-y-2">
                <div className="font-medium text-zinc-900">Included in your workspace:</div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                  <span>Isolated workspace data and permissions</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                  <span>Lead capture and CRM pipeline</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                  <span>Automated email, Slack, and AI qualification actions</span>
                </div>
              </div>

              <Button type="submit" className="w-full mt-4" size="lg" isLoading={loading}>
                <span>Launch workspace</span>
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

