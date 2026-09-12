import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import type { ExpiringContract } from '../types';
import { useTheme } from '../../../shared/hooks/useTheme';
import { CHART_ACCENT, CHART_CHROME, tooltipStyle } from '../../../shared/lib/chartTheme';

function bucketByWeek(contracts: ExpiringContract[]): { week: string; count: number }[] {
  const buckets = new Map<string, number>();
  for (const c of contracts) {
    const date = new Date(c.expiryDate);
    const weekStart = new Date(date);
    weekStart.setDate(date.getDate() - date.getDay());
    const key = weekStart.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    buckets.set(key, (buckets.get(key) ?? 0) + 1);
  }
  return Array.from(buckets.entries()).map(([week, count]) => ({ week, count }));
}

export function ExpiringContractsChart({ contracts }: { contracts: ExpiringContract[] }) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const data = bucketByWeek(contracts);

  if (data.length === 0) {
    return <p className="text-sm text-slate-500 dark:text-slate-400 py-8 text-center">No contracts expiring in the next 30 days.</p>;
  }

  const gridColor = isDark ? CHART_CHROME.gridDark : CHART_CHROME.gridLight;
  const tickColor = isDark ? CHART_CHROME.tickDark : CHART_CHROME.tickLight;

  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
        <XAxis dataKey="week" tick={{ fontSize: 12, fill: tickColor }} />
        <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: tickColor }} />
        <Tooltip
          contentStyle={tooltipStyle(isDark)}
          cursor={{ fill: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)' }}
        />
        <Bar dataKey="count" fill={isDark ? CHART_ACCENT.expiring.dark : CHART_ACCENT.expiring.light} radius={[4, 4, 0, 0]} animationDuration={500} />
      </BarChart>
    </ResponsiveContainer>
  );
}
