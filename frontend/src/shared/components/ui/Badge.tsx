import type { ReactNode } from 'react';

const TONE_CLASSES: Record<string, string> = {
  neutral: 'bg-slate-100 text-slate-700 ring-1 ring-inset ring-slate-200 dark:bg-white/10 dark:text-slate-300 dark:ring-white/10',
  info: 'bg-info-50 text-info-700 ring-1 ring-inset ring-info-100 dark:bg-info-600/15 dark:text-info-100 dark:ring-info-600/30',
  success: 'bg-success-50 text-success-700 ring-1 ring-inset ring-success-100 dark:bg-success-600/15 dark:text-success-100 dark:ring-success-600/30',
  warning: 'bg-warning-50 text-warning-700 ring-1 ring-inset ring-warning-100 dark:bg-warning-600/15 dark:text-warning-100 dark:ring-warning-600/30',
  danger: 'bg-danger-50 text-danger-700 ring-1 ring-inset ring-danger-100 dark:bg-danger-600/15 dark:text-danger-100 dark:ring-danger-600/30',
  brass: 'bg-brass-50 text-brass-700 ring-1 ring-inset ring-brass-200 dark:bg-brass-500/15 dark:text-brass-200 dark:ring-brass-500/30',
};

export function Badge({ tone = 'neutral', children }: { tone?: keyof typeof TONE_CLASSES; children: ReactNode }) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors duration-200 animate-fade-in ${TONE_CLASSES[tone]}`}
    >
      {children}
    </span>
  );
}
