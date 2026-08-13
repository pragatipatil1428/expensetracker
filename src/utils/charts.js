import {
  Chart as ChartJS,
  ArcElement,
  BarElement,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';

ChartJS.register(
  ArcElement,
  BarElement,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Filler
);

export const CATEGORY_COLORS = [
  '#6366f1',
  '#8b5cf6',
  '#06b6d4',
  '#10b981',
  '#f59e0b',
  '#ef4444',
  '#ec4899',
  '#14b8a6',
  '#3b82f6',
  '#f97316',
  '#64748b',
];

export const INCOME_COLOR = '#10b981';
export const EXPENSE_COLOR = '#ef4444';

export function cssVar(name, fallback) {
  return (
    getComputedStyle(document.documentElement).getPropertyValue(name).trim() ||
    fallback
  );
}

export function chartTheme() {
  return {
    text: cssVar('--chart-text', '#6b7280'),
    grid: cssVar('--chart-grid', '#e6e8f0'),
    font: cssVar('--font-sans', "'Inter', system-ui, sans-serif"),
    tooltipBg: cssVar('--chart-tooltip-bg', '#1f2937'),
    tooltipText: cssVar('--chart-tooltip-text', '#e5e7eb'),
  };
}

export function baseTooltip(theme, currencyFormatter) {
  return {
    backgroundColor: theme.tooltipBg,
    titleColor: theme.tooltipText,
    bodyColor: theme.tooltipText,
    padding: 10,
    cornerRadius: 8,
    boxPadding: 4,
    ...(currencyFormatter ? { callbacks: { label: currencyFormatter } } : {}),
  };
}

export function legendOptions(theme) {
  return {
    position: 'bottom',
    labels: {
      color: theme.text,
      font: { family: theme.font, size: 12 },
      boxWidth: 12,
      boxHeight: 12,
      padding: 14,
      usePointStyle: true,
    },
  };
}

export function axisScales(theme, compactFormatter) {
  return {
    x: {
      grid: { display: false },
      border: { display: false },
      ticks: { color: theme.text, font: { family: theme.font, size: 12 } },
    },
    y: {
      grid: { color: theme.grid, drawBorder: false },
      border: { display: false },
      ticks: {
        color: theme.text,
        font: { family: theme.font, size: 11 },
        maxTicksLimit: 6,
        callback: compactFormatter,
      },
    },
  };
}
