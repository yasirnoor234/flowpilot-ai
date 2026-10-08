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
    <Card>
      <CardHeader>
        <CardTitle className="text-xl font-bold text-zinc-900">Set new password</CardTitle>
        <CardDescription className="text-xs text-zinc-500">
          Enter your new password below to secure your FlowPilot account.
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
            id="password"
            name="password"
            type="password"
            label="New password"
            placeholder="Min. 6 characters"
            required
            minLength={6}
            autoComplete="new-password"
          />

          <Input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            label="Confirm new password"
            placeholder="••••••••"
            required
            minLength={6}
            autoComplete="new-password"
          />

          <Button type="submit" className="w-full mt-2" isLoading={loading}>
            <span>Update password</span>
          </Button>
        </form>
      </CardContent>
      <CardFooter className="flex justify-center text-xs text-zinc-500">
        <Link href="/login" className="font-medium text-zinc-600 hover:text-zinc-900">
          Cancel and return to sign in
        </Link>
      </CardFooter>
    </Card>
  );
}

