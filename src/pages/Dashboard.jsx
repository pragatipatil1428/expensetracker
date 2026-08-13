import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useFetch } from '../hooks/useFetch.js';
import { useDocumentTitle } from '../hooks/useDocumentTitle.js';
import { analyticsService } from '../services/analyticsService.js';
import { transactionService } from '../services/transactionService.js';
import { getErrorMessage } from '../services/api.js';
import { formatCurrency, firstName, greeting, todayLabel, monthLabel } from '../utils/format.js';
import StatCard from '../components/features/StatCard.jsx';
import ChartCard from '../components/features/ChartCard.jsx';
import TransactionTable from '../components/features/TransactionTable.jsx';
import DoughnutChart from '../components/charts/DoughnutChart.jsx';
import BarChart from '../components/charts/BarChart.jsx';
import LineChart from '../components/charts/LineChart.jsx';
import Button from '../components/ui/Button.jsx';
import ErrorState from '../components/ui/ErrorState.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';
import { PageLoader } from '../components/ui/Spinner.jsx';

export default function Dashboard() {
  useDocumentTitle('Dashboard');
  const { user } = useAuth();
  const navigate = useNavigate();

  const summary = useFetch(
    () => analyticsService.summary('thisMonth').then((r) => r.data.summary),
    []
  );
  const trend = useFetch(
    () => analyticsService.monthly({ months: 6 }).then((r) => r.data.months),
    []
  );
  const categories = useFetch(
    () => analyticsService.categories('thisMonth').then((r) => r.data),
    []
  );
  const recent = useFetch(
    () => transactionService.list({ limit: 6 }).then((r) => r.data.transactions),
    []
  );

  const s = summary.data;
  const monthLabels = (trend.data || []).map((m) => `${m.month} '${String(m.year).slice(2)}`);
  const monthIncomes = (trend.data || []).map((m) => m.income);
  const monthExpenses = (trend.data || []).map((m) => m.expenses);

  if (summary.loading) return <PageLoader label="Loading your dashboard…" />;

  if (summary.error) {
    return (
      <div className="page">
        <ErrorState
          title="Could not load your dashboard"
          message={getErrorMessage(summary.error)}
          onRetry={summary.refetch}
        />
      </div>
    );
  }

  const thisMonth = monthLabel(s.period?.from);

  return (
    <div className="page">
      <div className="page__header page__header--dashboard">
        <div>
          <h1 className="page__title">
            {greeting()}, {firstName(user?.name)}
          </h1>
          <p className="page__subtitle">{todayLabel()}</p>
        </div>
        <Button icon="plus" onClick={() => navigate('/transactions/new')}>
          Add Transaction
        </Button>
      </div>

      <div className="stats-grid">
        <StatCard
          label="Total Balance"
          value={formatCurrency(s.allTime?.balance)}
          sub="Lifetime income − expenses"
          icon="wallet"
          tone="indigo"
        />
        <StatCard
          label="Total Income"
          value={formatCurrency(s.allTime?.income)}
          sub={`${s.changes?.income >= 0 ? '+' : ''}${s.changes?.income}% vs last month`}
          icon="trend-up"
          tone="green"
          change={s.changes?.income}
        />
        <StatCard
          label="Total Expenses"
          value={formatCurrency(s.allTime?.expenses)}
          sub={`${s.changes?.expenses >= 0 ? '+' : ''}${s.changes?.expenses}% vs last month`}
          icon="trend-down"
          tone="red"
          change={-s.changes?.expenses}
        />
        <StatCard
          label="This Month's Expenses"
          value={formatCurrency(s.totals?.expenses)}
          sub={`${s.totals?.transactions} transactions this month`}
          icon="calendar"
          tone="amber"
        />
      </div>

      <div className="dashboard-charts">
        <ChartCard title="Expense by Category" subtitle={thisMonth}>
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
              title="No expenses yet"
              description="Add an expense to see your category breakdown."
            />
          )}
        </ChartCard>

        <ChartCard title="Income vs Expenses" subtitle="Last 6 months">
          {trend.loading ? (
            <div className="chart-card__loading" />
          ) : (
            <div className="chart-card__canvas">
              <BarChart
                labels={monthLabels}
                income={monthIncomes}
                expenses={monthExpenses}
              />
            </div>
          )}
        </ChartCard>
      </div>

      <div className="dashboard-lower">
        <ChartCard title="Monthly Expense Trend" subtitle="Last 6 months" className="dashboard-lower__chart">
          {trend.loading ? (
            <div className="chart-card__loading" />
          ) : (
            <div className="chart-card__canvas">
              <LineChart labels={monthLabels} values={monthExpenses} />
            </div>
          )}
        </ChartCard>

        <div className="card summary-card">
          <h3 className="chart-card__title">Monthly Summary</h3>
          <p className="chart-card__subtitle">{thisMonth}</p>
          <div className="summary-card__rows">
            <div className="summary-card__row">
              <span>Income</span>
              <strong className="summary-card__income">{formatCurrency(s.totals?.income)}</strong>
            </div>
            <div className="summary-card__row">
              <span>Expenses</span>
              <strong className="summary-card__expense">{formatCurrency(s.totals?.expenses)}</strong>
            </div>
            <div className="summary-card__row summary-card__row--divider">
              <span>Savings</span>
              <strong className={s.totals?.savings >= 0 ? 'summary-card__savings' : 'summary-card__expense'}>
                {formatCurrency(s.totals?.savings)}
              </strong>
            </div>
          </div>
          <div className="summary-card__extra">
            <div className="summary-card__extra-item">
              <span className="summary-card__extra-label">Top Category</span>
              <span className="summary-card__extra-value">
                {s.topCategory
                  ? `${s.topCategory.category} · ${formatCurrency(s.topCategory.total)}`
                  : '—'}
              </span>
            </div>
            <div className="summary-card__extra-item">
              <span className="summary-card__extra-label">Largest Expense</span>
              <span className="summary-card__extra-value">
                {s.largestExpense
                  ? `${s.largestExpense.description} · ${formatCurrency(s.largestExpense.amount)}`
                  : '—'}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="card recent-card">
        <div className="recent-card__header">
          <div>
            <h3 className="chart-card__title">Recent Transactions</h3>
            <p className="chart-card__subtitle">Your latest activity</p>
          </div>
          <Link to="/transactions" className="link-button">
            View All Transactions
          </Link>
        </div>
        {recent.loading ? (
          <div className="recent-card__loading">
            <div className="chart-card__loading" />
          </div>
        ) : recent.data?.length ? (
          <TransactionTable
            transactions={recent.data}
            showActions={false}
            showPayment={false}
          />
        ) : (
          <EmptyState
            icon="wallet"
            title="No transactions yet"
            description="Add your first income or expense to get started."
            action={
              <Button icon="plus" onClick={() => navigate('/transactions/new')}>
                Add your first transaction
              </Button>
            }
          />
        )}
      </div>
    </div>
  );
}
