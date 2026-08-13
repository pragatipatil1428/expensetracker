"use client";

import * as React from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { PiggyBank, Save } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/shared/form-field";
import { Spinner } from "@/components/ui/spinner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createBudgetAction, updateBudgetAction } from "@/actions/budgets";
import { budgetSchema, type BudgetInput } from "@/schemas/transaction";
import type { BudgetDTO, CategoryDTO } from "@/lib/types";

interface BudgetFormProps {
  categories: CategoryDTO[];
  currency: string;
  budget?: BudgetDTO | null;
  onSaved: () => void;
  onCancel?: () => void;
}

export function BudgetForm({
  categories,
  currency,
  budget,
  onSaved,
  onCancel,
}: BudgetFormProps) {
  const [submitting, setSubmitting] = React.useState(false);
  const expenseCategories = categories.filter((c) => c.type === "EXPENSE");

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<BudgetInput>({
    resolver: zodResolver(budgetSchema),
    defaultValues: {
      name: budget?.name ?? "",
      amount: budget?.amount ?? 0,
      period: budget?.period ?? "MONTHLY",
      categoryId: budget?.categoryId ?? undefined,
    },
  });

  const onSubmit = async (values: BudgetInput) => {
    setSubmitting(true);
    try {
      const result = budget
        ? await updateBudgetAction(budget.id, values)
        : await createBudgetAction(values);
      if (result.success) {
        toast.success(budget ? "Budget updated" : "Budget created");
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
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Budget name" htmlFor="name" error={errors.name?.message} required>
          <Input
            id="name"
            placeholder="e.g. Monthly groceries"
            aria-invalid={Boolean(errors.name)}
            {...register("name")}
          />
        </FormField>

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
              placeholder="0.00"
              className="pl-12 font-semibold tabular-nums"
              aria-invalid={Boolean(errors.amount)}
              {...register("amount", { valueAsNumber: true })}
            />
          </div>
        </FormField>
      </div>

      <FormField
        label="Period"
        error={errors.period?.message}
        required
      >
        <Controller
          control={control}
          name="period"
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger aria-label="Period">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="MONTHLY">Monthly</SelectItem>
                <SelectItem value="YEARLY">Yearly</SelectItem>
              </SelectContent>
            </Select>
          )}
        />
      </FormField>

      <FormField
        label="Category"
        error={errors.categoryId?.message}
        hint="Leave empty for an overall budget"
      >
        <Controller
          control={control}
          name="categoryId"
          render={({ field }) => (
            <Select
              value={field.value || "none"}
              onValueChange={(value) => field.onChange(value === "none" ? undefined : value)}
            >
              <SelectTrigger aria-label="Category">
                <SelectValue placeholder="Overall budget" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">— Overall budget —</SelectItem>
                {expenseCategories.map((category) => (
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

      <div className="flex items-start gap-2 rounded-lg border bg-muted/40 p-3 text-xs text-muted-foreground">
        <PiggyBank className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
        <p>
          Category budgets track spending in that category. Overall budgets track all
          expenses for the {""}
          period. You&apos;ll get notified at 80% and when the budget is exceeded.
        </p>
      </div>

      <div className="flex justify-end gap-2 pt-1">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} disabled={submitting}>
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={submitting}>
          {submitting ? <Spinner /> : <Save className="h-4 w-4" aria-hidden />}
          {budget ? "Save changes" : "Create budget"}
        </Button>
      </div>
    </form>
  );
}
