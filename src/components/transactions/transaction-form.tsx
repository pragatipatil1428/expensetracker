"use client";

import * as React from "react";
import { useForm, useWatch, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { ArrowDownLeft, ArrowUpRight, Save } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FormField } from "@/components/shared/form-field";
import { DateField } from "@/components/shared/date-field";
import { Spinner } from "@/components/ui/spinner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ACCOUNT_PRESETS, PAYMENT_METHODS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import {
  createTransactionAction,
  updateTransactionAction,
} from "@/actions/transactions";
import { transactionSchema, type TransactionInput } from "@/schemas/transaction";
import type { CategoryDTO, TransactionDTO } from "@/lib/types";

interface TransactionFormProps {
  categories: CategoryDTO[];
  currency: string;
  defaultType?: "INCOME" | "EXPENSE";
  transaction?: TransactionDTO | null;
  onSaved: () => void;
  onCancel?: () => void;
}

function toDefaultValues(
  type: "INCOME" | "EXPENSE",
  transaction?: TransactionDTO | null,
): TransactionInput {
  if (transaction) {
    return {
      type: transaction.type,
      amount: transaction.amount,
      description: transaction.description,
      categoryId: transaction.categoryId,
      date: format(new Date(transaction.date), "yyyy-MM-dd"),
      paymentMethod: transaction.paymentMethod,
      account: transaction.account ?? "",
      notes: transaction.notes ?? "",
      tags: transaction.tags.map((t) => t.name),
    };
  }
  return {
    type,
    amount: 0,
    description: "",
    categoryId: "",
    date: format(new Date(), "yyyy-MM-dd"),
    paymentMethod: "UPI",
    account: "",
    notes: "",
    tags: [],
  };
}

export function TransactionForm({
  categories,
  currency,
  defaultType = "EXPENSE",
  transaction,
  onSaved,
  onCancel,
}: TransactionFormProps) {
  const [submitting, setSubmitting] = React.useState(false);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    reset,
    formState: { errors },
  } = useForm<TransactionInput>({
    resolver: zodResolver(transactionSchema),
    defaultValues: toDefaultValues(defaultType, transaction),
  });

  const type = useWatch({ control, name: "type" });
  const selectedCategoryId = useWatch({ control, name: "categoryId" });
  const typeCategories = categories.filter((c) => c.type === type);

  // When the type changes and the selected category is no longer valid, clear it.
  React.useEffect(() => {
    if (selectedCategoryId && !typeCategories.some((c) => c.id === selectedCategoryId)) {
      setValue("categoryId", "", { shouldValidate: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type, selectedCategoryId]);

  const onSubmit = async (values: TransactionInput) => {
    setSubmitting(true);
    try {
      const result = transaction
        ? await updateTransactionAction(transaction.id, values)
        : await createTransactionAction(values);
      if (result.success) {
        toast.success(transaction ? "Transaction updated" : "Transaction added");
        reset();
        onSaved();
      } else {
        toast.error(result.error);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      {/* Type toggle */}
      <FormField label="Type" error={errors.type?.message} required>
        <div className="grid grid-cols-2 gap-1 rounded-lg bg-muted p-1" role="radiogroup">
          {(
            [
              { value: "EXPENSE", label: "Expense", icon: ArrowUpRight },
              { value: "INCOME", label: "Income", icon: ArrowDownLeft },
            ] as const
          ).map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={type === value}
              onClick={() => setValue("type", value, { shouldValidate: true })}
              className={cn(
                "flex items-center justify-center gap-1.5 rounded-md py-1.5 text-sm font-medium transition-all",
                type === value
                  ? value === "INCOME"
                    ? "bg-emerald-500 text-white shadow"
                    : "bg-foreground text-background shadow"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Icon className="h-4 w-4" aria-hidden />
              {label}
            </button>
          ))}
        </div>
      </FormField>

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Amount" htmlFor="amount" error={errors.amount?.message} required>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
              {currency}
            </span>
            <Input
              id="amount"
              type="number"
              step="0.01"
              min="0.01"
              inputMode="decimal"
              placeholder="0.00"
              className="pl-12 font-semibold tabular-nums"
              aria-invalid={Boolean(errors.amount)}
              {...register("amount", { valueAsNumber: true })}
            />
          </div>
        </FormField>

        <FormField
          label="Date"
          htmlFor="date"
          error={errors.date?.message}
          required
        >
          <DateField
            id="date"
            aria-invalid={Boolean(errors.date)}
            {...register("date")}
          />
        </FormField>
      </div>

      <FormField
        label="Description"
        htmlFor="description"
        error={errors.description?.message}
        required
      >
        <Input
          id="description"
          placeholder="e.g. Groceries at BigBasket"
          aria-invalid={Boolean(errors.description)}
          {...register("description")}
        />
      </FormField>

      <FormField label="Category" error={errors.categoryId?.message} required>
        <Controller
          control={control}
          name="categoryId"
          render={({ field }) => (
            <Select value={field.value || undefined} onValueChange={field.onChange}>
              <SelectTrigger aria-label="Category">
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {typeCategories.length === 0 && (
                  <div className="px-2 py-4 text-center text-xs text-muted-foreground">
                    No {type.toLowerCase()} categories yet. Create one on the Categories page.
                  </div>
                )}
                {typeCategories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    <span className="flex items-center gap-2">
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: category.color }}
                        aria-hidden
                      />
                      {category.name}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
      </FormField>

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Payment method" error={errors.paymentMethod?.message} required>
          <Controller
            control={control}
            name="paymentMethod"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger aria-label="Payment method">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PAYMENT_METHODS.map((method) => (
                    <SelectItem key={method.value} value={method.value}>
                      {method.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </FormField>

        <FormField
          label="Account"
          htmlFor="account"
          error={errors.account?.message}
          hint="Optional"
        >
          <Input
            id="account"
            list="account-presets"
            placeholder="e.g. HDFC Savings"
            {...register("account")}
          />
          <datalist id="account-presets">
            {ACCOUNT_PRESETS.map((account) => (
              <option key={account} value={account} />
            ))}
          </datalist>
        </FormField>
      </div>

      <FormField
        label="Tags"
        htmlFor="tags"
        error={errors.tags?.message}
        hint="Comma-separated, e.g. groceries, weekend"
      >
        <Controller
          control={control}
          name="tags"
          render={({ field }) => (
            <Input
              id="tags"
              placeholder="groceries, essential"
              value={field.value.join(", ")}
              onChange={(e) =>
                field.onChange(
                  e.target.value
                    .split(",")
                    .map((t) => t.trim())
                    .filter(Boolean),
                )
              }
            />
          )}
        />
      </FormField>

      <FormField label="Notes" htmlFor="notes" error={errors.notes?.message}>
        <Textarea
          id="notes"
          rows={3}
          placeholder="Any additional details…"
          {...register("notes")}
        />
      </FormField>

      <div className="flex justify-end gap-2 pt-1">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} disabled={submitting}>
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={submitting}>
          {submitting ? <Spinner /> : <Save className="h-4 w-4" aria-hidden />}
          {transaction ? "Save changes" : "Add transaction"}
        </Button>
      </div>
    </form>
  );
}
