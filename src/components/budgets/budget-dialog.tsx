"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { BudgetForm } from "@/components/budgets/budget-form";
import type { BudgetDTO, CategoryDTO } from "@/lib/types";

interface BudgetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: CategoryDTO[];
  currency: string;
  budget?: BudgetDTO | null;
  onSaved?: () => void;
}

export function BudgetDialog({
  open,
  onOpenChange,
  categories,
  currency,
  budget,
  onSaved,
}: BudgetDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{budget ? "Edit budget" : "Create budget"}</DialogTitle>
          <DialogDescription>
            {budget
              ? "Update the limits of this budget."
              : "Set a spending limit for a category or for the whole month."}
          </DialogDescription>
        </DialogHeader>
        <BudgetForm
          key={budget?.id ?? "new"}
          categories={categories}
          currency={currency}
          budget={budget}
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
