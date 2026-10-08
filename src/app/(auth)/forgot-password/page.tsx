'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { resetPasswordAction } from '@/lib/actions/auth';
import { AlertCircle, CheckCircle2, ArrowLeft } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    try {
      const result = await resetPasswordAction(formData);
      if (result?.error) {
        setError(result.error);
      } else if (result?.message) {
        setSuccessMessage(result.message);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="border-zinc-800 bg-zinc-900/70 shadow-2xl backdrop-blur-xl">
      <CardHeader>
        <CardTitle className="text-xl font-bold text-white">Reset Password</CardTitle>
        <CardDescription>
          Enter your email address and we will send you a link to reset your password.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {successMessage ? (
          <div className="space-y-4 text-center py-4">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <h4 className="text-base font-semibold text-zinc-100">Check your inbox</h4>
            <p className="text-xs text-zinc-400 leading-relaxed">
              {successMessage}
            </p>
            <Link href="/login">
              <Button variant="secondary" className="w-full mt-4">
                Back to Sign In
              </Button>
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-400">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <Input
              id="email"
              name="email"
              type="email"
              label="Work Email"
              placeholder="name@company.com"
              required
              autoComplete="email"
            />

            <Button type="submit" className="w-full mt-2" isLoading={loading}>
              Send Reset Link
            </Button>
          </form>
        )}
      </CardContent>
      <CardFooter className="flex justify-center text-xs text-zinc-400">
        <Link href="/login" className="inline-flex items-center gap-1 font-medium text-zinc-400 hover:text-zinc-200">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Sign In
        </Link>
      </CardFooter>
    </Card>
  );
}
