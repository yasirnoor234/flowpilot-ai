'use client';

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { Loader2 } from 'lucide-react';

const buttonVariants = cva(
  'inline-flex items-center justify-center font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 select-none active:scale-[0.99] cursor-pointer',
  {
    variants: {
      variant: {
        primary:
          'bg-indigo-600 text-white hover:bg-indigo-700 shadow-xs border border-indigo-600/20',
        default:
          'bg-indigo-600 text-white hover:bg-indigo-700 shadow-xs border border-indigo-600/20',
        secondary:
          'bg-zinc-100 text-zinc-900 hover:bg-zinc-200/80 border border-zinc-200/60 shadow-xs',
        outline:
          'bg-white text-zinc-800 border border-zinc-200 hover:bg-zinc-50 hover:border-zinc-300 shadow-xs',
        ghost:
          'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100',
        destructive:
          'bg-red-600 text-white hover:bg-red-700 shadow-xs border border-red-600/20',
        subtle:
          'bg-indigo-50 text-indigo-700 hover:bg-indigo-100/80 border border-indigo-100',
      },
      size: {
        sm: 'h-8 px-3 text-xs rounded-md gap-1.5',
        md: 'h-10 px-4 text-sm rounded-lg gap-2',
        default: 'h-10 px-4 text-sm rounded-lg gap-2',
        lg: 'h-11 px-5 text-sm font-medium rounded-lg gap-2.5',
        icon: 'h-9 w-9 p-0 rounded-md',
        'icon-sm': 'h-8 w-8 p-0 rounded-md',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  isLoading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, isLoading, children, disabled, ...props }, ref) => {
    return (
      <button
        className={buttonVariants({ variant, size, className })}
        ref={ref}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading && <Loader2 className="h-4 w-4 animate-spin text-current" />}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';

export { Button, buttonVariants };
