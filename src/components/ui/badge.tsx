import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

const badgeVariants = cva(
  'inline-flex items-center font-medium rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 select-none',
  {
    variants: {
      variant: {
        default:
          'bg-zinc-100 text-zinc-800 border border-zinc-200/80',
        secondary:
          'bg-zinc-100 text-zinc-700 border border-zinc-200',
        primary:
          'bg-indigo-50 text-indigo-700 border border-indigo-200/80',
        success:
          'bg-emerald-50 text-emerald-700 border border-emerald-200/80',
        warning:
          'bg-amber-50 text-amber-800 border border-amber-200/80',
        destructive:
          'bg-red-50 text-red-700 border border-red-200/80',
        outline:
          'text-zinc-700 border border-zinc-300 bg-white',
        muted:
          'bg-zinc-100 text-zinc-600 border border-zinc-200',
      },
      size: {
        sm: 'px-2 py-0.5 text-[11px] gap-1',
        default: 'px-2.5 py-0.5 text-xs gap-1.5',
        lg: 'px-3 py-1 text-xs gap-1.5',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, size, ...props }: BadgeProps) {
  return (
    <div className={badgeVariants({ variant, size, className })} {...props} />
  );
}

export { Badge, badgeVariants };
