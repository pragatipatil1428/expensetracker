"use client";

import * as React from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowDownUp,
  ChevronLeft,
  ChevronRight,
  Download,
  Eye,
  FilterX,
  Pencil,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { DateField } from "@/components/shared/date-field";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CategoryIcon } from "@/components/shared/category-icon";
import { AmountText } from "@/components/shared/amount-text";
import { TransactionDialog } from "@/components/transactions/transaction-dialog";
import { TransactionDetailsDialog } from "@/components/transactions/transaction-details-dialog";
import { getTransactionsAction, getMeAction } from "@/actions/dashboard";
import { getCategoriesAction } from "@/actions/categories";
import { deleteTransactionAction, getTransactionAction } from "@/actions/transactions";
import { PAYMENT_METHODS, TRANSACTION_SORT_OPTIONS } from "@/lib/constants";
import { formatDayLabel } from "@/lib/format";
import type { TransactionDTO, TransactionType } from "@/lib/types";

const PAGE_SIZE = 12;

interface Filters {
  search: string;
  type: TransactionType | "";
  categoryId: string;
  paymentMethod: string;
  from: string;
  to: string;
  minAmount: string;
  maxAmount: string;
  sort: string;
  page: number;
}

const DEFAULT_FILTERS: Filters = {
  search: "",
  type: "",
  categoryId: "",
  paymentMethod: "",
  from: "",
  to: "",
  minAmount: "",
  maxAmount: "",
  sort: "newest",
  page: 1,
};

