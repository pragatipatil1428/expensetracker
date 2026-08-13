import { endOfDay, format, startOfDay, startOfMonth, subDays, subMonths } from "date-fns";
import type { ChartPeriod } from "@/lib/constants";
import type { TransactionDTO, TransactionType } from "@/lib/types";

export function getPeriodRange(
  period: ChartPeriod,
  now: Date = new Date(),
): { start: Date; end: Date } {
  switch (period) {
    case "7d":
      return { start: startOfDay(subDays(now, 6)), end: endOfDay(now) };
    case "30d":
      return { start: startOfDay(subDays(now, 29)), end: endOfDay(now) };
    case "3m":
      return { start: startOfMonth(subMonths(now, 2)), end: endOfDay(now) };
    case "6m":
      return { start: startOfMonth(subMonths(now, 5)), end: endOfDay(now) };
    case "1y":
      return { start: startOfMonth(subMonths(now, 11)), end: endOfDay(now) };
  }
}

export function getPreviousRange(
  period: ChartPeriod,
  now: Date = new Date(),
): { start: Date; end: Date } {
  const { start, end } = getPeriodRange(period, now);
  const duration = end.getTime() - start.getTime();
  const prevEnd = new Date(start.getTime() - 1);
  return { start: new Date(prevEnd.getTime() - duration), end: prevEnd };
}

export function percentChange(current: number, previous: number): number | null {
  if (previous === 0) return null;
  return ((current - previous) / Math.abs(previous)) * 100;
}

export function savingsRate(income: number, expenses: number): number {
  if (income <= 0) return 0;
  return Math.max(((income - expenses) / income) * 100, 0);
}

export interface SeriesPoint {
  label: string;
  income: number;
  expense: number;
  savings: number;
}

/**
 * Builds a per-day or per-month series (income vs expense vs savings) from
 * transactions within a period.
 */
export function buildTrendSeries(period: ChartPeriod, transactions: TransactionDTO[]): SeriesPoint[] {
  const now = new Date();
  const byDay = period === "7d" || period === "30d";
  const dayLabels: string[] = [];
  const monthKeys: string[] = [];

  if (byDay) {
    const days = period === "7d" ? 7 : 30;
    for (let i = days - 1; i >= 0; i--) {
      dayLabels.push(format(subDays(now, i), "MMM d"));
    }
  } else {
    const months = period === "3m" ? 3 : period === "6m" ? 6 : 12;
    for (let i = months - 1; i >= 0; i--) {
      monthKeys.push(format(subMonths(now, i), "yyyy-MM"));
    }
  }

  const income = new Map<string, number>();
  const expense = new Map<string, number>();

  for (const txn of transactions) {
    const date = new Date(txn.date);
    const key = byDay ? format(date, "MMM d") : format(date, "yyyy-MM");
    const bucket = byDay ? dayLabels : monthKeys;
    if (!bucket.includes(key)) continue;
    const target = txn.type === "INCOME" ? income : expense;
    target.set(key, (target.get(key) ?? 0) + txn.amount);
  }

  const buckets = byDay ? dayLabels : monthKeys;
  return buckets.map((key) => {
    const i = income.get(key) ?? 0;
    const e = expense.get(key) ?? 0;
    return { label: byDay ? key : format(new Date(`${key}-01`), "MMM yy"), income: i, expense: e, savings: i - e };
  });
}

export interface CategorySlice {
  name: string;
  color: string;
  value: number;
}

export function aggregateByCategory(transactions: TransactionDTO[], type: TransactionType = "EXPENSE"): CategorySlice[] {
  const totals = new Map<string, CategorySlice>();
  for (const txn of transactions) {
    if (txn.type !== type) continue;
    const existing = totals.get(txn.categoryId);
    if (existing) {
      existing.value += txn.amount;
    } else {
      totals.set(txn.categoryId, {
        name: txn.category.name,
        color: txn.category.color,
        value: txn.amount,
      });
    }
  }
  return [...totals.values()].sort((a, b) => b.value - a.value);
}

export function sumByType(transactions: TransactionDTO[], type: TransactionType): number {
  return transactions
    .filter((t) => t.type === type)
    .reduce((acc, t) => acc + t.amount, 0);
}

export function netTotal(transactions: { type: TransactionType; amount: number }[]): number {
  return transactions.reduce((acc, t) => acc + (t.type === "INCOME" ? t.amount : -t.amount), 0);
}

export function largestTransaction(
  transactions: TransactionDTO[],
  type: TransactionType,
): TransactionDTO | null {
  return transactions
    .filter((t) => t.type === type)
    .sort((a, b) => b.amount - a.amount)[0] ?? null;
}

export function monthlyTotals(
  transactions: { type: TransactionType; amount: number; date: string }[],
): { month: string; income: number; expenses: number; savings: number }[] {
  const buckets = new Map<string, { income: number; expenses: number }>();
  for (const txn of transactions) {
    const key = format(new Date(txn.date), "yyyy-MM");
    const bucket = buckets.get(key) ?? { income: 0, expenses: 0 };
    if (txn.type === "INCOME") bucket.income += txn.amount;
    else bucket.expenses += txn.amount;
    buckets.set(key, bucket);
  }
  return [...buckets.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, { income, expenses }]) => ({
      month: format(new Date(`${month}-01`), "MMM"),
      income,
      expenses,
      savings: income - expenses,
    }));
}
