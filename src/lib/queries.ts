import "server-only";

import { endOfDay, startOfDay } from "date-fns";
import { prisma } from "@/lib/prisma";
import { toNumber } from "@/lib/format";
import {
  aggregateByCategory,
  buildTrendSeries,
  getPeriodRange,
  getPreviousRange,
  largestTransaction,
  monthlyTotals,
  netTotal,
  percentChange,
  savingsRate,
  sumByType,
} from "@/lib/analytics";
import {
  toBudgetDTO,
  toCategoryDTO,
  toRecurringDTO,
  toTransactionDTO,
} from "@/lib/serialize";
import type { ChartPeriod, TransactionSort } from "@/lib/constants";
import type {
  CategoryDTO,
  DashboardSummary,
  FinancialSummary,
  PaymentMethod,
  RecurringDTO,
  SearchResults,
  TransactionDTO,
  TransactionType,
} from "@/lib/types";

// ── Transactions ─────────────────────────────────────────────────────────

export interface TransactionQueryParams {
  search?: string;
  type?: TransactionType;
  categoryId?: string;
  paymentMethod?: PaymentMethod;
  from?: string;
  to?: string;
  minAmount?: number;
  maxAmount?: number;
  sort?: TransactionSort;
  page?: number;
  pageSize?: number;
}

