'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from './button';

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({
  title = 'Something went wrong',
  message = 'An unexpected error occurred while processing your request.',
  onRetry,
  className,
}: ErrorStateProps) {
  return (
    <div
      className={cn(
        'flex min-h-[300px] flex-col items-center justify-center rounded-2xl border border-red-500/20 bg-red-950/10 p-8 text-center',
        className
      )}
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 mb-4">
        <AlertTriangle className="h-7 w-7" />
      </div>
      <h3 className="text-lg font-semibold text-zinc-100 mb-1">{title}</h3>
      <p className="max-w-md text-sm text-zinc-400 mb-6 leading-relaxed">
        {message}
      </p>
      {onRetry && (
        <Button variant="secondary" size="sm" onClick={onRetry}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Try Again
        </Button>
      )}
    </div>
  );
}
