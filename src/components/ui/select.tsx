import * as React from 'react';

export interface SelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: boolean;
}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className = '', error, children, ...props }, ref) => {
    return (
      <select
        className={`flex h-10 w-full rounded-lg border bg-white px-3 py-2 text-sm text-zinc-900 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:bg-zinc-50 disabled:text-zinc-400 ${
          error
            ? 'border-red-300 focus-visible:ring-red-500'
            : 'border-zinc-200 hover:border-zinc-300 focus-visible:border-indigo-600'
        } ${className}`}
        ref={ref}
        {...props}
      >
        {children}
      </select>
    );
  }
);
Select.displayName = 'Select';

export { Select };
