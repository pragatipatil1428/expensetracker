"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { RecurringForm } from "@/components/recurring/recurring-form";
import type { CategoryDTO, RecurringDTO } from "@/lib/types";

interface RecurringDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: CategoryDTO[];
  currency: string;
  recurring?: RecurringDTO | null;
  onSaved?: () => void;
}

export function RecurringDialog({
  open,
  onOpenChange,
  categories,
  currency,
  recurring,
  onSaved,
}: RecurringDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>
            {recurring ? "Edit recurring transaction" : "Add recurring transaction"}
          </DialogTitle>
          <DialogDescription>
            {recurring
              ? "Update the schedule details."
              : "Salary, rent, subscriptions, EMIs — set it once, and FinTrack handles the rest."}
          </DialogDescription>
        </DialogHeader>
        <RecurringForm
          key={recurring?.id ?? "new"}
          categories={categories}
          currency={currency}
          recurring={recurring}
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
