'use client';

import React from 'react';
import { ErrorState } from '@/components/ui/error-state';

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="py-12 max-w-lg mx-auto">
      <ErrorState
        title="Workspace Error"
        message={error.message || 'An error occurred while loading the workspace section.'}
        onRetry={reset}
      />
    </div>
  );
}
