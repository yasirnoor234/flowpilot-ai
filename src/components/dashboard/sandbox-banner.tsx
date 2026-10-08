'use client';

import React, { useState } from 'react';
import { Sparkles, RefreshCw, AlertTriangle, CheckCircle2 } from 'lucide-react';
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
        setMessage('Demo leads reset successfully!');
        setTimeout(() => setMessage(null), 4000);
      } else {
        setMessage(`Reset failed: ${res.error}`);
      }
    } catch {
      setMessage('Failed to reset demo data.');
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="bg-amber-950/40 border-b border-amber-800/60 px-6 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs">
      <div className="flex items-center gap-2.5 text-amber-200">
        <div className="p-1 rounded bg-amber-500/20 text-amber-400">
          <Sparkles className="h-3.5 w-3.5" />
        </div>
        <div>
          <span className="font-semibold text-amber-100">Sandbox Demo Mode Active:</span>
          <span className="ml-1.5 text-amber-300/80">
            Outbound emails and Slack notifications use safe mock adapters. Real workspace data is strictly isolated.
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {message && (
          <span className="text-[11px] text-emerald-400 flex items-center gap-1 font-medium">
            <CheckCircle2 className="h-3.5 w-3.5" />
            {message}
          </span>
        )}
        <button
          onClick={handleReset}
          disabled={isResetting}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-amber-900/60 hover:bg-amber-800/80 border border-amber-700/60 text-amber-200 text-xs font-medium transition-colors disabled:opacity-50"
          title="Refresh synthetic sample leads and clear temporary demo runs"
        >
          <RefreshCw className={`h-3 w-3 ${isResetting ? 'animate-spin' : ''}`} />
          <span>{isResetting ? 'Resetting...' : 'Reset Demo Data'}</span>
        </button>
      </div>
    </div>
  );
}
