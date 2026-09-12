import { FileCheck2, Clock, ClipboardList, DollarSign } from 'lucide-react';
import type { DashboardSummary } from '../types';
import { Card } from '../../../shared/components/ui/Card';
import { useCountUp } from '../../../shared/hooks/useCountUp';

function Stat({
  label,
  value,
  icon: Icon,
  tone,
  delay,
  formatter = (n: number) => n.toLocaleString(),
}: {
  label: string;
  value: number;
  icon: typeof FileCheck2;
  tone: 'ink' | 'warning' | 'info' | 'brass';
  delay: number;
  
  formatter?: (n: number) => string;
}) {
  const iconTone: Record<typeof tone, string> = {
    ink: 'bg-ink-950 text-white dark:bg-white/10 dark:text-white',
    warning: 'bg-warning-50 dark:bg-warning-600/15 text-warning-600 dark:text-warning-300',
    info: 'bg-info-50 dark:bg-info-600/15 text-info-600 dark:text-info-300',
    brass: 'bg-brass-50 dark:bg-brass-500/15 text-brass-600 dark:text-brass-300',
  };

  const animated = useCountUp(value);

  return (
    <Card
      elevated
      className="relative overflow-hidden p-5 flex items-start justify-between gap-3 animate-count-up group interactive-lift"
      style={{ animationDelay: `${delay}ms`, animationFillMode: 'backwards' }}
    >
      <div className="absolute inset-0 bg-card-sheen pointer-events-none" aria-hidden="true" />
      <div className="relative min-w-0">
        <p className="text-sm text-slate-500 dark:text-slate-400 truncate">{label}</p>
        {

}
        <p className="font-display text-2xl sm:text-3xl font-semibold text-ink-950 dark:text-white mt-1 truncate tabular-nums" aria-hidden="true">
          {formatter(animated)}
        </p>
        <span className="sr-only">{formatter(value)}</span>
      </div>
      <span
        className={`relative flex h-10 w-10 shrink-0 items-center justify-center rounded-lg transition-transform duration-200 group-hover:scale-110 group-hover:rotate-3 ${iconTone[tone]}`}
      >
        <Icon size={19} />
      </span>
    </Card>
  );
}

export function KpiCards({ summary }: { summary: DashboardSummary }) {
  const totalValue = summary.valueByContractType.reduce((sum, row) => sum + row.totalValue, 0);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      <Stat label="Active Contracts" value={summary.activeContracts} icon={FileCheck2} tone="ink" delay={0} />
      <Stat label="Expiring (30 days)" value={summary.expiringContracts} icon={Clock} tone="warning" delay={60} />
      <Stat label="Pending Approvals" value={summary.pendingApprovals} icon={ClipboardList} tone="info" delay={120} />
      <Stat
        label="Total Contract Value"
        value={totalValue}
        icon={DollarSign}
        tone="brass"
        delay={180}
        formatter={(n) => `$${n.toLocaleString()}`}
      />
    </div>
  );
}
