

export const CHART_CATEGORICAL_LIGHT = [
  '#101E36', 
  '#B8863B', 
  '#325D97', 
  '#1B7E5F', 
  '#7C5624', 
  '#4A6086', 
  '#C6640C', 
  '#9C6E2E', 
] as const;

export const CHART_CATEGORICAL_DARK = [
  '#4A6086', 
  '#C79952', 
  '#6791C8', 
  '#43B48D', 
  '#DCB86E', 
  '#334C73', 
  '#F89729', 
  '#E9D19C', 
] as const;

export const CHART_ACCENT = {
  expiring: { light: '#B8863B', dark: '#C79952' }, 
  vendor: { light: '#325D97', dark: '#6791C8' }, 
  value: { light: '#1B7E5F', dark: '#43B48D' }, 
} as const;

export const CHART_CHROME = {
  gridLight: '#f0f0f0',
  gridDark: '#233A5E', 
  tickLight: '#475569', 
  tickDark: '#94a3b8', 
  legendDark: '#cbd5e1', 
  tooltipBgDark: '#172A4A', 
  tooltipBorderDark: '#233A5E', 
  pieStrokeLight: '#fff',
  pieStrokeDark: '#0B1526', 
} as const;

export function tooltipStyle(isDark: boolean) {
  return isDark
    ? { background: CHART_CHROME.tooltipBgDark, border: `1px solid ${CHART_CHROME.tooltipBorderDark}`, borderRadius: 8, color: '#fff' }
    : { borderRadius: 8 };
}