export function TransactionExplorer({ initialDetailId }: { initialDetailId?: string }) {
  const queryClient = useQueryClient();
  const [filters, setFilters] = React.useState<Filters>(DEFAULT_FILTERS);
  const [detailOpen, setDetailOpen] = React.useState(false);
  const [editOpen, setEditOpen] = React.useState(false);
  const [createOpen, setCreateOpen] = React.useState(false);
  const [deleteTarget, setDeleteTarget] = React.useState<TransactionDTO | null>(null);
  const [deleting, setDeleting] = React.useState(false);
  const [detail, setDetail] = React.useState<TransactionDTO | null>(null);
  const [editing, setEditing] = React.useState<TransactionDTO | null>(null);

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

  const transactions = useQuery({
    queryKey: ["transactions", filters],
    queryFn: async () => {
      const result = await getTransactionsAction({
        search: filters.search || undefined,
        type: filters.type || undefined,
        categoryId: filters.categoryId || undefined,
        paymentMethod: (filters.paymentMethod as never) || undefined,
        from: filters.from || undefined,
        to: filters.to || undefined,
        minAmount: filters.minAmount ? Number(filters.minAmount) : undefined,
        maxAmount: filters.maxAmount ? Number(filters.maxAmount) : undefined,
        sort: (filters.sort as never) || undefined,
        page: filters.page,
        pageSize: PAGE_SIZE,
      });
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
  });

  const currency = me.data?.currency ?? "INR";
  const categories = categoriesQuery.data ?? [];
  const data = transactions.data;

  // Open detail from command palette link (?detail=ID)
  const openedInitialDetail = React.useRef(false);
  React.useEffect(() => {
    if (initialDetailId && !openedInitialDetail.current) {
      openedInitialDetail.current = true;
      getTransactionAction(initialDetailId).then((result) => {
        if (result.success && "data" in result) {
          setDetail(result.data as TransactionDTO);
          setDetailOpen(true);
        }
      });
    }
  }, [initialDetailId]);

  const updateFilter = (key: keyof Filters, value: string | number) => {
    setFilters((f) => ({ ...f, [key]: value, page: key === "page" ? (value as number) : 1 }));
  };

  const resetFilters = () => setFilters(DEFAULT_FILTERS);
  const hasFilters = Object.entries(filters).some(
    ([key, value]) =>
      key !== "sort" && key !== "page" && typeof value === "string" && value !== "",
  );

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["transactions"] });
    queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    queryClient.invalidateQueries({ queryKey: ["notifications"] });
  };

  const openEdit = (transaction: TransactionDTO) => {
    setEditing(transaction);
    setEditOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const result = await deleteTransactionAction(deleteTarget.id);
      if (result.success) {
        toast.success("Transaction deleted");
        setDeleteTarget(null);
        invalidate();
      } else {
        toast.error(result.error);
      }
    } finally {
      setDeleting(false);
    }
  };

  // CSV export (client-side)
  const exportCsv = () => {
    if (!data) return;
    const rows = [
      ["Date", "Description", "Type", "Category", "Amount", "Payment Method", "Account", "Tags", "Notes"],
      ...data.items.map((t) => [
        new Date(t.date).toISOString().slice(0, 10),
        t.description,
        t.type,
        t.category.name,
        t.amount.toFixed(2),
        t.paymentMethod,
        t.account ?? "",
        t.tags.map((tag) => tag.name).join("; "),
        t.notes ?? "",
      ]),
    ];
    const csv = rows
      .map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `transactions-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success("CSV exported");
  };

  const totalPages = data?.totalPages ?? 1;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Transactions</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {data ? `${data.total} transaction${data.total === 1 ? "" : "s"}` : "Search, filter and manage your money."}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportCsv} disabled={!data || data.items.length === 0}>
            <Download className="h-4 w-4" aria-hidden />
            Export CSV
          </Button>
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4" aria-hidden />
            Add Transaction
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="rounded-xl border bg-card p-3.5">
        <div className="grid gap-2.5 md:grid-cols-2 xl:grid-cols-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
            <Input
              placeholder="Search description, category, tag…"
              value={filters.search}
              onChange={(e) => updateFilter("search", e.target.value)}
              className="pl-9"
              aria-label="Search transactions"
            />
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <Select value={filters.type} onValueChange={(v) => updateFilter("type", v)}>
              <SelectTrigger aria-label="Type filter">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All types</SelectItem>
                <SelectItem value="INCOME">Income</SelectItem>
                <SelectItem value="EXPENSE">Expense</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filters.categoryId} onValueChange={(v) => updateFilter("categoryId", v)}>
              <SelectTrigger aria-label="Category filter">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All categories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <Select value={filters.paymentMethod} onValueChange={(v) => updateFilter("paymentMethod", v)}>
              <SelectTrigger aria-label="Payment method filter">
                <SelectValue placeholder="Payment" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All methods</SelectItem>
                {PAYMENT_METHODS.map((method) => (
                  <SelectItem key={method.value} value={method.value}>
                    {method.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filters.sort} onValueChange={(v) => updateFilter("sort", v)}>
              <SelectTrigger aria-label="Sort">
                <ArrowDownUp className="mr-1 h-3.5 w-3.5 text-muted-foreground" aria-hidden />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TRANSACTION_SORT_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <DateField
              value={filters.from}
              onChange={(e) => updateFilter("from", e.target.value)}
              aria-label="From date"
            />
            <DateField
              value={filters.to}
              onChange={(e) => updateFilter("to", e.target.value)}
              aria-label="To date"
            />
          </div>

          <div className="grid grid-cols-2 gap-2.5 md:col-span-2 xl:col-span-4">
            <div className="grid grid-cols-2 gap-2.5">
              <Input
                type="number"
                placeholder="Min amount"
                value={filters.minAmount}
                onChange={(e) => updateFilter("minAmount", e.target.value)}
                aria-label="Minimum amount"
              />
              <Input
                type="number"
                placeholder="Max amount"
                value={filters.maxAmount}
                onChange={(e) => updateFilter("maxAmount", e.target.value)}
                aria-label="Maximum amount"
              />
            </div>
            <div className="flex items-center gap-2">
              {hasFilters && (
                <Button variant="ghost" size="sm" onClick={resetFilters}>
                  <FilterX className="h-4 w-4" aria-hidden />
                  Clear filters
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* List */}
      {transactions.isLoading ? (
        <div className="space-y-2">
          {[0, 1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      ) : transactions.isError ? (
        <ErrorState onRetry={() => transactions.refetch()} />
      ) : data && data.items.length === 0 ? (
        <EmptyState
          title={hasFilters ? "No matching transactions" : "No transactions yet"}
          description={
            hasFilters
              ? "Try adjusting your search or filters."
              : "Add your first income or expense to get started."
          }
          action={
            !hasFilters ? (
              <Button onClick={() => setCreateOpen(true)}>
                <Plus className="h-4 w-4" aria-hidden />
                Add Transaction
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="overflow-hidden rounded-xl border bg-card">
          {/* Desktop table */}
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/40 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Description</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Payment</th>
                  <th className="px-4 py-3 text-right">Amount</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {data!.items.map((transaction) => (
                  <tr
                    key={transaction.id}
                    className="cursor-pointer transition-colors hover:bg-muted/40"
                    onClick={() => {
                      setDetail(transaction);
                      setDetailOpen(true);
                    }}
                  >
                    <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                      {formatDayLabel(transaction.date)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <CategoryIcon
                          icon={transaction.category.icon}
                          color={transaction.category.color}
                          size="sm"
                        />
                        <div className="min-w-0">
                          <p className="truncate font-medium">{transaction.description}</p>
                          {transaction.tags.length > 0 && (
                            <p className="text-xs text-muted-foreground">
                              {transaction.tags.map((t) => `#${t.name}`).join(" ")}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                      {transaction.category.name}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={transaction.type === "INCOME" ? "income" : "expense"}>
                        {transaction.type === "INCOME" ? "Income" : "Expense"}
                      </Badge>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                      {transaction.paymentMethod.replaceAll("_", " ")}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right">
                      <AmountText
                        amount={transaction.amount}
                        type={transaction.type}
                        currency={currency}
                      />
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <div
                        className="flex items-center justify-end gap-1"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => {
                            setDetail(transaction);
                            setDetailOpen(true);
                          }}
                          aria-label={`View ${transaction.description}`}
                        >
                          <Eye className="h-4 w-4" aria-hidden />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => openEdit(transaction)}
                          aria-label={`Edit ${transaction.description}`}
                        >
                          <Pencil className="h-4 w-4" aria-hidden />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          className="text-destructive hover:text-destructive"
                          onClick={() => setDeleteTarget(transaction)}
                          aria-label={`Delete ${transaction.description}`}
                        >
                          <Trash2 className="h-4 w-4" aria-hidden />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <ul className="divide-y md:hidden">
            {data!.items.map((transaction) => (
              <li key={transaction.id} className="flex items-center gap-3 px-4 py-3.5">
                <CategoryIcon
                  icon={transaction.category.icon}
                  color={transaction.category.color}
                  size="md"
                />
                <button
                  className="min-w-0 flex-1 text-left"
                  onClick={() => {
                    setDetail(transaction);
                    setDetailOpen(true);
                  }}
                >
                  <p className="truncate text-sm font-medium">{transaction.description}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDayLabel(transaction.date)} · {transaction.category.name}
                  </p>
                </button>
                <AmountText
                  amount={transaction.amount}
                  type={transaction.type}
                  currency={currency}
                  className="text-sm"
                />
              </li>
            ))}
          </ul>

          {/* Pagination */}
          <div className="flex items-center justify-between border-t px-4 py-3">
            <p className="text-xs text-muted-foreground">
              Page {filters.page} of {totalPages}
            </p>
            <div className="flex gap-1.5">
              <Button
                variant="outline"
                size="sm"
                disabled={filters.page <= 1}
                onClick={() => updateFilter("page", filters.page - 1)}
              >
                <ChevronLeft className="h-4 w-4" aria-hidden />
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={filters.page >= totalPages}
                onClick={() => updateFilter("page", filters.page + 1)}
              >
                Next
                <ChevronRight className="h-4 w-4" aria-hidden />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Dialogs */}
      <TransactionDetailsDialog
        open={detailOpen}
        onOpenChange={setDetailOpen}
        transaction={detail}
        currency={currency}
        onEdit={(transaction) => openEdit(transaction)}
        onDelete={(transaction) => {
          setDetailOpen(false);
          setDeleteTarget(transaction);
        }}
      />

      <TransactionDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        categories={categories}
        currency={currency}
        onSaved={invalidate}
      />

      <TransactionDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        categories={categories}
        currency={currency}
        transaction={editing}
        onSaved={invalidate}
      />

      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete transaction?"
        description={
          <>
            This will permanently delete{" "}
            <span className="font-semibold">{deleteTarget?.description}</span> of{" "}
            <span className="font-semibold tabular-nums">
              {deleteTarget ? new Intl.NumberFormat("en-IN", { style: "currency", currency, maximumFractionDigits: 0 }).format(deleteTarget.amount) : ""}
            </span>. This action cannot be undone.
          </>
        }
        confirmLabel="Delete"
        variant="destructive"
        loading={deleting}
        onConfirm={handleDelete}
      />
    </div>
  );
}
