import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import type { DepartmentBreakdown } from '../types';
import { useTheme } from '../../../shared/hooks/useTheme';
import { CHART_CATEGORICAL_LIGHT, CHART_CATEGORICAL_DARK, CHART_CHROME, tooltipStyle } from '../../../shared/lib/chartTheme';

export function DeptBreakdownChart({ data }: { data: DepartmentBreakdown[] }) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const COLORS = isDark ? CHART_CATEGORICAL_DARK : CHART_CATEGORICAL_LIGHT;

  if (data.length === 0) {
    return <p className="text-sm text-slate-500 dark:text-slate-400 py-8 text-center">No department data yet.</p>;
  }

  const chartData = data.map((d) => ({ name: d.departmentName ?? 'Unassigned', value: d.count }));

  return (
    <ResponsiveContainer width="100%" height={240}>
      <PieChart>
        <Pie data={chartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} animationDuration={500}>
          {chartData.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} stroke={isDark ? CHART_CHROME.pieStrokeDark : CHART_CHROME.pieStrokeLight} strokeWidth={1} />
          ))}
        </Pie>
        <Tooltip contentStyle={tooltipStyle(isDark)} />
        <Legend wrapperStyle={{ fontSize: 12, color: isDark ? CHART_CHROME.legendDark : undefined }} />
      </PieChart>
    </ResponsiveContainer>
  );
}
