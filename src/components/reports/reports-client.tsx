"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import {
  endOfMonth,
  endOfYear,
  format,
  startOfMonth,
  startOfYear,
} from "date-fns";
import { Download, FileText, PiggyBank } from "lucide-react";
import { toast } from "sonner";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DateField } from "@/components/shared/date-field";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/shared/error-state";
import { EmptyState } from "@/components/shared/empty-state";
import { CategoryIcon } from "@/components/shared/category-icon";
import { AmountText } from "@/components/shared/amount-text";
import { getMeAction, getReportDataAction } from "@/actions/dashboard";
import type { ReportType } from "@/lib/queries";
import { downloadCsv, downloadPdf } from "@/lib/export";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { TransactionDTO } from "@/lib/types";

const REPORT_TYPES: { value: ReportType; label: string }[] = [
  { value: "all", label: "All" },
  { value: "monthly", label: "Monthly" },
  { value: "yearly", label: "Yearly" },
  { value: "category", label: "Category" },
  { value: "income", label: "Income" },
  { value: "expense", label: "Expense" },
];

function monthRange(month: number, year: number) {
  const start = startOfMonth(new Date(year, month, 1));
  return { from: format(start, "yyyy-MM-dd"), to: format(endOfMonth(start), "yyyy-MM-dd") };
}

