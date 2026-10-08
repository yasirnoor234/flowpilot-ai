import * as React from 'react';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

interface LoadingStateProps {
  message?: string;
  className?: string;
}

export function LoadingState({
  message = 'Loading workspace data...',
  className,
}: LoadingStateProps) {
  return (
    <div
      className={cn(
        'flex min-h-[300px] flex-col items-center justify-center space-y-3 p-8 text-center',
        className
      )}
    >
      <div className="relative flex items-center justify-center">
        <div className="h-10 w-10 rounded-full border-2 border-indigo-500/20 animate-ping absolute" />
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
      </div>
      <p className="text-sm text-zinc-400 font-medium">{message}</p>
    </div>
  );
}
