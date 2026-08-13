import type { Prisma } from "@/generated/prisma/client";

export type CurrencyCode = "INR" | "USD" | "EUR" | "GBP";
export type ThemeMode = "light" | "dark" | "system";

export type Money = Prisma.Decimal | number | string;

export type TransactionType = "INCOME" | "EXPENSE";
export type PaymentMethod =
  | "CASH"
  | "BANK_TRANSFER"
  | "CREDIT_CARD"
  | "DEBIT_CARD"
  | "UPI"
  | "OTHER";
export type Frequency = "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY";
export type BudgetPeriod = "MONTHLY" | "YEARLY";
export type NotificationType =
  | "BUDGET_APPROACHING"
  | "BUDGET_EXCEEDED"
  | "RECURRING_UPCOMING"
  | "MONTHLY_SUMMARY";

export type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string };

// ── Client-safe DTOs (Decimals serialised to numbers) ────────────────────

export interface CategoryDTO {
  id: string;
  name: string;
  type: TransactionType;
  icon: string;
  color: string;
  isDefault: boolean;
}

export interface TagDTO {
  id: string;
  name: string;
}

export interface TransactionDTO {
  id: string;
  categoryId: string;
  type: TransactionType;
  amount: number;
  description: string;
  date: string;
  paymentMethod: PaymentMethod;
  account: string | null;
  notes: string | null;
  isRecurring: boolean;
  recurringId: string | null;
  createdAt: string;
  updatedAt: string;
  category: CategoryDTO;
  tags: TagDTO[];
}

export interface BudgetDTO {
  id: string;
  categoryId: string | null;
  name: string;
  amount: number;
  period: BudgetPeriod;
  startMonth: number | null;
  startYear: number | null;
  category: CategoryDTO | null;
  spent: number;
  remaining: number;
  utilization: number;
  status: "idle" | "approaching" | "exceeded";
}

export interface RecurringDTO {
  id: string;
  categoryId: string;
  name: string;
  type: TransactionType;
  amount: number;
  frequency: Frequency;
  startDate: string;
  endDate: string | null;
  paymentMethod: PaymentMethod;
  account: string | null;
  nextRunDate: string;
  isActive: boolean;
  category: CategoryDTO;
}

export interface NotificationDTO {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export interface UserDTO {
  id: string;
  name: string;
  email: string;
  currency: CurrencyCode;
  theme: ThemeMode;
  image: string | null;
  notificationPrefs: {
    budgetAlerts: boolean;
    recurringReminders: boolean;
    monthlySummary: boolean;
  };
  createdAt: string;
}

export interface DashboardSummary {
  balance: number;
  income: number;
  expenses: number;
  savings: number;
  savingsRate: number;
  previousIncome: number;
  previousExpenses: number;
  previousSavings: number;
  incomeChange: number | null;
  expenseChange: number | null;
  savingsChange: number | null;
}

export interface FinancialSummary {
  month: string;
  income: number;
  expenses: number;
  savings: number;
  savingsRate: number;
  topCategory: { name: string; amount: number; color: string } | null;
  largestExpense: { id: string; description: string; amount: number } | null;
  transactionCount: number;
  avgDailyExpense: number;
}

export interface SearchResults {
  transactions: TransactionDTO[];
  categories: CategoryDTO[];
  budgets: { id: string; name: string; amount: number; period: BudgetPeriod }[];
  recurring: RecurringDTO[];
}
