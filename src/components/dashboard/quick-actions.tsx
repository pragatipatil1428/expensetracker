"use client";

import * as React from "react";
import { ArrowDownLeft, ArrowUpRight, PiggyBank, Repeat } from "lucide-react";

import { Button } from "@/components/ui/button";
import { TransactionDialog } from "@/components/transactions/transaction-dialog";
import { BudgetDialog } from "@/components/budgets/budget-dialog";
import { RecurringDialog } from "@/components/recurring/recurring-dialog";
import type { CategoryDTO } from "@/lib/types";

interface QuickActionsProps {
  categories: CategoryDTO[];
  currency: string;
  onDataChanged: () => void;
}

export function QuickActions({ categories, currency, onDataChanged }: QuickActionsProps) {
  const [expenseOpen, setExpenseOpen] = React.useState(false);
  const [incomeOpen, setIncomeOpen] = React.useState(false);
  const [budgetOpen, setBudgetOpen] = React.useState(false);
  const [recurringOpen, setRecurringOpen] = React.useState(false);

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <Button onClick={() => setExpenseOpen(true)}>
          <ArrowUpRight className="h-4 w-4" aria-hidden />
          Add Expense
        </Button>
        <Button variant="outline" onClick={() => setIncomeOpen(true)}>
          <ArrowDownLeft className="h-4 w-4 text-emerald-500" aria-hidden />
          Add Income
        </Button>
        <Button variant="outline" onClick={() => setBudgetOpen(true)}>
          <PiggyBank className="h-4 w-4" aria-hidden />
          Create Budget
        </Button>
        <Button variant="outline" onClick={() => setRecurringOpen(true)}>
          <Repeat className="h-4 w-4" aria-hidden />
          Add Recurring
        </Button>
      </div>

      <TransactionDialog
        open={expenseOpen}
        onOpenChange={setExpenseOpen}
        categories={categories}
        currency={currency}
        defaultType="EXPENSE"
        onSaved={onDataChanged}
      />
      <TransactionDialog
        open={incomeOpen}
        onOpenChange={setIncomeOpen}
        categories={categories}
        currency={currency}
        defaultType="INCOME"
        onSaved={onDataChanged}
      />
      <BudgetDialog
        open={budgetOpen}
        onOpenChange={setBudgetOpen}
        categories={categories}
        currency={currency}
        onSaved={onDataChanged}
      />
      <RecurringDialog
        open={recurringOpen}
        onOpenChange={setRecurringOpen}
        categories={categories}
        currency={currency}
        onSaved={onDataChanged}
      />
    </>
  );
}
