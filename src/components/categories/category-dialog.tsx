"use client";

import * as React from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Check, Save } from "lucide-react";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/shared/form-field";
import { Spinner } from "@/components/ui/spinner";
import { CATEGORY_ICON_OPTIONS } from "@/lib/icons";
import { CATEGORY_COLOR_PRESETS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { createCategoryAction, updateCategoryAction } from "@/actions/categories";
import { categorySchema, type CategoryInput } from "@/schemas/transaction";
import type { CategoryDTO, TransactionType } from "@/lib/types";

interface CategoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category?: CategoryDTO | null;
  defaultType?: TransactionType;
  onSaved?: () => void;
}

export function CategoryDialog({
  open,
  onOpenChange,
  category,
  defaultType = "EXPENSE",
  onSaved,
}: CategoryDialogProps) {
  const [submitting, setSubmitting] = React.useState(false);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors },
  } = useForm<CategoryInput>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: category?.name ?? "",
      type: category?.type ?? defaultType,
      icon: category?.icon ?? "tag",
      color: category?.color ?? CATEGORY_COLOR_PRESETS[0],
    },
  });

  const type = useWatch({ control, name: "type" });
  const icon = useWatch({ control, name: "icon" });
  const color = useWatch({ control, name: "color" });
  const nameValue = useWatch({ control, name: "name" });

  const onSubmit = async (values: CategoryInput) => {
    setSubmitting(true);
    try {
      const result = category
        ? await updateCategoryAction(category.id, values)
        : await createCategoryAction(values);
      if (result.success) {
        toast.success(category ? "Category updated" : "Category created");
        onSaved?.();
        onOpenChange(false);
      } else {
        toast.error(result.error);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{category ? "Edit category" : "New category"}</DialogTitle>
          <DialogDescription>
            {category
              ? "Update the name, icon and colour of this category."
              : "Organise your money with custom categories."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
            <FormField label="Name" htmlFor="name" error={errors.name?.message} required>
              <Input
                id="name"
                placeholder="e.g. Pets"
                aria-invalid={Boolean(errors.name)}
                {...register("name")}
              />
            </FormField>

            <FormField label="Type" error={errors.type?.message}>
              <div className="grid grid-cols-2 gap-1 rounded-lg bg-muted p-1" role="radiogroup">
                {(["EXPENSE", "INCOME"] as const).map((value) => (
                  <button
                    key={value}
                    type="button"
                    role="radio"
                    aria-checked={type === value}
                    onClick={() => setValue("type", value)}
                    className={cn(
                      "rounded-md px-3 py-1.5 text-xs font-medium transition-all",
                      type === value ? "bg-background text-foreground shadow" : "text-muted-foreground",
                    )}
                  >
                    {value.charAt(0) + value.slice(1).toLowerCase()}
                  </button>
                ))}
              </div>
            </FormField>
          </div>

          <FormField label="Icon" error={errors.icon?.message}>
            <div className="grid max-h-44 grid-cols-8 gap-1.5 overflow-y-auto rounded-lg border p-2 sm:grid-cols-10">
              {CATEGORY_ICON_OPTIONS.map(({ name, Icon: IconComponent }) => (
                <button
                  key={name}
                  type="button"
                  onClick={() => setValue("icon", name)}
                  className={cn(
                    "flex aspect-square items-center justify-center rounded-md transition-colors",
                    icon === name
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground",
                  )}
                  aria-label={`Icon ${name}`}
                  aria-pressed={icon === name}
                >
                  <IconComponent className="h-4 w-4" aria-hidden />
                </button>
              ))}
            </div>
          </FormField>

          <FormField label="Colour" error={errors.color?.message}>
            <div className="flex flex-wrap gap-2">
              {CATEGORY_COLOR_PRESETS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setValue("color", preset)}
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-full transition-transform hover:scale-110",
                    color.toLowerCase() === preset.toLowerCase() &&
                      "ring-2 ring-ring ring-offset-2 ring-offset-background",
                  )}
                  style={{ backgroundColor: preset }}
                  aria-label={`Colour ${preset}`}
                  aria-pressed={color.toLowerCase() === preset.toLowerCase()}
                >
                  {color.toLowerCase() === preset.toLowerCase() && (
                    <Check className="h-4 w-4 text-white" aria-hidden />
                  )}
                </button>
              ))}
            </div>
          </FormField>

          <div className="flex items-center gap-3 rounded-lg border bg-muted/40 p-3">
            <span
              className="flex h-9 w-9 items-center justify-center rounded-lg text-white"
              style={{ backgroundColor: color }}
              aria-hidden
            >
              {(() => {
                const Icon = CATEGORY_ICON_OPTIONS.find((o) => o.name === icon)?.Icon;
                return Icon ? <Icon className="h-4 w-4" /> : null;
              })()}
            </span>
            <div>
              <p className="text-sm font-medium">{nameValue || "Category preview"}</p>
              <p className="text-xs text-muted-foreground">
                {type === "EXPENSE" ? "Expense category" : "Income category"}
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? <Spinner /> : <Save className="h-4 w-4" aria-hidden />}
              {category ? "Save changes" : "Create category"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