export interface TransactionQueryResult {
  items: TransactionDTO[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export async function queryTransactions(
  userId: string,
  params: TransactionQueryParams = {},
): Promise<TransactionQueryResult> {
  const page = Math.max(params.page ?? 1, 1);
  const pageSize = Math.min(Math.max(params.pageSize ?? 12, 1), 100);
  const { search, type, categoryId, paymentMethod, from, to, minAmount, maxAmount, sort } =
    params;

  const where: Record<string, unknown> = { userId };

  if (search && search.trim()) {
    const q = search.trim();
    where.OR = [
      { description: { contains: q, mode: "insensitive" } },
      { category: { name: { contains: q, mode: "insensitive" } } },
      { tags: { some: { name: { contains: q, mode: "insensitive" } } } },
    ];
  }
  if (type) where.type = type;
  if (categoryId) where.categoryId = categoryId;
  if (paymentMethod) where.paymentMethod = paymentMethod;

  const dateFilter: Record<string, Date> = {};
  if (from) dateFilter.gte = startOfDay(new Date(from));
  if (to) dateFilter.lte = endOfDay(new Date(to));
  if (Object.keys(dateFilter).length > 0) where.date = dateFilter;

  const amountFilter: Record<string, number> = {};
  if (minAmount !== undefined) amountFilter.gte = minAmount;
  if (maxAmount !== undefined) amountFilter.lte = maxAmount;
  if (Object.keys(amountFilter).length > 0) where.amount = amountFilter;

  let orderBy: Record<string, "asc" | "desc"> | Record<string, "asc" | "desc">[];
  switch (sort) {
    case "oldest":
      orderBy = [{ date: "asc" }, { createdAt: "asc" }];
      break;
    case "amount-desc":
      orderBy = [{ amount: "desc" }, { date: "desc" }];
      break;
    case "amount-asc":
      orderBy = [{ amount: "asc" }, { date: "desc" }];
      break;
    default:
      orderBy = [{ date: "desc" }, { createdAt: "desc" }];
  }

  const [items, total] = await prisma.$transaction([
    prisma.transaction.findMany({
      where,
      include: { category: true, tags: true },
      orderBy,
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.transaction.count({ where }),
  ]);

  return {
    items: items.map(toTransactionDTO),
    total,
    page,
    pageSize,
    totalPages: Math.max(Math.ceil(total / pageSize), 1),
  };
}

// ── Dashboard ────────────────────────────────────────────────────────────

export interface DashboardOverview {
  summary: DashboardSummary;
  trend: { label: string; income: number; expense: number; savings: number }[];
  categoryBreakdown: { name: string; color: string; value: number }[];
  recent: TransactionDTO[];
  savingsTrend: { label: string; savings: number }[];
  budgetUtilization: {
    totalBudget: number;
    totalSpent: number;
    remaining: number;
    utilization: number;
    budgets: ReturnType<typeof toBudgetDTO>[];
  };
}

export async function getDashboardOverview(
  userId: string,
  period: ChartPeriod = "30d",
): Promise<DashboardOverview> {
  const now = new Date();
  const range = getPeriodRange(period, now);
  const prevRange = getPreviousRange(period, now);
  const sixMonthsAgo = getPeriodRange("6m", now).start;

  const [current, previous, allTime, savingsTxns] = await Promise.all([
    prisma.transaction.findMany({
      where: { userId, date: { gte: range.start, lte: range.end } },
      include: { category: true, tags: true },
    }),
    prisma.transaction.findMany({
      where: { userId, date: { gte: prevRange.start, lte: prevRange.end } },
      include: { category: true, tags: true },
    }),
    prisma.transaction.findMany({
      where: { userId },
      select: { type: true, amount: true },
    }),
    prisma.transaction.findMany({
      where: { userId, date: { gte: sixMonthsAgo } },
      select: { type: true, amount: true, date: true },
    }),
  ]);

  const curr = current.map(toTransactionDTO);
  const prev = previous.map(toTransactionDTO);

  const income = sumByType(curr, "INCOME");
  const expenses = sumByType(curr, "EXPENSE");
  const prevIncome = sumByType(prev, "INCOME");
  const prevExpenses = sumByType(prev, "EXPENSE");
  const savings = income - expenses;
  const prevSavings = prevIncome - prevExpenses;

  const balance = netTotal(
    allTime.map((t) => ({
      type: t.type as TransactionType,
      amount: toNumber(t.amount),
    })),
  );

  const budgetUsage = await getBudgetUsage(userId);

  return {
    summary: {
      balance,
      income,
      expenses,
      savings,
      savingsRate: savingsRate(income, expenses),
      previousIncome: prevIncome,
      previousExpenses: prevExpenses,
      previousSavings: prevSavings,
      incomeChange: percentChange(income, prevIncome),
      expenseChange: percentChange(expenses, prevExpenses),
      savingsChange: percentChange(savings, prevSavings),
    },
    trend: buildTrendSeries(period, curr),
    categoryBreakdown: aggregateByCategory(curr, "EXPENSE").slice(0, 8),
    recent: [...curr]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 8),
    savingsTrend: monthlyTotals(
      savingsTxns.map((t) => ({
        type: t.type as TransactionType,
        amount: toNumber(t.amount),
        date: t.date.toISOString(),
      })),
    ).map(({ month, savings: s }) => ({ label: month, savings: s })),
    budgetUtilization: {
      totalBudget: budgetUsage.totalBudget,
      totalSpent: budgetUsage.totalSpent,
      remaining: budgetUsage.remaining,
      utilization: budgetUsage.utilization,
      budgets: budgetUsage.budgets,
    },
  };
}

// ── Budgets ──────────────────────────────────────────────────────────────

export interface BudgetUsage {
  budgets: ReturnType<typeof toBudgetDTO>[];
  totalBudget: number;
  totalSpent: number;
  remaining: number;
  utilization: number;
  month: number;
  year: number;
}

export async function getBudgetUsage(
  userId: string,
  period: "MONTHLY" | "YEARLY" = "MONTHLY",
  month: number = new Date().getMonth(),
  year: number = new Date().getFullYear(),
): Promise<BudgetUsage> {
  const start = period === "MONTHLY" ? new Date(year, month, 1) : new Date(year, 0, 1);
  const end =
    period === "MONTHLY" ? new Date(year, month + 1, 1) : new Date(year + 1, 0, 1);

  const [budgets, expenses] = await Promise.all([
    prisma.budget.findMany({
      where: {
        userId,
        period,
        ...(period === "MONTHLY" ? { startMonth: month, startYear: year } : { startYear: year }),
      },
      include: { category: true },
      orderBy: { createdAt: "asc" },
    }),
    prisma.transaction.groupBy({
      by: ["categoryId"],
      where: { userId, type: "EXPENSE", date: { gte: start, lt: end } },
      _sum: { amount: true },
    }),
  ]);

  const spentByCategory = new Map(
    expenses.map((e) => [e.categoryId, toNumber(e._sum.amount)]),
  );
  const globalSpent = [...spentByCategory.values()].reduce((a, b) => a + b, 0);

  const list = budgets.map((b) => {
    const spent = b.categoryId ? (spentByCategory.get(b.categoryId) ?? 0) : globalSpent;
    return toBudgetDTO(b, spent);
  });

  const totalBudget = list.reduce((a, b) => a + b.amount, 0);
  const totalSpent = list.reduce((a, b) => a + b.spent, 0);
  const utilization = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

  return {
    budgets: list,
    totalBudget,
    totalSpent,
    remaining: Math.max(totalBudget - totalSpent, 0),
    utilization,
    month: period === "MONTHLY" ? month : 0,
    year,
  };
}

// ── Financial summary ────────────────────────────────────────────────────

export async function getFinancialSummary(
  userId: string,
  month: number = new Date().getMonth(),
  year: number = new Date().getFullYear(),
): Promise<FinancialSummary> {
  const start = new Date(year, month, 1);
  const end = new Date(year, month + 1, 1);

  const txns = await prisma.transaction.findMany({
    where: { userId, date: { gte: start, lt: end } },
    include: { category: true },
  });
  const dto = txns.map(toTransactionDTO);

  const income = sumByType(dto, "INCOME");
  const expenses = sumByType(dto, "EXPENSE");
  const top = aggregateByCategory(dto, "EXPENSE")[0] ?? null;
  const largest = largestTransaction(dto, "EXPENSE");
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  return {
    month: new Date(year, month, 1).toISOString(),
    income,
    expenses,
    savings: income - expenses,
    savingsRate: savingsRate(income, expenses),
    topCategory: top ? { name: top.name, amount: top.value, color: top.color } : null,
    largestExpense: largest
      ? { id: largest.id, description: largest.description, amount: largest.amount }
      : null,
    transactionCount: dto.length,
    avgDailyExpense: daysInMonth > 0 ? expenses / daysInMonth : 0,
  };
}

// ── Analytics ────────────────────────────────────────────────────────────

export interface AnalyticsData {
  totals: {
    income: number;
    expenses: number;
    savings: number;
    rate: number;
    count: number;
  };
  monthly: { month: string; income: number; expenses: number; savings: number }[];
  byCategory: { name: string; color: string; value: number }[];
  topCategories: { name: string; color: string; value: number }[];
  incomeByCategory: { name: string; color: string; value: number }[];
  transactions: TransactionDTO[];
}

export async function getAnalyticsData(
  userId: string,
  from: Date,
  to: Date,
): Promise<AnalyticsData> {
  const txns = await prisma.transaction.findMany({
    where: { userId, date: { gte: startOfDay(from), lte: endOfDay(to) } },
    include: { category: true, tags: true },
    orderBy: { date: "asc" },
  });
  const dto = txns.map(toTransactionDTO);
  const income = sumByType(dto, "INCOME");
  const expenses = sumByType(dto, "EXPENSE");

  return {
    totals: {
      income,
      expenses,
      savings: income - expenses,
      rate: savingsRate(income, expenses),
      count: dto.length,
    },
    monthly: monthlyTotals(dto),
    byCategory: aggregateByCategory(dto, "EXPENSE"),
    topCategories: aggregateByCategory(dto, "EXPENSE").slice(0, 6),
    incomeByCategory: aggregateByCategory(dto, "INCOME"),
    transactions: dto,
  };
}

// ── Reports ──────────────────────────────────────────────────────────────

export type ReportType = "monthly" | "yearly" | "category" | "income" | "expense" | "all";

export interface ReportData {
  type: ReportType;
  from: string;
  to: string;
  totals: {
    income: number;
    expenses: number;
    savings: number;
    rate: number;
    count: number;
  };
  monthly: { month: string; income: number; expenses: number; savings: number }[];
  topCategories: { name: string; color: string; value: number }[];
  largestIncome: TransactionDTO | null;
  largestExpense: TransactionDTO | null;
  transactions: TransactionDTO[];
  categories: CategoryDTO[];
  recurring: RecurringDTO[];
}

export async function getReportData(
  userId: string,
  type: ReportType,
  from: Date,
  to: Date,
): Promise<ReportData> {
  const start = startOfDay(from);
  const end = endOfDay(to);

  const where: Record<string, unknown> = { userId, date: { gte: start, lte: end } };
  if (type === "income") where.type = "INCOME";
  if (type === "expense") where.type = "EXPENSE";

  const [txns, categories, recurring] = await Promise.all([
    prisma.transaction.findMany({
      where,
      include: { category: true, tags: true },
      orderBy: { date: "desc" },
    }),
    prisma.category.findMany({
      where: { userId },
      include: { _count: { select: { transactions: true } } },
    }),
    prisma.recurringTransaction.findMany({
      where: { userId, isActive: true },
      include: { category: true },
      orderBy: { nextRunDate: "asc" },
    }),
  ]);

  const dto = txns.map(toTransactionDTO);
  const income = sumByType(dto, "INCOME");
  const expenses = sumByType(dto, "EXPENSE");

  return {
    type,
    from: start.toISOString(),
    to: end.toISOString(),
    totals: {
      income,
      expenses,
      savings: income - expenses,
      rate: savingsRate(income, expenses),
      count: dto.length,
    },
    monthly: monthlyTotals(dto),
    topCategories: aggregateByCategory(dto, "EXPENSE").slice(0, 6),
    largestIncome: largestTransaction(dto, "INCOME"),
    largestExpense: largestTransaction(dto, "EXPENSE"),
    transactions: dto,
    categories: categories
      .filter((c) => c._count.transactions > 0 || type === "category")
      .map(toCategoryDTO),
    recurring: recurring.map(toRecurringDTO),
  };
}

// ── Global search ────────────────────────────────────────────────────────

export async function globalSearch(userId: string, query: string): Promise<SearchResults> {
  const q = query.trim();
  if (!q) return { transactions: [], categories: [], budgets: [], recurring: [] };

  const [transactions, categories, budgets, recurring] = await Promise.all([
    prisma.transaction.findMany({
      where: { userId, description: { contains: q, mode: "insensitive" } },
      include: { category: true, tags: true },
      orderBy: { date: "desc" },
      take: 5,
    }),
    prisma.category.findMany({
      where: { userId, name: { contains: q, mode: "insensitive" } },
      take: 5,
    }),
    prisma.budget.findMany({
      where: { userId, name: { contains: q, mode: "insensitive" } },
      take: 5,
    }),
    prisma.recurringTransaction.findMany({
      where: { userId, name: { contains: q, mode: "insensitive" } },
      include: { category: true },
      take: 5,
    }),
  ]);

  return {
    transactions: transactions.map(toTransactionDTO),
    categories: categories.map(toCategoryDTO),
    budgets: budgets.map((b) => ({
      id: b.id,
      name: b.name,
      amount: toNumber(b.amount),
      period: b.period as "MONTHLY" | "YEARLY",
    })),
    recurring: recurring.map(toRecurringDTO),
  };
}
