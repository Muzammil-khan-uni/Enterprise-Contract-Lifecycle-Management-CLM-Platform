import type { HTMLAttributes } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  
  interactive?: boolean;
  

  elevated?: boolean;
}

export function Card({ className = '', interactive = false, elevated = false, ...props }: CardProps) {
  return (
    <div
      className={`bg-white rounded-xl border border-slate-200 dark:bg-ink-900 dark:border-ink-800 transition-colors duration-200 ${
        elevated ? 'shadow-ambient dark:shadow-ambient-dark' : 'shadow-card dark:shadow-card-dark'
      } ${interactive ? 'interactive-lift cursor-pointer' : ''} ${className}`}
      {...props}
    />
  );
}
