import * as React from 'react';

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: boolean;
  helperText?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', type = 'text', label, error, helperText, id, ...props }, ref) => {
    return (
      <div className="space-y-1.5 w-full">
        {label && (
          <label htmlFor={id} className="block text-xs font-medium text-zinc-700">
            {label}
          </label>
        )}
        <input
          id={id}
          type={type}
          className={`flex h-10 w-full rounded-lg border bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:bg-zinc-50 disabled:text-zinc-400 ${
            error
              ? 'border-red-300 focus-visible:ring-red-500'
              : 'border-zinc-200 hover:border-zinc-300 focus-visible:border-indigo-600'
          } ${className}`}
          ref={ref}
          {...props}
        />
        {helperText && (
          <p className="text-[11px] text-zinc-500">{helperText}</p>
        )}
      </div>
    );
  }
);
Input.displayName = 'Input';

export { Input };

