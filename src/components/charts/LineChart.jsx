import { Line } from 'react-chartjs-2';
import { useTheme } from '../../context/ThemeContext.jsx';
import {
  EXPENSE_COLOR,
  chartTheme,
  baseTooltip,
  axisScales,
  cssVar,
} from '../../utils/charts.js';
import { formatCurrency } from '../../utils/format.js';

export default function LineChart({ labels, values, label = 'Expenses' }) {
  useTheme();

  const theme = chartTheme();
  const gradient = (ctx) => {
    const chart = ctx.chart;
    const { ctx: c, chartArea } = chart;
    if (!chartArea) return 'rgba(239,68,68,0.15)';
    const g = c.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
    g.addColorStop(0, 'rgba(239,68,68,0.28)');
    g.addColorStop(1, 'rgba(239,68,68,0)');
    return g;
  };

  const data = {
    labels,
    datasets: [
      {
        label,
        data: values,
        borderColor: EXPENSE_COLOR,
        backgroundColor: gradient,
        fill: true,
        tension: 0.35,
        pointRadius: 4,
        pointBackgroundColor: EXPENSE_COLOR,
        pointBorderColor: cssVar('--surface', '#ffffff'),
        pointBorderWidth: 2,
        borderWidth: 2,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    scales: axisScales(theme, (v) => formatCurrency(v, { compact: true })),
    plugins: {
      legend: { display: false },
      tooltip: baseTooltip(theme, (ctx) => ` ${label}: ${formatCurrency(ctx.parsed.y)}`),
    },
  };

  return <Line data={data} options={options} />;
}
