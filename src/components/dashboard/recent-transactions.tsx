"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/empty-state";
import { CategoryIcon } from "@/components/shared/category-icon";
import { AmountText } from "@/components/shared/amount-text";
import { formatDayLabel } from "@/lib/format";
import { PAYMENT_METHOD_LABELS } from "@/lib/constants";
import type { TransactionDTO } from "@/lib/types";

interface RecentTransactionsProps {
  transactions: TransactionDTO[];
  currency: string;
}

export function RecentTransactions({ transactions, currency }: RecentTransactionsProps) {
  if (transactions.length === 0) {
    return (
      <EmptyState
        title="No transactions yet"
        description="Add your first income or expense to see it here."
      />
    );
  }

  return (
    <div className="space-y-1">
      <ul className="divide-y">
        {transactions.map((transaction) => (
          <li key={transaction.id} className="flex items-center gap-3 py-2.5">
            <CategoryIcon
              icon={transaction.category.icon}
              color={transaction.category.color}
              size="md"
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{transaction.description}</p>
              <p className="truncate text-xs text-muted-foreground">
                {transaction.category.name} · {PAYMENT_METHOD_LABELS[transaction.paymentMethod]}
              </p>
            </div>
            <div className="hidden sm:block">
              <Badge variant={transaction.type === "INCOME" ? "income" : "expense"}>
                {transaction.type === "INCOME" ? "Income" : "Expense"}
              </Badge>
            </div>
            <div className="w-16 text-right sm:w-24">
              <AmountText
                amount={transaction.amount}
                type={transaction.type}
                currency={currency}
                className="text-sm"
              />
              <p className="text-[11px] text-muted-foreground">
                {formatDayLabel(transaction.date)}
              </p>
            </div>
          </li>
        ))}
      </ul>

      <div className="flex justify-end pt-2">
        <Button asChild variant="ghost" size="sm">
          <Link href="/transactions">
            View all
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </Button>
      </div>
    </div>
  );
}
