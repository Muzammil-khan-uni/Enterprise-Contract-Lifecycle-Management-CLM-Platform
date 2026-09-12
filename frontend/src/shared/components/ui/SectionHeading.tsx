import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';

export function SectionHeading({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-3 mb-3">
      <div className="flex items-start gap-2.5 min-w-0">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-ink-950/5 text-ink-900 dark:bg-white/10 dark:text-slate-200">
          <Icon size={15} />
        </span>
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-ink-950 dark:text-white truncate">{title}</h2>
          {description && <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{description}</p>}
        </div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
