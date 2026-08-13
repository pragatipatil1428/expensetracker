"use client";

import * as React from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { CalendarClock, CheckCheck, Pencil, Plus, Repeat, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { CategoryIcon } from "@/components/shared/category-icon";
import { AmountText } from "@/components/shared/amount-text";
import { Spinner } from "@/components/ui/spinner";
import { RecurringDialog } from "@/components/recurring/recurring-dialog";
import { getCategoriesAction } from "@/actions/categories";
import { getMeAction } from "@/actions/dashboard";
import {
  deleteRecurringAction,
  getRecurringAction,
  recordRecurringAction,
  toggleRecurringAction,
} from "@/actions/recurring";
import { FREQUENCY_LABELS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { RecurringDTO } from "@/lib/types";

export function RecurringManager() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<RecurringDTO | null>(null);
  const [deleteTarget, setDeleteTarget] = React.useState<RecurringDTO | null>(null);
  const [deleting, setDeleting] = React.useState(false);
  const [recordingId, setRecordingId] = React.useState<string | null>(null);

  const me = useQuery({
    queryKey: ["me"],
    queryFn: async () => {
      const result = await getMeAction();
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
  });

  const categoriesQuery = useQuery({
    queryKey: ["categories", "all"],
    queryFn: async () => {
      const result = await getCategoriesAction();
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
  });

  const recurringQuery = useQuery({
    queryKey: ["recurring"],
    queryFn: async () => {
      const result = await getRecurringAction();
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
  });

  const currency = me.data?.currency ?? "INR";
  const categories = categoriesQuery.data ?? [];
  const items = recurringQuery.data ?? [];

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["recurring"] });
    queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    queryClient.invalidateQueries({ queryKey: ["transactions"] });
    queryClient.invalidateQueries({ queryKey: ["notifications"] });
  };

  const active = items.filter((item) => item.isActive);
  const inactive = items.filter((item) => !item.isActive);
  const upcoming = [...active]
    .filter((item) => new Date(item.nextRunDate) >= new Date())
    .sort((a, b) => new Date(a.nextRunDate).getTime() - new Date(b.nextRunDate).getTime())
    .slice(0, 4);

  const handleToggle = async (item: RecurringDTO, isActive: boolean) => {
    const result = await toggleRecurringAction(item.id, isActive);
    if (result.success) {
      toast.success(isActive ? `"${item.name}" resumed` : `"${item.name}" paused`);
      invalidate();
    } else {
      toast.error(result.error);
    }
  };

  const handleRecord = async (item: RecurringDTO) => {
    setRecordingId(item.id);
    try {
      const result = await recordRecurringAction(item.id);
      if (result.success) {
        toast.success(`Recorded "${item.name}" as a transaction`);
        invalidate();
      } else {
        toast.error(result.error);
      }
    } finally {
      setRecordingId(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const result = await deleteRecurringAction(deleteTarget.id);
      if (result.success) {
        toast.success("Recurring transaction deleted");
        setDeleteTarget(null);
        invalidate();
      } else {
        toast.error(result.error);
      }
    } finally {
      setDeleting(false);
    }
  };

  const renderItem = (item: RecurringDTO, compact = false) => (
    <div
      key={item.id}
      className={cn(
        "flex items-center gap-3 transition-opacity",
        !item.isActive && "opacity-60",
      )}
    >
      <CategoryIcon icon={item.category.icon} color={item.category.color} size="md" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{item.name}</p>
        <p className="truncate text-xs text-muted-foreground">
          {item.category.name} · {FREQUENCY_LABELS[item.frequency]}
          {!compact && item.account ? ` · ${item.account}` : ""}
        </p>
      </div>
      {compact ? (
        <div className="text-right">
          <AmountText amount={item.amount} type={item.type} currency={currency} className="text-sm" />
          <p className="text-[11px] text-muted-foreground">
            {format(new Date(item.nextRunDate), "MMM d")}
          </p>
        </div>
      ) : (
        <>
          <div className="hidden text-right sm:block">
            <AmountText amount={item.amount} type={item.type} currency={currency} className="text-sm" />
            <p className="text-[11px] text-muted-foreground">
              Next: {format(new Date(item.nextRunDate), "MMM d, yyyy")}
            </p>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleRecord(item)}
              disabled={recordingId === item.id}
              className="hidden md:inline-flex"
            >
              {recordingId === item.id ? <Spinner /> : <CheckCheck className="h-4 w-4" aria-hidden />}
              Record
            </Button>
            <Switch
              checked={item.isActive}
              onCheckedChange={(checked) => handleToggle(item, checked)}
              aria-label={`${item.isActive ? "Pause" : "Resume"} ${item.name}`}
            />
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => { setEditing(item); setDialogOpen(true); }}
              aria-label={`Edit ${item.name}`}
            >
              <Pencil className="h-3.5 w-3.5" aria-hidden />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              className="text-destructive hover:text-destructive"
              onClick={() => setDeleteTarget(item)}
              aria-label={`Delete ${item.name}`}
            >
              <Trash2 className="h-3.5 w-3.5" aria-hidden />
            </Button>
          </div>
        </>
      )}
    </div>
  );

  if (recurringQuery.isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-40 w-full" />
        <div className="grid gap-4 md:grid-cols-2">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (recurringQuery.isError) {
    return <ErrorState onRetry={() => recurringQuery.refetch()} />;
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Recurring</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Salary, rent, subscriptions and EMIs on autopilot.
          </p>
        </div>
        <Button onClick={() => { setEditing(null); setDialogOpen(true); }}>
          <Plus className="h-4 w-4" aria-hidden />
          Add Recurring
        </Button>
      </div>

      {/* Upcoming */}
      {upcoming.length > 0 && (
        <Card className="overflow-hidden">
          <div className="flex items-center gap-2 border-b bg-muted/40 px-5 py-3">
            <CalendarClock className="h-4 w-4 text-primary" aria-hidden />
            <h2 className="text-sm font-semibold">Upcoming</h2>
            <Badge variant="secondary">{upcoming.length}</Badge>
          </div>
          <ul className="divide-y px-5">
            {upcoming.map((item) => (
              <li key={item.id} className="py-3">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  {renderItem(item, true)}
                  <div className="sm:w-28 sm:text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRecord(item)}
                      disabled={recordingId === item.id}
                    >
                      {recordingId === item.id ? <Spinner /> : <CheckCheck className="h-4 w-4" aria-hidden />}
                      Record
                    </Button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {items.length === 0 ? (
        <EmptyState
          icon={Repeat}
          title="No recurring transactions"
          description="Add salary, rent, subscriptions or EMIs to schedule them automatically."
          action={
            <Button onClick={() => { setEditing(null); setDialogOpen(true); }}>
              <Plus className="h-4 w-4" aria-hidden />
              Add recurring
            </Button>
          }
        />
      ) : (
        <>
          {active.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Active ({active.length})
              </h2>
              <Card className="divide-y px-5">
                {active.map((item) => (
                  <div key={item.id} className="py-3.5">
                    {renderItem(item)}
                  </div>
                ))}
              </Card>
            </div>
          )}

          {inactive.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Paused ({inactive.length})
              </h2>
              <Card className="divide-y px-5">
                {inactive.map((item) => (
                  <div key={item.id} className="py-3.5">
                    {renderItem(item)}
                  </div>
                ))}
              </Card>
            </div>
          )}
        </>
      )}

      <div className="flex items-start gap-2 rounded-xl border bg-muted/40 p-4 text-xs text-muted-foreground">
        <Repeat className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
        <p>
          Tip: use “Record” when a scheduled payment happens — FinTrack adds it to your
          transactions and automatically calculates the next occurrence.
        </p>
      </div>

      <RecurringDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        categories={categories}
        currency={currency}
        recurring={editing}
        onSaved={invalidate}
      />

      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title={`Delete "${deleteTarget?.name}"?`}
        description="This schedule will be removed. Transactions already recorded will be kept."
        confirmLabel="Delete"
        variant="destructive"
        loading={deleting}
        onConfirm={handleDelete}
      />
    </div>
  );
}
