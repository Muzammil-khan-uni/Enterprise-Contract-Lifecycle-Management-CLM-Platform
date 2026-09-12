import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import type { VendorBreakdown } from '../types';
import { useTheme } from '../../../shared/hooks/useTheme';
import { CHART_ACCENT, CHART_CHROME, tooltipStyle } from '../../../shared/lib/chartTheme';

export function VendorBreakdownChart({ data }: { data: VendorBreakdown[] }) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  if (data.length === 0) {
    return <p className="text-sm text-slate-500 dark:text-slate-400 py-8 text-center">No vendor contracts yet.</p>;
  }

  const height = Math.max(240, data.length * 28);
  const gridColor = isDark ? CHART_CHROME.gridDark : CHART_CHROME.gridLight;
  const tickColor = isDark ? CHART_CHROME.tickDark : CHART_CHROME.tickLight;

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} layout="vertical" margin={{ left: 8, right: 16 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={gridColor} horizontal={false} />
        <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12, fill: tickColor }} />
        <YAxis
          type="category"
          dataKey="vendorName"
          width={140}
          tick={{ fontSize: 12, fill: tickColor }}
          interval={0}
        />
        <Tooltip
          contentStyle={tooltipStyle(isDark)}
          cursor={{ fill: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)' }}
        />
        <Bar dataKey="count" fill={isDark ? CHART_ACCENT.vendor.dark : CHART_ACCENT.vendor.light} radius={[0, 4, 4, 0]} animationDuration={500} />
      </BarChart>
    </ResponsiveContainer>
  );
}
