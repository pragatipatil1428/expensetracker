"use client";

import * as React from "react";
import { useForm, useWatch, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { ArrowDownLeft, ArrowUpRight, RefreshCw, Save } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/shared/form-field";
import { DateField } from "@/components/shared/date-field";
import { Spinner } from "@/components/ui/spinner";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FREQUENCIES, PAYMENT_METHODS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import {
  createRecurringAction,
  updateRecurringAction,
} from "@/actions/recurring";
import { recurringSchema, type RecurringInput } from "@/schemas/transaction";
import type { CategoryDTO, RecurringDTO } from "@/lib/types";

interface RecurringFormProps {
  categories: CategoryDTO[];
  currency: string;
  recurring?: RecurringDTO | null;
  onSaved: () => void;
  onCancel?: () => void;
}

function toDefaultValues(
  type: "INCOME" | "EXPENSE",
  recurring?: RecurringDTO | null,
): RecurringInput {
  if (recurring) {
    return {
      name: recurring.name,
      type: recurring.type,
      amount: recurring.amount,
      categoryId: recurring.categoryId,
      frequency: recurring.frequency,
      startDate: format(new Date(recurring.startDate), "yyyy-MM-dd"),
      endDate: recurring.endDate ? format(new Date(recurring.endDate), "yyyy-MM-dd") : "",
      paymentMethod: recurring.paymentMethod,
      account: recurring.account ?? "",
      isActive: recurring.isActive,
    };
  }
  return {
    name: "",
    type,
    amount: 0,
    categoryId: "",
    frequency: "MONTHLY",
    startDate: format(new Date(), "yyyy-MM-dd"),
    endDate: "",
    paymentMethod: "UPI",
    account: "",
    isActive: true,
  };
}

export function RecurringForm({
  categories,
  currency,
  recurring,
  onSaved,
  onCancel,
}: RecurringFormProps) {
  const [submitting, setSubmitting] = React.useState(false);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors },
  } = useForm<RecurringInput>({
    resolver: zodResolver(recurringSchema),
    defaultValues: toDefaultValues("EXPENSE", recurring),
  });

  const type = useWatch({ control, name: "type" });
  const selectedCategoryId = useWatch({ control, name: "categoryId" });
  const typeCategories = categories.filter((c) => c.type === type);

  React.useEffect(() => {
    if (selectedCategoryId && !typeCategories.some((c) => c.id === selectedCategoryId)) {
      setValue("categoryId", "", { shouldValidate: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type, selectedCategoryId]);

  const onSubmit = async (values: RecurringInput) => {
    setSubmitting(true);
    try {
      const result = recurring
        ? await updateRecurringAction(recurring.id, values)
        : await createRecurringAction(values);
      if (result.success) {
        toast.success(recurring ? "Recurring transaction updated" : "Recurring transaction added");
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

      <FormField label="Name" htmlFor="name" error={errors.name?.message} required>
        <Input
          id="name"
          placeholder="e.g. Netflix subscription"
          aria-invalid={Boolean(errors.name)}
          {...register("name")}
        />
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
              placeholder="0.00"
              className="pl-12 font-semibold tabular-nums"
              aria-invalid={Boolean(errors.amount)}
              {...register("amount", { valueAsNumber: true })}
            />
          </div>
        </FormField>

        <FormField label="Frequency" error={errors.frequency?.message} required>
          <Controller
            control={control}
            name="frequency"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger aria-label="Frequency">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FREQUENCIES.map((f) => (
                    <SelectItem key={f.value} value={f.value}>
                      {f.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </FormField>
      </div>

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
        <FormField label="Start date" htmlFor="startDate" error={errors.startDate?.message} required>
          <DateField id="startDate" {...register("startDate")} />
        </FormField>
        <FormField
          label="End date"
          htmlFor="endDate"
          error={errors.endDate?.message}
          hint="Leave empty if it never ends"
        >
          <DateField id="endDate" {...register("endDate")} />
        </FormField>
      </div>

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

        <FormField label="Account" htmlFor="account" error={errors.account?.message}>
          <Input
            id="account"
            placeholder="e.g. HDFC Savings"
            {...register("account")}
          />
        </FormField>
      </div>

      <div className="flex items-center justify-between rounded-lg border p-3">
        <div>
          <p className="text-sm font-medium">Active</p>
          <p className="text-xs text-muted-foreground">
            Pause this recurring transaction without deleting it.
          </p>
        </div>
        <Controller
          control={control}
          name="isActive"
          render={({ field }) => (
            <Switch
              checked={field.value}
              onCheckedChange={field.onChange}
              aria-label="Active"
            />
          )}
        />
      </div>

      <div className="flex items-start gap-2 rounded-lg border bg-muted/40 p-3 text-xs text-muted-foreground">
        <RefreshCw className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
        <p>
          The next occurrence is scheduled automatically. Record it from the Recurring
          page to add it to your transactions.
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
          {recurring ? "Save changes" : "Add recurring"}
        </Button>
      </div>
    </form>
  );
}
