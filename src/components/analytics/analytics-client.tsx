"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { subDays, subMonths, startOfMonth, endOfMonth, startOfYear, endOfYear, format } from "date-fns";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ArrowDownLeft, ArrowUpRight, PiggyBank, TrendingUp } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DateField } from "@/components/shared/date-field";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/shared/error-state";
import { ChartTooltip } from "@/components/charts/chart-tooltip";
import { getAnalyticsDataAction, getMeAction } from "@/actions/dashboard";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";

interface RangePreset {
  label: string;
  range: () => { from: string; to: string };
}

const PRESETS: RangePreset[] = [
  {
    label: "This month",
    range: () => ({
      from: format(startOfMonth(new Date()), "yyyy-MM-dd"),
      to: format(endOfMonth(new Date()), "yyyy-MM-dd"),
    }),
  },
  {
    label: "Last month",
    range: () => {
      const prev = subMonths(new Date(), 1);
      return { from: format(startOfMonth(prev), "yyyy-MM-dd"), to: format(endOfMonth(prev), "yyyy-MM-dd") };
    },
  },
  {
    label: "3 months",
    range: () => ({ from: format(startOfMonth(subMonths(new Date(), 2)), "yyyy-MM-dd"), to: format(endOfMonth(new Date()), "yyyy-MM-dd") }),
  },
  {
    label: "6 months",
    range: () => ({ from: format(startOfMonth(subMonths(new Date(), 5)), "yyyy-MM-dd"), to: format(endOfMonth(new Date()), "yyyy-MM-dd") }),
  },
  {
    label: "This year",
    range: () => ({ from: format(startOfYear(new Date()), "yyyy-MM-dd"), to: format(endOfYear(new Date()), "yyyy-MM-dd") }),
  },
];

const FALLBACK_COLORS = ["#6366f1", "#8b5cf6", "#ec4899", "#f97316", "#06b6d4", "#10b981", "#f59e0b", "#ef4444"];

