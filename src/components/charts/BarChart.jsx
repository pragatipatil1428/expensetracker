import { Bar } from 'react-chartjs-2';
import { useTheme } from '../../context/ThemeContext.jsx';
import {
  INCOME_COLOR,
  EXPENSE_COLOR,
  chartTheme,
  baseTooltip,
  legendOptions,
  axisScales,
} from '../../utils/charts.js';
import { formatCurrency } from '../../utils/format.js';

export default function BarChart({ labels, income, expenses }) {
  useTheme();

  const theme = chartTheme();
  const data = {
    labels,
    datasets: [
      {
        label: 'Income',
        data: income,
        backgroundColor: INCOME_COLOR,
        borderRadius: 6,
        maxBarThickness: 28,
      },
      {
        label: 'Expenses',
        data: expenses,
        backgroundColor: EXPENSE_COLOR,
        borderRadius: 6,
        maxBarThickness: 28,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    scales: axisScales(theme, (v) => formatCurrency(v, { compact: true })),
    plugins: {
      legend: legendOptions(theme),
      tooltip: baseTooltip(theme, (ctx) => ` ${ctx.dataset.label}: ${formatCurrency(ctx.parsed.y)}`),
    },
  };

  return <Bar data={data} options={options} />;
}
