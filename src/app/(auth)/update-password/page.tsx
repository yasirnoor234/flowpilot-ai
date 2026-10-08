'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { updatePasswordAction } from '@/lib/actions/auth';
import { AlertCircle } from 'lucide-react';

export default function UpdatePasswordPage() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    try {
      const result = await updatePasswordAction(formData);
      if (result?.error) {
        setError(result.error);
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred while updating password.';
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
        <CardTitle className="text-xl font-bold text-white">Set New Password</CardTitle>
        <CardDescription>
          Enter your new password below to secure your FlowPilot account.
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
            id="password"
            name="password"
            type="password"
            label="New Password"
            placeholder="Min. 6 characters"
            required
            minLength={6}
            autoComplete="new-password"
          />

          <Input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            label="Confirm New Password"
            placeholder="••••••••"
            required
            minLength={6}
            autoComplete="new-password"
          />

          <Button type="submit" className="w-full mt-2" isLoading={loading}>
            <span>Update Password</span>
          </Button>
        </form>
      </CardContent>
      <CardFooter className="flex justify-center text-xs text-zinc-400">
        <Link href="/login" className="font-medium text-zinc-400 hover:text-zinc-200">
          Cancel and return to Sign In
        </Link>
      </CardFooter>
    </Card>
  );
}
