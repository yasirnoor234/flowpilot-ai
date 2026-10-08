'use client';

import React, { useState } from 'react';
import { RefreshCw, CheckCircle2 } from 'lucide-react';
import { resetDemoWorkspaceData } from '@/lib/actions/demo';

interface SandboxBannerProps {
  workspaceId: string;
  isDemoMode: boolean;
}

export function SandboxBanner({ workspaceId, isDemoMode }: SandboxBannerProps) {
  const [isResetting, setIsResetting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  if (!isDemoMode) {
    return null;
  }

  const handleReset = async () => {
    try {
      setIsResetting(true);
      setMessage(null);
      const res = await resetDemoWorkspaceData(workspaceId);
      if (res.success) {
        setMessage('Demo data refreshed');
        setTimeout(() => setMessage(null), 3000);
      } else {
        setMessage(`Reset failed: ${res.error}`);
      }
    } catch {
      setMessage('Failed to reset demo data');
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="bg-amber-50 border-b border-amber-200/80 px-6 sm:px-8 py-2 flex items-center justify-between gap-3 text-xs text-amber-900">
      <div className="flex items-center gap-2">
        <span className="flex h-2 w-2 rounded-full bg-amber-500" />
        <span className="font-medium">Demo mode — actions use sample integrations.</span>
      </div>

      <div className="flex items-center gap-3">
        {message && (
          <span className="text-xs text-emerald-700 font-medium flex items-center gap-1">
            <CheckCircle2 className="h-3.5 w-3.5" />
            {message}
          </span>
        )}
        <button
          onClick={handleReset}
          disabled={isResetting}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white border border-amber-300 hover:bg-amber-100/60 text-amber-900 text-xs font-medium transition-colors cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`h-3 w-3 ${isResetting ? 'animate-spin' : ''}`} />
          <span>{isResetting ? 'Resetting...' : 'Reset demo data'}</span>
        </button>
      </div>
    </div>
  );
}
