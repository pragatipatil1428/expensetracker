"use client";

import Link from "next/link";
import { ArrowRight, PiggyBank } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { BudgetDTO } from "@/lib/types";

interface BudgetUtilizationProps {
  budgets: BudgetDTO[];
  currency: string;
  totalBudget: number;
  totalSpent: number;
  utilization: number;
}

export function BudgetUtilization({
  budgets,
  currency,
  totalBudget,
  totalSpent,
  utilization,
}: BudgetUtilizationProps) {
  if (budgets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
          <PiggyBank className="h-5 w-5 text-muted-foreground" aria-hidden />
        </span>
        <p className="text-sm font-medium">No budgets set</p>
        <p className="max-w-xs text-xs text-muted-foreground">
          Create a budget to track your spending limits.
        </p>
        <Button asChild variant="outline" size="sm" className="mt-2">
          <Link href="/budgets">Set a budget</Link>
        </Button>
      </div>
    );
  }

  const displayed = budgets.slice(0, 4);

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <div className="flex items-end justify-between">
          <p className="text-2xl font-bold tabular-nums">
            {formatCurrency(totalSpent, currency, { maximumFractionDigits: 0 })}
          </p>
          <p className="text-xs text-muted-foreground">
            of {formatCurrency(totalBudget, currency, { maximumFractionDigits: 0 })}
          </p>
        </div>
        <Progress
          value={Math.min(utilization, 100)}
          indicatorClassName={cn(
            utilization >= 100
              ? "bg-rose-500"
              : utilization >= 80
                ? "bg-amber-500"
                : "bg-gradient-to-r from-primary to-violet-500",
          )}
        />
        <p className="text-right text-xs font-medium tabular-nums text-muted-foreground">
          {utilization.toFixed(0)}% used
        </p>
      </div>

      <ul className="space-y-3">
        {displayed.map((budget) => (
          <li key={budget.id}>
            <div className="mb-1 flex items-center justify-between text-xs">
              <span className="font-medium">{budget.category?.name ?? budget.name}</span>
              <span className="tabular-nums text-muted-foreground">
                {budget.utilization.toFixed(0)}%
              </span>
            </div>
            <Progress
              value={Math.min(budget.utilization, 100)}
              className="h-1.5"
              indicatorClassName={cn(
                budget.status === "exceeded"
                  ? "bg-rose-500"
                  : budget.status === "approaching"
                    ? "bg-amber-500"
                    : "bg-primary",
              )}
            />
          </li>
        ))}
      </ul>

      <div className="flex justify-end">
        <Button asChild variant="ghost" size="sm">
          <Link href="/budgets">
            Manage budgets
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </Button>
      </div>
    </div>
  );
}
