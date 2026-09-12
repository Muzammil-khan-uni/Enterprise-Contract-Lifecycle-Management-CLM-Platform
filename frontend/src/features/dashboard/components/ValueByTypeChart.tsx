import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, TooltipContentProps } from 'recharts';
import type { ValueType, NameType } from 'recharts/types/component/DefaultTooltipContent';
import type { DashboardSummary } from '../types';
import { useTheme } from '../../../shared/hooks/useTheme';
import { CHART_ACCENT, CHART_CHROME } from '../../../shared/lib/chartTheme';
import { humanizeLabel } from '../../../shared/lib/display';

function formatCurrency(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(0)}K`;
  return value.toString();
}

type Row = DashboardSummary['valueByContractType'][number];

function ValueTooltip({ active, payload }: TooltipContentProps<ValueType, NameType>) {
  if (!active || !payload?.length) return null;
  const row = payload[0].payload as Row;
  return (
    <div className="bg-white dark:bg-ink-900 rounded-lg border border-slate-200 dark:border-ink-800 shadow-elevated dark:shadow-elevated-dark px-3 py-2 text-xs animate-fade-in">
      <p className="font-medium text-ink-950 dark:text-white mb-1">{humanizeLabel(row.contractType)}</p>
      <p className="text-slate-600 dark:text-slate-400">Total value: {row.totalValue.toLocaleString()}</p>
      <p className="text-slate-600 dark:text-slate-400">Contracts: {row.count}</p>
    </div>
  );
}

export function ValueByTypeChart({ data }: { data: DashboardSummary['valueByContractType'] }) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  if (data.length === 0) {
    return <p className="text-sm text-slate-500 dark:text-slate-400 py-8 text-center">No contract value data yet.</p>;
  }

  const chartData = [...data].sort((a, b) => b.totalValue - a.totalValue);
  const gridColor = isDark ? CHART_CHROME.gridDark : CHART_CHROME.gridLight;
  const tickColor = isDark ? CHART_CHROME.tickDark : CHART_CHROME.tickLight;

  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
        <XAxis dataKey="contractType" tick={{ fontSize: 12, fill: tickColor }} />
        <YAxis tickFormatter={formatCurrency} tick={{ fontSize: 12, fill: tickColor }} />
        <Tooltip content={ValueTooltip} cursor={{ fill: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)' }} />
        <Bar dataKey="totalValue" fill={isDark ? CHART_ACCENT.value.dark : CHART_ACCENT.value.light} radius={[4, 4, 0, 0]} animationDuration={500} />
      </BarChart>
    </ResponsiveContainer>
  );
}
