"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { TransactionForm } from "@/components/transactions/transaction-form";
import type { CategoryDTO, TransactionDTO } from "@/lib/types";

interface TransactionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: CategoryDTO[];
  currency: string;
  defaultType?: "INCOME" | "EXPENSE";
  transaction?: TransactionDTO | null;
  onSaved?: () => void;
}

export function TransactionDialog({
  open,
  onOpenChange,
  categories,
  currency,
  defaultType = "EXPENSE",
  transaction,
  onSaved,
}: TransactionDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>
            {transaction ? "Edit transaction" : "Add transaction"}
          </DialogTitle>
          <DialogDescription>
            {transaction
              ? "Update the details of this transaction."
              : "Record an income or expense in seconds."}
          </DialogDescription>
        </DialogHeader>
        <TransactionForm
          key={transaction?.id ?? "new"}
          categories={categories}
          currency={currency}
          defaultType={defaultType}
          transaction={transaction}
          onSaved={() => {
            onOpenChange(false);
            onSaved?.();
          }}
          onCancel={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
