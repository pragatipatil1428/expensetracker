import { Doughnut } from 'react-chartjs-2';
import { useTheme } from '../../context/ThemeContext.jsx';
import { CATEGORY_COLORS, chartTheme, baseTooltip, legendOptions, cssVar } from '../../utils/charts.js';
import { formatCurrency } from '../../utils/format.js';

export default function DoughnutChart({ labels, values }) {
  useTheme(); // re-render when the theme changes so colors refresh

  const theme = chartTheme();
  const data = {
    labels,
    datasets: [
      {
        data: values,
        backgroundColor: labels.map((_, i) => CATEGORY_COLORS[i % CATEGORY_COLORS.length]),
        borderColor: cssVar('--surface', '#ffffff'),
        borderWidth: 2,
        hoverOffset: 6,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '60%',
    plugins: {
      legend: legendOptions(theme),
      tooltip: baseTooltip(theme, (ctx) => ` ${ctx.label}: ${formatCurrency(ctx.parsed)}`),
    },
  };

  return <Doughnut data={data} options={options} />;
}
