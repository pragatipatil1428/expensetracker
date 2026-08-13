"use client";

import * as React from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CategoryIcon } from "@/components/shared/category-icon";
import { CategoryDialog } from "@/components/categories/category-dialog";
import {
  deleteCategoryAction,
  getCategoriesAction,
  getCategoryStatsAction,
  type CategoryUsage,
} from "@/actions/categories";
import type { CategoryDTO } from "@/lib/types";

interface CategoriesManagerProps {
  defaultType?: "EXPENSE" | "INCOME";
}

export function CategoriesManager({ defaultType = "EXPENSE" }: CategoriesManagerProps) {
  const queryClient = useQueryClient();
  const [type, setType] = React.useState<"EXPENSE" | "INCOME">(defaultType);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<CategoryDTO | null>(null);
  const [deleteTarget, setDeleteTarget] = React.useState<CategoryDTO | null>(null);
  const [deleting, setDeleting] = React.useState(false);
  const [reassignTarget, setReassignTarget] = React.useState<CategoryDTO | null>(null);
  const [reassignTo, setReassignTo] = React.useState("");
  const [reassigning, setReassigning] = React.useState(false);

  const categoriesQuery = useQuery({
    queryKey: ["categories", "all"],
    queryFn: async () => {
      const result = await getCategoriesAction();
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
  });

  const statsQuery = useQuery({
    queryKey: ["category-stats"],
    queryFn: async () => {
      const result = await getCategoryStatsAction();
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
  });

  const categories = (categoriesQuery.data ?? []).filter((c) => c.type === type);
  const stats = new Map((statsQuery.data ?? []).map((s) => [s.id, s]));
  const usageOf = (id: string): CategoryUsage | undefined => stats.get(id);

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["categories"] });
    queryClient.invalidateQueries({ queryKey: ["category-stats"] });
  };

  const requestDelete = (category: CategoryDTO) => {
    const usage = usageOf(category.id);
    const count = (usage?.transactionCount ?? 0) + (usage?.recurringCount ?? 0);
    if (count > 0) {
      setDeleteTarget(category);
      setReassignTo("");
      setReassignTarget(category);
    } else {
      setDeleteTarget(category);
      setReassignTarget(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const result = await deleteCategoryAction(deleteTarget.id);
      if (result.success) {
        toast.success("Category deleted");
        setDeleteTarget(null);
        invalidate();
      } else {
        toast.error(result.error);
      }
    } finally {
      setDeleting(false);
    }
  };

  const handleReassignAndDelete = async () => {
    if (!reassignTarget) return;
    setReassigning(true);
    try {
      const result = await deleteCategoryAction(reassignTarget.id, reassignTo);
      if (result.success) {
        toast.success(`Moved items and deleted "${reassignTarget.name}"`);
        setReassignTarget(null);
        setDeleteTarget(null);
        invalidate();
      } else {
        toast.error(result.error);
      }
    } finally {
      setReassigning(false);
    }
  };

  if (categoriesQuery.isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="h-28 w-full" />
        ))}
      </div>
    );
  }

  if (categoriesQuery.isError) {
    return <ErrorState onRetry={() => categoriesQuery.refetch()} />;
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Categories</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Organise your transactions with icons and colours.
          </p>
        </div>
        <Button
          onClick={() => {
            setEditing(null);
            setDialogOpen(true);
          }}
        >
          <Plus className="h-4 w-4" aria-hidden />
          New Category
        </Button>
      </div>

      {/* Type tabs */}
      <div className="inline-flex rounded-lg bg-muted p-1" role="tablist" aria-label="Category type">
        {(["EXPENSE", "INCOME"] as const).map((value) => (
          <button
            key={value}
            role="tab"
            aria-selected={type === value}
            onClick={() => setType(value)}
            className={`rounded-md px-4 py-1.5 text-sm font-medium transition-all ${
              type === value ? "bg-background text-foreground shadow" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {value === "EXPENSE" ? "Expense" : "Income"}
          </button>
        ))}
      </div>

      {categories.length === 0 ? (
        <EmptyState
          title={`No ${type.toLowerCase()} categories`}
          description="Create a category to start organising your transactions."
          action={
            <Button
              onClick={() => {
                setEditing(null);
                setDialogOpen(true);
              }}
            >
              <Plus className="h-4 w-4" aria-hidden />
              Create category
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {categories.map((category) => {
            const usage = usageOf(category.id);
            const count = (usage?.transactionCount ?? 0) + (usage?.recurringCount ?? 0);
            return (
              <div
                key={category.id}
                className="group rounded-xl border bg-card p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="flex items-start justify-between">
                  <CategoryIcon icon={category.icon} color={category.color} size="lg" />
                  <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => {
                        setEditing(category);
                        setDialogOpen(true);
                      }}
                      aria-label={`Edit ${category.name}`}
                    >
                      <Pencil className="h-3.5 w-3.5" aria-hidden />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() => requestDelete(category)}
                      aria-label={`Delete ${category.name}`}
                    >
                      <Trash2 className="h-3.5 w-3.5" aria-hidden />
                    </Button>
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <h3 className="truncate text-sm font-semibold">{category.name}</h3>
                  {category.isDefault && (
                    <Badge variant="secondary" className="text-[10px]">
                      Default
                    </Badge>
                  )}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {count} use{count === 1 ? "" : "s"}
                </p>
              </div>
            );
          })}
        </div>
      )}

      {/* Create/Edit */}
      <CategoryDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        category={editing}
        defaultType={type}
        onSaved={invalidate}
      />

      {/* Direct delete (unused) */}
      <ConfirmDialog
        open={deleteTarget !== null && reassignTarget === null}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title={`Delete "${deleteTarget?.name}"?`}
        description="This category is not used by any transactions. Deleting it is permanent."
        confirmLabel="Delete"
        variant="destructive"
        loading={deleting}
        onConfirm={handleDelete}
      />

      {/* Reassign + delete (used) */}
      <Dialog open={reassignTarget !== null} onOpenChange={(open) => !open && setReassignTarget(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Reassign and delete</DialogTitle>
            <DialogDescription>
              “{reassignTarget?.name}” is used by transactions or recurring schedules. Move
              them to another {type.toLowerCase()} category first, then it will be deleted.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium" htmlFor="reassign-select">
                Move items to
              </label>
              <Select value={reassignTo} onValueChange={setReassignTo}>
                <SelectTrigger id="reassign-select">
                  <SelectValue placeholder="Select a destination category" />
                </SelectTrigger>
                <SelectContent>
                  {categories
                    .filter((c) => c.id !== reassignTarget?.id)
                    .map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setReassignTarget(null)} disabled={reassigning}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleReassignAndDelete} disabled={!reassignTo || reassigning}>
                {reassigning ? <Skeleton className="h-4 w-4 animate-pulse rounded-full bg-white/30" /> : null}
                Delete &amp; move
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
