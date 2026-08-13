"use client";

import * as React from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Pencil,
  PiggyBank,
  Plus,
  Trash2,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { toast } from "sonner";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { CategoryIcon } from "@/components/shared/category-icon";
import { ChartTooltip } from "@/components/charts/chart-tooltip";
import { BudgetDialog } from "@/components/budgets/budget-dialog";
import { deleteBudgetAction, getBudgetsAction } from "@/actions/budgets";
import { getCategoriesAction } from "@/actions/categories";
import { getMeAction } from "@/actions/dashboard";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { BudgetDTO } from "@/lib/types";

export function BudgetsManager() {
  const queryClient = useQueryClient();
  const [period, setPeriod] = React.useState<"MONTHLY" | "YEARLY">("MONTHLY");
  const [month, setMonth] = React.useState(new Date().getMonth());
  const [year, setYear] = React.useState(new Date().getFullYear());
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<BudgetDTO | null>(null);
  const [deleteTarget, setDeleteTarget] = React.useState<BudgetDTO | null>(null);
  const [deleting, setDeleting] = React.useState(false);

  const me = useQuery({
    queryKey: ["me"],
    queryFn: async () => {
      const result = await getMeAction();
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

  const budgetsQuery = useQuery({
    queryKey: ["budgets", period, month, year],
    queryFn: async () => {
      const result = await getBudgetsAction(period, month, year);
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
  });

  const currency = me.data?.currency ?? "INR";
  const categories = categoriesQuery.data ?? [];
  const data = budgetsQuery.data;

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["budgets"] });
    queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    queryClient.invalidateQueries({ queryKey: ["notifications"] });
  };

  const goPrev = () => {
    if (period === "MONTHLY") {
      if (month === 0) {
        setMonth(11);
        setYear((y) => y - 1);
      } else {
        setMonth((m) => m - 1);
      }
    } else {
      setYear((y) => y - 1);
    }
  };

  const goNext = () => {
    if (period === "MONTHLY") {
      if (month === 11) {
        setMonth(0);
        setYear((y) => y + 1);
      } else {
        setMonth((m) => m + 1);
      }
    } else {
      setYear((y) => y + 1);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const result = await deleteBudgetAction(deleteTarget.id);
      if (result.success) {
        toast.success("Budget deleted");
        setDeleteTarget(null);
        invalidate();
      } else {
        toast.error(result.error);
      }
    } finally {
      setDeleting(false);
    }
  };

  const periodLabel =
    period === "MONTHLY"
      ? format(new Date(year, month, 1), "MMMM yyyy")
      : String(year);

  const chartData =
    data?.budgets.map((budget) => ({
      name: budget.category?.name ?? budget.name,
      budget: budget.amount,
      spent: budget.spent,
    })) ?? [];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Budgets</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Set limits, track usage and stay on top of your spending.
          </p>
        </div>
        <Button onClick={() => { setEditing(null); setDialogOpen(true); }}>
          <Plus className="h-4 w-4" aria-hidden />
          Create Budget
        </Button>
      </div>

      {/* Period + navigation */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex rounded-lg bg-muted p-1" role="tablist" aria-label="Budget period">
          {(["MONTHLY", "YEARLY"] as const).map((value) => (
            <button
              key={value}
              role="tab"
              aria-selected={period === value}
              onClick={() => setPeriod(value)}
              className={cn(
                "rounded-md px-4 py-1.5 text-sm font-medium transition-all",
                period === value
                  ? "bg-background text-foreground shadow"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {value === "MONTHLY" ? "Monthly" : "Yearly"}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon-sm" onClick={goPrev} aria-label="Previous period">
            <ChevronLeft className="h-4 w-4" aria-hidden />
          </Button>
          <span className="min-w-32 text-center text-sm font-semibold">{periodLabel}</span>
          <Button
            variant="outline"
            size="icon-sm"
            onClick={goNext}
            aria-label="Next period"
            disabled={
              period === "MONTHLY"
                ? month === new Date().getMonth() && year === new Date().getFullYear()
                : year >= new Date().getFullYear()
            }
          >
            <ChevronRight className="h-4 w-4" aria-hidden />
          </Button>
        </div>
      </div>

      {budgetsQuery.isLoading ? (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-44 w-full" />
            ))}
          </div>
        </div>
      ) : budgetsQuery.isError ? (
        <ErrorState onRetry={() => budgetsQuery.refetch()} />
      ) : data && data.budgets.length === 0 ? (
        <EmptyState
          icon={PiggyBank}
          title={`No budgets for ${periodLabel}`}
          description="Create a monthly or category budget to start tracking spending limits."
          action={
            <Button onClick={() => { setEditing(null); setDialogOpen(true); }}>
              <Plus className="h-4 w-4" aria-hidden />
              Create budget
            </Button>
          }
        />
      ) : (
        <>
          {/* Summary cards */}
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Card className="p-5">
              <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <PiggyBank className="h-4 w-4 text-primary" aria-hidden />
                Total budget
              </p>
              <p className="mt-2 text-2xl font-bold tabular-nums">
                {formatCurrency(data?.totalBudget ?? 0, currency, { maximumFractionDigits: 0 })}
              </p>
            </Card>
            <Card className="p-5">
              <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <TrendingUp className="h-4 w-4 text-rose-500" aria-hidden />
                Total spent
              </p>
              <p className="mt-2 text-2xl font-bold tabular-nums">
                {formatCurrency(data?.totalSpent ?? 0, currency, { maximumFractionDigits: 0 })}
              </p>
            </Card>
            <Card className="p-5">
              <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <TrendingDown className="h-4 w-4 text-emerald-500" aria-hidden />
                Remaining
              </p>
              <p className="mt-2 text-2xl font-bold tabular-nums">
                {formatCurrency(data?.remaining ?? 0, currency, { maximumFractionDigits: 0 })}
              </p>
            </Card>
            <Card className="p-5">
              <p className="text-sm text-muted-foreground">Utilization</p>
              <div className="mt-3 flex items-center gap-2">
                <Progress
                  value={Math.min(data?.utilization ?? 0, 100)}
                  className="flex-1"
                  indicatorClassName={cn(
                    (data?.utilization ?? 0) >= 100
                      ? "bg-rose-500"
                      : (data?.utilization ?? 0) >= 80
                        ? "bg-amber-500"
                        : "bg-gradient-to-r from-primary to-violet-500",
                  )}
                />
                <span className="text-sm font-bold tabular-nums">
                  {(data?.utilization ?? 0).toFixed(0)}%
                </span>
              </div>
            </Card>
          </div>

          {/* Budget vs actual chart */}
          {chartData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Budget vs actual</CardTitle>
                <p className="text-sm text-muted-foreground">{periodLabel}</p>
              </CardHeader>
              <CardContent>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }} barGap={4}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                      <XAxis
                        dataKey="name"
                        tickLine={false}
                        axisLine={false}
                        tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                        interval="preserveStartEnd"
                        minTickGap={24}
                      />
                      <YAxis
                        tickLine={false}
                        axisLine={false}
                        width={52}
                        tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                        tickFormatter={(v: number) =>
                          new Intl.NumberFormat("en-IN", { notation: "compact", maximumFractionDigits: 1 }).format(v)
                        }
                      />
                      <Tooltip cursor={{ fill: "hsl(var(--muted) / 0.4)" }} content={<ChartTooltip currency={currency} />} />
                      <Bar dataKey="budget" name="Budget" fill="hsl(var(--chart-4))" radius={[4, 4, 0, 0]} maxBarSize={24} />
                      <Bar dataKey="spent" name="Spent" fill="hsl(var(--chart-3))" radius={[4, 4, 0, 0]} maxBarSize={24} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Budget cards */}
          <div className="grid gap-4 sm:grid-cols-2">
            {data!.budgets.map((budget) => {
              const status =
                budget.status === "exceeded"
                  ? { icon: AlertTriangle, label: "Budget exceeded", className: "text-rose-600 dark:text-rose-400 bg-rose-500/10" }
                  : budget.status === "approaching"
                    ? { icon: AlertTriangle, label: "Approaching budget", className: "text-amber-600 dark:text-amber-400 bg-amber-500/10" }
                    : { icon: CheckCircle2, label: "On track", className: "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10" };
              const StatusIcon = status.icon;
              return (
                <Card key={budget.id} className="group p-5 transition-all hover:shadow-md">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      {budget.category ? (
                        <CategoryIcon
                          icon={budget.category.icon}
                          color={budget.category.color}
                          size="lg"
                        />
                      ) : (
                        <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                          <PiggyBank className="h-6 w-6" aria-hidden />
                        </span>
                      )}
                      <div>
                        <h3 className="text-sm font-semibold">{budget.name}</h3>
                        <p className="text-xs text-muted-foreground">
                          {formatCurrency(budget.amount, currency)} /{" "}
                          {budget.period === "MONTHLY" ? "month" : "year"}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => { setEditing(budget); setDialogOpen(true); }}
                        aria-label={`Edit ${budget.name}`}
                      >
                        <Pencil className="h-3.5 w-3.5" aria-hidden />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => setDeleteTarget(budget)}
                        aria-label={`Delete ${budget.name}`}
                      >
                        <Trash2 className="h-3.5 w-3.5" aria-hidden />
                      </Button>
                    </div>
                  </div>

                  <div className="mt-4 flex items-end justify-between">
                    <p className="text-2xl font-bold tabular-nums">
                      {formatCurrency(budget.spent, currency, { maximumFractionDigits: 0 })}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {budget.remaining > 0 ? `${formatCurrency(budget.remaining, currency, { maximumFractionDigits: 0 })} left` : `Over by ${formatCurrency(budget.spent - budget.amount, currency, { maximumFractionDigits: 0 })}`}
                    </p>
                  </div>

                  <Progress
                    value={Math.min(budget.utilization, 100)}
                    className="mt-2 h-2.5"
                    indicatorClassName={cn(
                      budget.status === "exceeded"
                        ? "bg-rose-500"
                        : budget.status === "approaching"
                          ? "bg-amber-500"
                          : "bg-gradient-to-r from-primary to-violet-500",
                    )}
                  />
                  <div className="mt-3 flex items-center justify-between">
                    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium", status.className)}>
                      <StatusIcon className="h-3.5 w-3.5" aria-hidden />
                      {status.label}
                    </span>
                    <span className="text-xs font-semibold tabular-nums text-muted-foreground">
                      {budget.utilization.toFixed(0)}% used
                    </span>
                  </div>
                </Card>
              );
            })}
          </div>
        </>
      )}

      <BudgetDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        categories={categories}
        currency={currency}
        budget={editing}
        onSaved={invalidate}
      />

      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title={`Delete "${deleteTarget?.name}"?`}
        description="This budget will be permanently removed. Your transactions will not be affected."
        confirmLabel="Delete"
        variant="destructive"
        loading={deleting}
        onConfirm={handleDelete}
      />
    </div>
  );
}
