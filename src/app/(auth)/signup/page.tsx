'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { signUpAction } from '@/lib/actions/auth';
import { AlertCircle, CheckCircle2, ArrowRight } from 'lucide-react';

export default function SignUpPage() {
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
      const result = await signUpAction(formData);
      if (result?.error) {
        setError(result.error);
      } else if (result?.message) {
        setSuccessMessage(result.message);
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred during sign up.';
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
        <CardTitle className="text-xl font-bold text-zinc-900">Create your account</CardTitle>
        <CardDescription className="text-xs text-zinc-500">
          Start automating your lead pipeline with AI workflows.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {successMessage ? (
          <div className="space-y-4 text-center py-4">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 border border-emerald-200 text-emerald-600">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <h4 className="text-base font-semibold text-zinc-900">Verification email sent</h4>
            <p className="text-xs text-zinc-500 leading-relaxed">
              {successMessage}
            </p>
            <Link href="/login">
              <Button variant="outline" className="w-full mt-4">
                Back to sign in
              </Button>
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-800">
                <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
                <span>{error}</span>
              </div>
            )}

            <Input
              id="fullName"
              name="fullName"
              type="text"
              label="Full name"
              placeholder="Alex Morgan"
              required
            />

            <Input
              id="email"
              name="email"
              type="email"
              label="Work email"
              placeholder="alex@company.com"
              required
              autoComplete="email"
            />

            <Input
              id="password"
              name="password"
              type="password"
              label="Password"
              placeholder="Min. 6 characters"
              required
              minLength={6}
              autoComplete="new-password"
            />

            <Button type="submit" className="w-full mt-2" isLoading={loading}>
              <span>Create account</span>
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </form>
        )}
      </CardContent>
      <CardFooter className="flex justify-center text-xs text-zinc-500">
        Already have an account?{' '}
        <Link href="/login" className="ml-1 font-medium text-indigo-600 hover:text-indigo-700">
          Sign in
        </Link>
      </CardFooter>
    </Card>
  );
}