export function AnalyticsClient() {
  const [range, setRange] = React.useState(() => PRESETS[0].range());

  const me = useQuery({
    queryKey: ["me"],
    queryFn: async () => {
      const result = await getMeAction();
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
  });

  const analytics = useQuery({
    queryKey: ["analytics", range],
    queryFn: async () => {
      const result = await getAnalyticsDataAction(range.from, range.to);
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
  });

  const currency = me.data?.currency ?? "INR";

  // 30-day daily spending trend
  const dailyTrend = React.useMemo(() => {
    if (!analytics.data) return [];
    const days = new Map<string, number>();
    for (let i = 29; i >= 0; i--) {
      days.set(format(subDays(new Date(), i), "MMM d"), 0);
    }
    for (const txn of analytics.data.transactions) {
      if (txn.type !== "EXPENSE") continue;
      const key = format(new Date(txn.date), "MMM d");
      if (days.has(key)) days.set(key, (days.get(key) ?? 0) + txn.amount);
    }
    return [...days.entries()].map(([label, value]) => ({ label, value }));
  }, [analytics.data]);

  const incomeSlices = (analytics.data?.incomeByCategory ?? []).map((slice, index) => ({
    ...slice,
    fill: slice.color || FALLBACK_COLORS[index % FALLBACK_COLORS.length],
  }));

  const expenseSlices = (analytics.data?.byCategory ?? []).map((slice, index) => ({
    ...slice,
    fill: slice.color || FALLBACK_COLORS[index % FALLBACK_COLORS.length],
  }));

  if (analytics.isLoading || me.isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-72" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          {[0, 1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <Skeleton className="h-80 w-full" />
          <Skeleton className="h-80 w-full" />
        </div>
      </div>
    );
  }

  if (analytics.isError || !analytics.data) {
    return <ErrorState onRetry={() => analytics.refetch()} />;
  }

  const { totals, monthly, topCategories } = analytics.data;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {format(new Date(range.from), "MMM d, yyyy")} — {format(new Date(range.to), "MMM d, yyyy")}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex flex-wrap rounded-lg bg-muted p-1">
            {PRESETS.map((preset) => (
              <button
                key={preset.label}
                onClick={() => setRange(preset.range())}
                className={cn(
                  "rounded-md px-3 py-1.5 text-xs font-medium transition-all",
                  range.from === preset.range().from && range.to === preset.range().to
                    ? "bg-background text-foreground shadow"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {preset.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1.5">
            <DateField
              value={range.from}
              onChange={(e) => setRange((r) => ({ ...r, from: e.target.value }))}
              aria-label="From date"
              className="h-8 w-36"
            />
            <span className="text-muted-foreground">→</span>
            <DateField
              value={range.to}
              onChange={(e) => setRange((r) => ({ ...r, to: e.target.value }))}
              aria-label="To date"
              className="h-8 w-36"
            />
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {[
          { label: "Total income", value: totals.income, icon: ArrowDownLeft, color: "text-emerald-500 bg-emerald-500/10" },
          { label: "Total expenses", value: totals.expenses, icon: ArrowUpRight, color: "text-rose-500 bg-rose-500/10" },
          { label: "Net savings", value: totals.savings, icon: PiggyBank, color: "text-indigo-500 bg-indigo-500/10" },
          { label: "Savings rate", value: totals.rate, icon: TrendingUp, color: "text-violet-500 bg-violet-500/10", suffix: "%" },
          { label: "Transactions", value: totals.count, icon: ArrowDownLeft, color: "text-sky-500 bg-sky-500/10", plain: true },
        ].map(({ label, value, icon: Icon, color, suffix, plain }) => (
          <Card key={label} className="p-4">
            <span className={cn("flex h-8 w-8 items-center justify-center rounded-lg", color)}>
              <Icon className="h-4 w-4" aria-hidden />
            </span>
            <p className="mt-3 truncate text-lg font-bold tabular-nums">
              {plain ? value.toLocaleString("en-IN") : formatCurrency(value as number, currency, { maximumFractionDigits: 0 })}
              {suffix}
            </p>
            <p className="text-xs text-muted-foreground">{label}</p>
          </Card>
        ))}
      </div>

      {/* Monthly bar chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Monthly income vs expenses</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthly} margin={{ top: 8, right: 8, left: 0, bottom: 0 }} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  width={52}
                  tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                  tickFormatter={(v: number) => new Intl.NumberFormat("en-IN", { notation: "compact", maximumFractionDigits: 1 }).format(v)}
                />
                <Tooltip cursor={{ fill: "hsl(var(--muted) / 0.4)" }} content={<ChartTooltip currency={currency} />} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
                <Bar dataKey="income" name="Income" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} maxBarSize={22} />
                <Bar dataKey="expenses" name="Expenses" fill="hsl(var(--chart-3))" radius={[4, 4, 0, 0]} maxBarSize={22} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Expense donut */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Expenses by category</CardTitle>
          </CardHeader>
          <CardContent>
            {expenseSlices.length === 0 ? (
              <p className="py-12 text-center text-sm text-muted-foreground">No expenses in this period</p>
            ) : (
              <div className="flex flex-col items-center gap-6 sm:flex-row">
                <div className="h-56 w-56 shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Tooltip content={<ChartTooltip currency={currency} />} />
                      <Pie data={expenseSlices} dataKey="value" nameKey="name" innerRadius={62} outerRadius={88} paddingAngle={2} strokeWidth={0}>
                        {expenseSlices.map((slice, index) => (
                          <Cell key={index} fill={slice.fill} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <ul className="w-full flex-1 space-y-2">
                  {expenseSlices.slice(0, 7).map((slice, index) => (
                    <li key={index} className="flex items-center gap-2 text-sm">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: slice.fill }} aria-hidden />
                      <span className="min-w-0 flex-1 truncate text-muted-foreground">{slice.name}</span>
                      <span className="font-medium tabular-nums">{formatCurrency(slice.value, currency)}</span>
                      <span className="w-10 text-right text-xs tabular-nums text-muted-foreground">
                        {totals.expenses > 0 ? Math.round((slice.value / totals.expenses) * 100) : 0}%
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Income donut */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Income sources</CardTitle>
          </CardHeader>
          <CardContent>
            {incomeSlices.length === 0 ? (
              <p className="py-12 text-center text-sm text-muted-foreground">No income in this period</p>
            ) : (
              <div className="flex flex-col items-center gap-6 sm:flex-row">
                <div className="h-56 w-56 shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Tooltip content={<ChartTooltip currency={currency} />} />
                      <Pie data={incomeSlices} dataKey="value" nameKey="name" innerRadius={62} outerRadius={88} paddingAngle={2} strokeWidth={0}>
                        {incomeSlices.map((slice, index) => (
                          <Cell key={index} fill={slice.fill} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <ul className="w-full flex-1 space-y-2">
                  {incomeSlices.slice(0, 7).map((slice, index) => (
                    <li key={index} className="flex items-center gap-2 text-sm">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: slice.fill }} aria-hidden />
                      <span className="min-w-0 flex-1 truncate text-muted-foreground">{slice.name}</span>
                      <span className="font-medium tabular-nums">{formatCurrency(slice.value, currency)}</span>
                      <span className="w-10 text-right text-xs tabular-nums text-muted-foreground">
                        {totals.income > 0 ? Math.round((slice.value / totals.income) * 100) : 0}%
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Daily spending trend */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Daily spending — last 30 days</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dailyTrend} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="spend-fill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(var(--chart-3))" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="hsl(var(--chart-3))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} interval="preserveStartEnd" minTickGap={24} />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    width={52}
                    tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                    tickFormatter={(v: number) => new Intl.NumberFormat("en-IN", { notation: "compact", maximumFractionDigits: 1 }).format(v)}
                  />
                  <Tooltip content={<ChartTooltip currency={currency} />} />
                  <Area type="monotone" dataKey="value" name="Spent" stroke="hsl(var(--chart-3))" strokeWidth={2} fill="url(#spend-fill)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Top categories */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Top spending categories</CardTitle>
          </CardHeader>
          <CardContent>
            {topCategories.length === 0 ? (
              <p className="py-12 text-center text-sm text-muted-foreground">No data in this period</p>
            ) : (
              <ul className="space-y-4">
                {topCategories.slice(0, 6).map((category) => (
                  <li key={category.name}>
                    <div className="mb-1.5 flex items-center justify-between text-sm">
                      <span className="font-medium">{category.name}</span>
                      <span className="font-semibold tabular-nums">
                        {formatCurrency(category.value, currency)}
                        <span className="ml-2 text-xs font-normal text-muted-foreground">
                          {totals.expenses > 0 ? Math.round((category.value / totals.expenses) * 100) : 0}%
                        </span>
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${totals.expenses > 0 ? (category.value / totals.expenses) * 100 : 0}%`,
                          backgroundColor: category.color,
                        }}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
