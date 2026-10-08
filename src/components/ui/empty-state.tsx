import React from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  actionLabel,
  actionHref,
  onAction,
  className = '',
}: EmptyStateProps) {
  return (
    <Card className={`p-8 sm:p-12 text-center flex flex-col items-center justify-center ${className}`}>
      {icon && (
        <div className="h-12 w-12 rounded-xl bg-zinc-50 border border-zinc-200 flex items-center justify-center text-zinc-500 mb-4">
          {icon}
        </div>
      )}
      <h3 className="text-base font-semibold text-zinc-900 mb-1.5">{title}</h3>
      <p className="text-sm text-zinc-500 max-w-sm leading-relaxed mb-6">
        {description}
      </p>
      {action ? (
        <div>{action}</div>
      ) : actionLabel && actionHref ? (
        <Link
          href={actionHref}
          className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 transition-colors"
        >
          {actionLabel}
        </Link>
      ) : actionLabel && onAction ? (
        <button
          onClick={onAction}
          className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 transition-colors"
        >
          {actionLabel}
        </button>
      ) : null}
    </Card>
  );
}


