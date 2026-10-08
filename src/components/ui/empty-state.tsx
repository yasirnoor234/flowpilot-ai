import * as React from 'react';
import { cn } from '@/lib/utils';
import { LucideIcon, Inbox } from 'lucide-react';
import { Button } from './button';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  actionHref?: string;
  className?: string;
}

export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  actionLabel,
  onAction,
  actionHref,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex min-h-[320px] flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/30 p-8 text-center transition-all',
        className
      )}
    >
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 mb-4 shadow-inner">
        <Icon className="h-8 w-8 stroke-[1.5]" />
      </div>
      <h3 className="text-lg font-medium text-zinc-100 mb-1">{title}</h3>
      <p className="max-w-md text-sm text-zinc-400 mb-6 leading-relaxed">
        {description}
      </p>
      {actionLabel && (
        <>
          {actionHref ? (
            <a href={actionHref}>
              <Button size="sm">{actionLabel}</Button>
            </a>
          ) : (
            <Button size="sm" onClick={onAction}>
              {actionLabel}
            </Button>
          )}
        </>
      )}
    </div>
  );
}
