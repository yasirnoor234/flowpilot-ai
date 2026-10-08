'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { signInAction } from '@/lib/actions/auth';
import { AlertCircle, ArrowRight } from 'lucide-react';

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    try {
      const result = await signInAction(formData);
      if (result?.error) {
        setError(result.error);
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred during sign in.';
      if (!errorMessage.includes('NEXT_REDIRECT')) {
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="border-zinc-800 bg-zinc-900/70 shadow-2xl backdrop-blur-xl">
      <CardHeader>
        <CardTitle className="text-xl font-bold text-white">Welcome back</CardTitle>
        <CardDescription>
          Enter your credentials to access your automation workspace.
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

          <div className="space-y-1">
            <Input
              id="email"
              name="email"
              type="email"
              label="Work Email"
              placeholder="name@company.com"
              required
              autoComplete="email"
            />
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label
                htmlFor="password"
                className="block text-xs font-medium uppercase tracking-wider text-zinc-400"
              >
                Password
              </label>
              <Link
                href="/forgot-password"
                className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
              >
                Forgot password?
              </Link>
            </div>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="••••••••"
              required
              autoComplete="current-password"
            />
          </div>

          <Button type="submit" className="w-full mt-2" isLoading={loading}>
            <span>Sign In to Workspace</span>
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </form>
      </CardContent>
      <CardFooter className="flex justify-center text-xs text-zinc-400">
        Don&apos;t have an account?{' '}
        <Link href="/signup" className="ml-1 font-medium text-indigo-400 hover:text-indigo-300">
          Sign up
        </Link>
      </CardFooter>
    </Card>
  );
}