export function ReportsClient() {
  const [type, setType] = React.useState<ReportType>("monthly");
  const [month, setMonth] = React.useState(new Date().getMonth());
  const [year, setYear] = React.useState(new Date().getFullYear());
  const [customRange, setCustomRange] = React.useState(() => {
    const now = new Date();
    return {
      from: format(startOfMonth(now), "yyyy-MM-dd"),
      to: format(endOfMonth(now), "yyyy-MM-dd"),
    };
  });

  const range =
    type === "monthly"
      ? monthRange(month, year)
      : type === "yearly"
        ? {
            from: format(startOfYear(new Date(year, 0, 1)), "yyyy-MM-dd"),
            to: format(endOfYear(new Date(year, 0, 1)), "yyyy-MM-dd"),
          }
        : customRange;

  const me = useQuery({
    queryKey: ["me"],
    queryFn: async () => {
      const result = await getMeAction();
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
  });

  const report = useQuery({
    queryKey: ["report", type, range, month, year],
    queryFn: async () => {
      const result = await getReportDataAction(type, range.from, range.to);
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
  });

  const currency = me.data?.currency ?? "INR";

  const handleCsv = () => {
    if (!report.data) return;
    const data = report.data;
    const rows = data.transactions.map((t: TransactionDTO) => [
      format(new Date(t.date), "yyyy-MM-dd"),
      t.description,
      t.type,
      t.category.name,
      t.amount.toFixed(2),
      t.paymentMethod,
      t.account ?? "",
      t.tags.map((tag) => tag.name).join("; "),
      t.notes ?? "",
    ]);
    downloadCsv(
      `fintrack-report-${type}-${range.from}-${range.to}.csv`,
      ["Date", "Description", "Type", "Category", "Amount", "Payment Method", "Account", "Tags", "Notes"],
      rows,
    );
    toast.success("CSV downloaded");
  };

  const handlePdf = () => {
    if (!report.data) return;
    const data = report.data;
    downloadPdf({
      filename: `fintrack-report-${type}-${range.from}-${range.to}.pdf`,
      title: `FinTrack ${type.charAt(0).toUpperCase() + type.slice(1)} Report`,
      subtitle: `${format(new Date(range.from), "MMM d, yyyy")} — ${format(new Date(range.to), "MMM d, yyyy")}`,
      summary: [
        { label: "Income", value: formatCurrency(data.totals.income, currency, { maximumFractionDigits: 0 }) },
        { label: "Expenses", value: formatCurrency(data.totals.expenses, currency, { maximumFractionDigits: 0 }) },
        { label: "Savings", value: formatCurrency(data.totals.savings, currency, { maximumFractionDigits: 0 }) },
        { label: "Savings rate", value: `${data.totals.rate.toFixed(1)}%` },
      ],
      tables: [
        {
          title: "Transactions",
          headers: ["Date", "Description", "Type", "Category", "Amount"],
          rows: data.transactions.slice(0, 40).map((t: TransactionDTO) => [
            format(new Date(t.date), "MMM d, yyyy"),
            t.description,
            t.type,
            t.category.name,
            formatCurrency(t.amount, currency),
          ]),
        },
        {
          title: "Top spending categories",
          headers: ["Category", "Amount", "Share"],
          rows: data.topCategories.map((c) => [
            c.name,
            formatCurrency(c.value, currency),
            data.totals.expenses > 0 ? `${Math.round((c.value / data.totals.expenses) * 100)}%` : "0%",
          ]),
        },
      ],
    });
    toast.success("PDF downloaded");
  };

  const isCustomType = type !== "monthly" && type !== "yearly";

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Reports</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Generate and export financial reports.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleCsv} disabled={!report.data || report.data.transactions.length === 0}>
            <Download className="h-4 w-4" aria-hidden />
            CSV
          </Button>
          <Button variant="outline" onClick={handlePdf} disabled={!report.data || report.data.transactions.length === 0}>
            <FileText className="h-4 w-4" aria-hidden />
            PDF
          </Button>
        </div>
      </div>

      {/* Report type tabs */}
      <div className="inline-flex flex-wrap rounded-lg bg-muted p-1" role="tablist" aria-label="Report type">
        {REPORT_TYPES.map((option) => (
          <button
            key={option.value}
            role="tab"
            aria-selected={type === option.value}
            onClick={() => setType(option.value)}
            className={cn(
              "rounded-md px-3.5 py-1.5 text-sm font-medium transition-all",
              type === option.value ? "bg-background text-foreground shadow" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {option.label}
          </button>
        ))}
      </div>

      {/* Period controls */}
      <div className="flex flex-wrap items-center gap-3 rounded-xl border bg-card p-3.5">
        {type === "monthly" && (
          <>
            <div className="flex items-center gap-2">
              <select
                value={month}
                onChange={(e) => setMonth(Number(e.target.value))}
                className="h-9 rounded-lg border border-input bg-transparent px-3 text-sm"
                aria-label="Month"
              >
                {Array.from({ length: 12 }, (_, i) => (
                  <option key={i} value={i}>
                    {format(new Date(2026, i, 1), "MMMM")}
                  </option>
                ))}
              </select>
              <select
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
                className="h-9 rounded-lg border border-input bg-transparent px-3 text-sm"
                aria-label="Year"
              >
                {Array.from({ length: 4 }, (_, i) => new Date().getFullYear() - 2 + i).map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>
            <span className="text-xs text-muted-foreground">
              {format(new Date(year, month, 1), "MMMM yyyy")}
            </span>
          </>
        )}

        {type === "yearly" && (
          <div className="flex items-center gap-2">
            <select
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              className="h-9 rounded-lg border border-input bg-transparent px-3 text-sm"
              aria-label="Year"
            >
              {Array.from({ length: 4 }, (_, i) => new Date().getFullYear() - 2 + i).map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>
        )}

        {isCustomType && (
          <div className="flex flex-wrap items-center gap-2">
            <DateField
              value={customRange.from}
              onChange={(e) => setCustomRange((r) => ({ ...r, from: e.target.value }))}
              aria-label="From date"
              className="w-40"
            />
            <span className="text-muted-foreground">→</span>
            <DateField
              value={customRange.to}
              onChange={(e) => setCustomRange((r) => ({ ...r, to: e.target.value }))}
              aria-label="To date"
              className="w-40"
            />
          </div>
        )}
      </div>

      {report.isLoading || me.isLoading ? (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
          <Skeleton className="h-80 w-full" />
        </div>
      ) : report.isError || !report.data ? (
        <ErrorState onRetry={() => report.refetch()} />
      ) : report.data.transactions.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No data for this period"
          description="There are no transactions in the selected range to report on."
        />
      ) : (
        <>
          {/* Summary */}
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[
              { label: "Total income", value: formatCurrency(report.data.totals.income, currency, { maximumFractionDigits: 0 }) },
              { label: "Total expenses", value: formatCurrency(report.data.totals.expenses, currency, { maximumFractionDigits: 0 }) },
              { label: "Savings", value: formatCurrency(report.data.totals.savings, currency, { maximumFractionDigits: 0 }) },
              { label: "Savings rate", value: `${report.data.totals.rate.toFixed(1)}%` },
            ].map((stat) => (
              <Card key={stat.label} className="p-5">
                <p className="text-sm text-muted-foreground">{stat.label}</p>
                <p className="mt-2 text-2xl font-bold tabular-nums">{stat.value}</p>
              </Card>
            ))}
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            {/* Monthly breakdown */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-base">Monthly breakdown</CardTitle>
              </CardHeader>
              <CardContent className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      <th className="py-2 pr-3">Month</th>
                      <th className="py-2 pr-3 text-right">Income</th>
                      <th className="py-2 pr-3 text-right">Expenses</th>
                      <th className="py-2 pr-3 text-right">Savings</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {report.data.monthly.map((row) => (
                      <tr key={row.month}>
                        <td className="py-2.5 pr-3 font-medium">{row.month}</td>
                        <td className="py-2.5 pr-3 text-right tabular-nums text-emerald-600 dark:text-emerald-400">
                          {formatCurrency(row.income, currency)}
                        </td>
                        <td className="py-2.5 pr-3 text-right tabular-nums">
                          {formatCurrency(row.expenses, currency)}
                        </td>
                        <td className="py-2.5 pr-3 text-right font-medium tabular-nums">
                          {formatCurrency(row.savings, currency)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>

            {/* Highlights */}
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Top categories</CardTitle>
                </CardHeader>
                <CardContent>
                  {report.data.topCategories.length === 0 ? (
                    <p className="py-4 text-sm text-muted-foreground">No expenses</p>
                  ) : (
                    <ul className="space-y-3">
                      {report.data.topCategories.map((category) => (
                        <li key={category.name}>
                          <div className="mb-1 flex items-center justify-between text-sm">
                            <span className="font-medium">{category.name}</span>
                            <span className="font-semibold tabular-nums">{formatCurrency(category.value, currency)}</span>
                          </div>
                          <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                            <div
                              className="h-full rounded-full"
                              style={{
                                width: `${report.data.totals.expenses > 0 ? (category.value / report.data.totals.expenses) * 100 : 0}%`,
                                backgroundColor: category.color,
                              }}
                            />
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>

              <Card className="p-4">
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-muted-foreground">Largest income</p>
                    {report.data.largestIncome ? (
                      <p className="mt-0.5 flex items-center justify-between text-sm">
                        <span className="truncate font-medium">{report.data.largestIncome.description}</span>
                        <AmountText
                          amount={report.data.largestIncome.amount}
                          type="INCOME"
                          currency={currency}
                          className="ml-2 text-sm"
                        />
                      </p>
                    ) : (
                      <p className="mt-0.5 text-sm text-muted-foreground">—</p>
                    )}
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Largest expense</p>
                    {report.data.largestExpense ? (
                      <p className="mt-0.5 flex items-center justify-between text-sm">
                        <span className="truncate font-medium">{report.data.largestExpense.description}</span>
                        <AmountText
                          amount={report.data.largestExpense.amount}
                          type="EXPENSE"
                          currency={currency}
                          className="ml-2 text-sm"
                        />
                      </p>
                    ) : (
                      <p className="mt-0.5 text-sm text-muted-foreground">—</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 rounded-lg bg-muted/50 p-2.5 text-xs text-muted-foreground">
                    <PiggyBank className="h-4 w-4 text-primary" aria-hidden />
                    {report.data.totals.count} transactions in this period
                  </div>
                </div>
              </Card>
            </div>
          </div>

          {/* Transactions table */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Transactions</CardTitle>
              <p className="text-sm text-muted-foreground">
                Showing {report.data.transactions.length} transactions
              </p>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    <th className="py-2 pr-3">Date</th>
                    <th className="py-2 pr-3">Description</th>
                    <th className="py-2 pr-3">Category</th>
                    <th className="py-2 pr-3">Type</th>
                    <th className="py-2 pr-3 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {report.data.transactions.slice(0, 20).map((t) => (
                    <tr key={t.id}>
                      <td className="whitespace-nowrap py-2.5 pr-3 text-muted-foreground">
                        {format(new Date(t.date), "MMM d, yyyy")}
                      </td>
                      <td className="py-2.5 pr-3">
                        <div className="flex items-center gap-2">
                          <CategoryIcon icon={t.category.icon} color={t.category.color} size="sm" />
                          <span className="truncate font-medium">{t.description}</span>
                        </div>
                      </td>
                      <td className="py-2.5 pr-3 text-muted-foreground">{t.category.name}</td>
                      <td className="py-2.5 pr-3">
                        <Badge variant={t.type === "INCOME" ? "income" : "expense"}>
                          {t.type === "INCOME" ? "Income" : "Expense"}
                        </Badge>
                      </td>
                      <td className="py-2.5 pr-3 text-right">
                        <AmountText amount={t.amount} type={t.type} currency={currency} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
