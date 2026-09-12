import { InputHTMLAttributes, forwardRef } from 'react';

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className = '', ...props }, ref) => (
    <input
      ref={ref}
      className={`w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 transition-colors focus:outline-none focus:border-brass-500 focus:ring-2 focus:ring-brass-500/20 disabled:bg-slate-50 disabled:text-slate-500 dark:bg-ink-900 dark:border-ink-700 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-brass-400 dark:focus:ring-brass-400/20 dark:disabled:bg-ink-950 dark:disabled:text-slate-500 ${className}`}
      {...props}
    />
  )
);
Input.displayName = 'Input';
