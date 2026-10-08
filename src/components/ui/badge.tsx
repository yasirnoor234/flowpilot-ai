import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold tracking-wide transition-colors focus:outline-none',
  {
    variants: {
      variant: {
        default:
          'bg-indigo-500/15 text-indigo-400 border border-indigo-500/30',
        secondary:
          'bg-zinc-800 text-zinc-300 border border-zinc-700/60',
        success:
          'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30',
        warning:
          'bg-amber-500/15 text-amber-400 border border-amber-500/30',
        danger:
          'bg-red-500/15 text-red-400 border border-red-500/30',
        outline:
          'text-zinc-300 border border-zinc-700',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}
