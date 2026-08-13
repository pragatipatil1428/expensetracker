"use client";

import * as React from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Wallet, ArrowDownLeft, ArrowUpRight, PiggyBank, TrendingUp } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/dashboard/stat-card";
import { TrendChart } from "@/components/dashboard/trend-chart";
import { CategoryDonut } from "@/components/dashboard/category-donut";
import { SavingsTrendChart } from "@/components/dashboard/savings-trend-chart";
import { BudgetUtilization } from "@/components/dashboard/budget-utilization";
import { RecentTransactions } from "@/components/dashboard/recent-transactions";
import { FinancialSummaryCard } from "@/components/dashboard/financial-summary-card";
import { QuickActions } from "@/components/dashboard/quick-actions";
import { DashboardSkeleton } from "@/components/dashboard/dashboard-skeleton";
import { ErrorState } from "@/components/shared/error-state";
import { getDashboardDataAction } from "@/actions/dashboard";
import { getCategoriesAction } from "@/actions/categories";
import { CHART_PERIODS, type ChartPeriod } from "@/lib/constants";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 5) return "Good night";
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export function DashboardClient() {
  const queryClient = useQueryClient();
  const [period, setPeriod] = React.useState<ChartPeriod>("30d");

  const dashboard = useQuery({
    queryKey: ["dashboard", period],
    queryFn: async () => {
      const result = await getDashboardDataAction(period);
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
  });

  const categoriesQuery = useQuery({
    queryKey: ["categories", "all"],
    queryFn: async () => {
      const result = await getCategoriesAction();
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
  });

  const invalidateData = () => {
    queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    queryClient.invalidateQueries({ queryKey: ["notifications"] });
  };

  if (dashboard.isLoading) return <DashboardSkeleton />;

  if (dashboard.isError || !dashboard.data) {
    return (
      <ErrorState
        message="We couldn't load your dashboard. Please try again."
        onRetry={() => dashboard.refetch()}
      />
    );
  }

  const { overview, financialSummary, currency, userName } = dashboard.data;
  const categories = categoriesQuery.data ?? [];
  const { summary } = overview;

  return (
    <div className="space-y-6">
      {/* Greeting + actions */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            {getGreeting()}, {userName.split(" ")[0]} 👋
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Here&apos;s what&apos;s happening with your money.
          </p>
        </div>
        <QuickActions
          categories={categories}
          currency={currency}
          onDataChanged={invalidateData}
        />
      </div>

      {/* Period switcher */}
      <div className="flex justify-end">
        <div className="inline-flex rounded-lg bg-muted p-1" role="tablist" aria-label="Chart period">
          {CHART_PERIODS.map((option) => (
            <button
              key={option.value}
              role="tab"
              aria-selected={period === option.value}
              onClick={() => setPeriod(option.value)}
              className={cn(
                "rounded-md px-3 py-1.5 text-xs font-medium transition-all",
                period === option.value
                  ? "bg-background text-foreground shadow"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Current balance"
          value={formatCurrency(summary.balance, currency)}
          icon={Wallet}
          change={summary.savingsChange}
          changeLabel="vs previous period"
        />
        <StatCard
          label="Total income"
          value={formatCurrency(summary.income, currency)}
          icon={ArrowDownLeft}
          change={summary.incomeChange}
          changeLabel="vs previous period"
          iconClassName="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
        />
        <StatCard
          label="Total expenses"
          value={formatCurrency(summary.expenses, currency)}
          icon={ArrowUpRight}
          change={summary.expenseChange}
          changeLabel="vs previous period"
          positiveIsGood={false}
          iconClassName="bg-rose-500/10 text-rose-600 dark:text-rose-400"
        />
        <StatCard
          label="Savings"
          value={formatCurrency(summary.savings, currency)}
          icon={PiggyBank}
          change={summary.savingsChange}
          changeLabel={`${summary.savingsRate.toFixed(1)}% savings rate`}
          iconClassName="bg-indigo-500/10 text-indigo-600 dark:text-indigo-400"
        />
      </div>

      {/* Charts */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Income vs expenses</CardTitle>
            <p className="text-sm text-muted-foreground">
              {period === "7d"
                ? "Last 7 days"
                : period === "30d"
                  ? "Last 30 days"
                  : period === "3m"
                    ? "Last 3 months"
                    : period === "6m"
                      ? "Last 6 months"
                      : "Last 12 months"}
            </p>
          </CardHeader>
          <CardContent>
            <TrendChart data={overview.trend} currency={currency} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Expenses by category</CardTitle>
            <p className="text-sm text-muted-foreground">Where your money went</p>
          </CardHeader>
          <CardContent>
            {overview.categoryBreakdown.length > 0 ? (
              <CategoryDonut
                data={overview.categoryBreakdown}
                currency={currency}
                total={summary.expenses}
              />
            ) : (
              <p className="py-10 text-center text-sm text-muted-foreground">
                No expenses in this period
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Savings + Budgets */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="h-4 w-4 text-primary" aria-hidden />
              Savings trend
            </CardTitle>
            <p className="text-sm text-muted-foreground">Last 6 months</p>
          </CardHeader>
          <CardContent>
            <SavingsTrendChart data={overview.savingsTrend} currency={currency} />
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Budget utilization</CardTitle>
            <p className="text-sm text-muted-foreground">This month</p>
          </CardHeader>
          <CardContent>
            <BudgetUtilization
              budgets={overview.budgetUtilization.budgets}
              currency={currency}
              totalBudget={overview.budgetUtilization.totalBudget}
              totalSpent={overview.budgetUtilization.totalSpent}
              utilization={overview.budgetUtilization.utilization}
            />
          </CardContent>
        </Card>
      </div>

      {/* Recent + Summary */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base">Recent transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <RecentTransactions transactions={overview.recent} currency={currency} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Financial summary</CardTitle>
          </CardHeader>
          <CardContent>
            <FinancialSummaryCard summary={financialSummary} currency={currency} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
