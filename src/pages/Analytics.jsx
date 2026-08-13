import { useState } from 'react';
import { useFetch } from '../hooks/useFetch.js';
import { useDocumentTitle } from '../hooks/useDocumentTitle.js';
import { analyticsService } from '../services/analyticsService.js';
import { getErrorMessage } from '../services/api.js';
import { RANGE_OPTIONS, RANGE_MONTHS } from '../utils/constants.js';
import { formatCurrency } from '../utils/format.js';
import StatCard from '../components/features/StatCard.jsx';
import ChartCard from '../components/features/ChartCard.jsx';
import DoughnutChart from '../components/charts/DoughnutChart.jsx';
import BarChart from '../components/charts/BarChart.jsx';
import LineChart from '../components/charts/LineChart.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';
import ErrorState from '../components/ui/ErrorState.jsx';
import { PageLoader } from '../components/ui/Spinner.jsx';

export default function Analytics() {
  useDocumentTitle('Analytics');
  const [range, setRange] = useState('thisMonth');

  const summary = useFetch(
    () => analyticsService.summary(range).then((r) => r.data.summary),
    [range]
  );
  const categories = useFetch(
    () => analyticsService.categories(range).then((r) => r.data),
    [range]
  );
  const monthly = useFetch(
    () => analyticsService.monthly({ range }).then((r) => r.data.months),
    [range]
  );

  if (summary.loading) return <PageLoader label="Crunching your numbers…" />;

  if (summary.error) {
    return (
      <div className="page">
        <ErrorState
          title="Could not load analytics"
          message={getErrorMessage(summary.error)}
          onRetry={summary.refetch}
        />
      </div>
    );
  }

  const s = summary.data;
  const months = monthly.data || [];
  const divisor = RANGE_MONTHS[range] || 1;
  const avgMonthly = s.totals.expenses / divisor;
  const isLast3 = range === 'last3Months';
  const isYear = range === 'thisYear';

  const labels = months.map((m) => `${m.month} '${String(m.year).slice(2)}`);
  const incomes = months.map((m) => m.income);
  const expenses = months.map((m) => m.expenses);

  return (
    <div className="page">
      <div className="page__header">
        <div>
          <h1 className="page__title">Analytics</h1>
          <p className="page__subtitle">Understand where your money goes</p>
        </div>
        <div className="segmented" role="group" aria-label="Date range">
          {RANGE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              className={`segmented__btn ${range === opt.value ? 'segmented__btn--active' : ''}`}
              onClick={() => setRange(opt.value)}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="stats-grid">
        <StatCard
          label="Total Income"
          value={formatCurrency(s.totals.income)}
          sub={rangeLabel(range)}
          icon="trend-up"
          tone="green"
          change={s.changes?.income}
        />
        <StatCard
          label="Total Expenses"
          value={formatCurrency(s.totals.expenses)}
          sub={rangeLabel(range)}
          icon="trend-down"
          tone="red"
          change={s.changes?.expenses}
        />
        <StatCard
          label="Total Savings"
          value={formatCurrency(s.totals.savings)}
          sub={`${s.totals.transactions} transactions`}
          icon="wallet"
          tone="indigo"
        />
        <StatCard
          label="Avg Monthly Expense"
          value={formatCurrency(avgMonthly)}
          sub={`Across ${divisor} month${divisor === 1 ? '' : 's'}`}
          icon="calendar"
          tone="amber"
        />
      </div>

      <div className="dashboard-charts">
        <ChartCard title="Category Spending" subtitle="Expense breakdown">
          {categories.loading ? (
            <div className="chart-card__loading" />
          ) : categories.data?.categories?.length ? (
            <div className="chart-card__canvas">
              <DoughnutChart
                labels={categories.data.categories.map((c) => c.category)}
                values={categories.data.categories.map((c) => c.total)}
              />
            </div>
          ) : (
            <EmptyState
              icon="chart"
              title="No expenses in this period"
              description="Expenses in the selected range will appear here."
            />
          )}
        </ChartCard>

        <ChartCard
          title="Income vs Expenses"
          subtitle={isYear ? '12 months' : isLast3 ? '3 months' : '2 months'}
        >
          {monthly.loading ? (
            <div className="chart-card__loading" />
          ) : (
            <div className="chart-card__canvas">
              <BarChart labels={labels} income={incomes} expenses={expenses} />
            </div>
          )}
        </ChartCard>
      </div>

      <ChartCard
        title="Monthly Expenses"
        subtitle="Expense trend over the selected period"
      >
        {monthly.loading ? (
          <div className="chart-card__loading" />
        ) : (
          <div className="chart-card__canvas chart-card__canvas--tall">
            <LineChart labels={labels} values={expenses} />
          </div>
        )}
      </ChartCard>
    </div>
  );
}

function rangeLabel(range) {
  return RANGE_OPTIONS.find((o) => o.value === range)?.label || '';
}
