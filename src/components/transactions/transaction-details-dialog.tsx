"use client";

import { format } from "date-fns";
import { CalendarDays, Pencil, StickyNote, Trash2 } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CategoryIcon } from "@/components/shared/category-icon";
import { AmountText } from "@/components/shared/amount-text";
import { PAYMENT_METHOD_LABELS } from "@/lib/constants";
import { PAYMENT_METHOD_ICONS } from "@/lib/icons";
import type { TransactionDTO } from "@/lib/types";

interface TransactionDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transaction: TransactionDTO | null;
  currency: string;
  onEdit: (transaction: TransactionDTO) => void;
  onDelete: (transaction: TransactionDTO) => void;
}

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-right text-sm font-medium">{children}</span>
    </div>
  );
}

export function TransactionDetailsDialog({
  open,
  onOpenChange,
  transaction,
  currency,
  onEdit,
  onDelete,
}: TransactionDetailsDialogProps) {
  if (!transaction) return null;
  const MethodIcon = PAYMENT_METHOD_ICONS[transaction.paymentMethod] ?? PAYMENT_METHOD_ICONS.OTHER;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-start gap-3">
            <CategoryIcon
              icon={transaction.category.icon}
              color={transaction.category.color}
              size="lg"
            />
            <div className="min-w-0">
              <DialogTitle className="text-xl">{transaction.description}</DialogTitle>
              <DialogDescription className="flex items-center gap-2">
                <Badge variant={transaction.type === "INCOME" ? "income" : "expense"}>
                  {transaction.type === "INCOME" ? "Income" : "Expense"}
                </Badge>
                <span>{transaction.category.name}</span>
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="rounded-xl border bg-muted/40 p-4">
          <AmountText
            amount={transaction.amount}
            type={transaction.type}
            currency={currency}
            className="text-3xl"
          />
          {transaction.isRecurring && (
            <p className="mt-1 text-xs text-muted-foreground">
              Created from a recurring schedule
            </p>
          )}
        </div>

        <div className="divide-y">
          <DetailRow label="Date">
            <span className="flex items-center gap-1.5">
              <CalendarDays className="h-3.5 w-3.5 text-muted-foreground" aria-hidden />
              {format(new Date(transaction.date), "EEEE, MMM d, yyyy")}
            </span>
          </DetailRow>
          <DetailRow label="Payment method">
            <span className="flex items-center gap-1.5">
              <MethodIcon className="h-3.5 w-3.5 text-muted-foreground" aria-hidden />
              {PAYMENT_METHOD_LABELS[transaction.paymentMethod]}
            </span>
          </DetailRow>
          <DetailRow label="Account">{transaction.account ?? "—"}</DetailRow>
          {transaction.notes && (
            <DetailRow label="Notes">
              <span className="flex items-start justify-end gap-1.5 text-right">
                <StickyNote className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden />
                {transaction.notes}
              </span>
            </DetailRow>
          )}
          <DetailRow label="Tags">
            <span className="flex flex-wrap justify-end gap-1">
              {transaction.tags.length > 0 ? (
                transaction.tags.map((tag) => (
                  <Badge key={tag.id} variant="secondary">
                    #{tag.name}
                  </Badge>
                ))
              ) : (
                "—"
              )}
            </span>
          </DetailRow>
        </div>

        <Separator />

        <div className="flex items-center justify-between text-[11px] text-muted-foreground">
          <span>
            Added {format(new Date(transaction.createdAt), "MMM d, yyyy")} · Updated{" "}
            {format(new Date(transaction.updatedAt), "MMM d, yyyy")}
          </span>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => {
              onOpenChange(false);
              onEdit(transaction);
            }}
          >
            <Pencil className="h-4 w-4" aria-hidden />
            Edit
          </Button>
          <Button
            variant="destructive"
            className="flex-1"
            onClick={() => {
              onOpenChange(false);
              onDelete(transaction);
            }}
          >
            <Trash2 className="h-4 w-4" aria-hidden />
            Delete
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

