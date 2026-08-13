"use client";

import { format } from "date-fns";
import { ArrowDownLeft, ArrowUpRight, Crown, PiggyBank, TrendingDown } from "lucide-react";

import { Progress } from "@/components/ui/progress";
import { formatCurrency } from "@/lib/format";
import type { FinancialSummary } from "@/lib/types";

interface FinancialSummaryCardProps {
  summary: FinancialSummary;
  currency: string;
}

export function FinancialSummaryCard({ summary, currency }: FinancialSummaryCardProps) {
  const monthLabel = format(new Date(summary.month), "MMMM yyyy");

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold">{monthLabel}</p>
          <p className="text-xs text-muted-foreground">
            {summary.transactionCount} transaction{summary.transactionCount === 1 ? "" : "s"}
          </p>
        </div>
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <PiggyBank className="h-4.5 w-4.5" aria-hidden />
        </span>
      </div>

      <div className="space-y-2.5">
        <div className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2.5">
          <span className="flex items-center gap-2 text-sm text-muted-foreground">
            <ArrowDownLeft className="h-4 w-4 text-emerald-500" aria-hidden />
            Income
          </span>
          <span className="text-sm font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
            {formatCurrency(summary.income, currency)}
          </span>
        </div>
        <div className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2.5">
          <span className="flex items-center gap-2 text-sm text-muted-foreground">
            <ArrowUpRight className="h-4 w-4 text-rose-500" aria-hidden />
            Expenses
          </span>
          <span className="text-sm font-semibold tabular-nums">
            {formatCurrency(summary.expenses, currency)}
          </span>
        </div>
        <div className="flex items-center justify-between rounded-lg border px-3 py-2.5">
          <span className="flex items-center gap-2 text-sm font-medium">
            <PiggyBank className="h-4 w-4 text-primary" aria-hidden />
            Savings
          </span>
          <span className="text-sm font-bold tabular-nums">
            {formatCurrency(summary.savings, currency)}
          </span>
        </div>
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Savings rate</span>
          <span className="font-semibold tabular-nums">{summary.savingsRate.toFixed(1)}%</span>
        </div>
        <Progress
          value={Math.min(summary.savingsRate, 100)}
          indicatorClassName="bg-gradient-to-r from-emerald-500 to-teal-500"
        />
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="rounded-lg border p-2.5">
          <p className="flex items-center gap-1 text-muted-foreground">
            <Crown className="h-3 w-3 text-amber-500" aria-hidden />
            Top category
          </p>
          {summary.topCategory ? (
            <>
              <p className="mt-1 truncate font-medium">{summary.topCategory.name}</p>
              <p className="font-semibold tabular-nums">
                {formatCurrency(summary.topCategory.amount, currency)}
              </p>
            </>
          ) : (
            <p className="mt-1 text-muted-foreground">—</p>
          )}
        </div>
        <div className="rounded-lg border p-2.5">
          <p className="flex items-center gap-1 text-muted-foreground">
            <TrendingDown className="h-3 w-3 text-rose-500" aria-hidden />
            Largest expense
          </p>
          {summary.largestExpense ? (
            <>
              <p className="mt-1 truncate font-medium">{summary.largestExpense.description}</p>
              <p className="font-semibold tabular-nums">
                {formatCurrency(summary.largestExpense.amount, currency)}
              </p>
            </>
          ) : (
            <p className="mt-1 text-muted-foreground">—</p>
          )}
        </div>
      </div>
    </div>
  );
}
