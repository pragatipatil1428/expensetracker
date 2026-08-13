import type {
  BudgetPeriod,
  CurrencyCode,
  Frequency,
  NotificationType,
  PaymentMethod,
} from "@/lib/types";

export const PAYMENT_METHODS: { value: PaymentMethod; label: string }[] = [
  { value: "CASH", label: "Cash" },
  { value: "BANK_TRANSFER", label: "Bank Transfer" },
  { value: "CREDIT_CARD", label: "Credit Card" },
  { value: "DEBIT_CARD", label: "Debit Card" },
  { value: "UPI", label: "UPI" },
  { value: "OTHER", label: "Other" },
];

export const PAYMENT_METHOD_LABELS = Object.fromEntries(
  PAYMENT_METHODS.map((m) => [m.value, m.label]),
) as Record<PaymentMethod, string>;

export const FREQUENCIES: { value: Frequency; label: string }[] = [
  { value: "DAILY", label: "Daily" },
  { value: "WEEKLY", label: "Weekly" },
  { value: "MONTHLY", label: "Monthly" },
  { value: "YEARLY", label: "Yearly" },
];

export const FREQUENCY_LABELS = Object.fromEntries(
  FREQUENCIES.map((f) => [f.value, f.label]),
) as Record<Frequency, string>;

export const CURRENCIES: { code: CurrencyCode; label: string; symbol: string }[] = [
  { code: "INR", label: "Indian Rupee", symbol: "₹" },
  { code: "USD", label: "US Dollar", symbol: "$" },
  { code: "EUR", label: "Euro", symbol: "€" },
  { code: "GBP", label: "British Pound", symbol: "£" },
];

export const CURRENCY_SYMBOLS: Record<CurrencyCode, string> = {
  INR: "₹",
  USD: "$",
  EUR: "€",
  GBP: "£",
};

export const THEME_OPTIONS: { value: "light" | "dark" | "system"; label: string }[] = [
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
  { value: "system", label: "System" },
];

export const BUDGET_PERIODS: { value: BudgetPeriod; label: string }[] = [
  { value: "MONTHLY", label: "Monthly" },
  { value: "YEARLY", label: "Yearly" },
];

export const BUDGET_PERIOD_LABELS = Object.fromEntries(
  BUDGET_PERIODS.map((b) => [b.value, b.label]),
) as Record<BudgetPeriod, string>;

export const CHART_PERIODS = [
  { value: "7d", label: "7D" },
  { value: "30d", label: "30D" },
  { value: "3m", label: "3M" },
  { value: "6m", label: "6M" },
  { value: "1y", label: "1Y" },
] as const;

export type ChartPeriod = (typeof CHART_PERIODS)[number]["value"];

export const NOTIFICATION_TYPE_LABELS: Record<NotificationType, string> = {
  BUDGET_APPROACHING: "Budget alert",
  BUDGET_EXCEEDED: "Budget exceeded",
  RECURRING_UPCOMING: "Upcoming payment",
  MONTHLY_SUMMARY: "Monthly summary",
};

interface DefaultCategory {
  name: string;
  icon: string;
  color: string;
}

export const DEFAULT_EXPENSE_CATEGORIES: DefaultCategory[] = [
  { name: "Food", icon: "utensils", color: "#f97316" },
  { name: "Shopping", icon: "shopping-bag", color: "#ec4899" },
  { name: "Transportation", icon: "car", color: "#06b6d4" },
  { name: "Entertainment", icon: "clapperboard", color: "#8b5cf6" },
  { name: "Bills", icon: "receipt", color: "#f59e0b" },
  { name: "Health", icon: "heart-pulse", color: "#ef4444" },
  { name: "Education", icon: "graduation-cap", color: "#3b82f6" },
  { name: "Travel", icon: "plane", color: "#0ea5e9" },
  { name: "Rent", icon: "home", color: "#64748b" },
  { name: "Subscriptions", icon: "repeat", color: "#a855f7" },
  { name: "Other", icon: "tag", color: "#6b7280" },
];

export const DEFAULT_INCOME_CATEGORIES: DefaultCategory[] = [
  { name: "Salary", icon: "briefcase", color: "#10b981" },
  { name: "Freelance", icon: "laptop", color: "#6366f1" },
  { name: "Business", icon: "store", color: "#14b8a6" },
  { name: "Investment", icon: "trending-up", color: "#22c55e" },
  { name: "Bonus", icon: "gift", color: "#d946ef" },
  { name: "Other", icon: "tag", color: "#6b7280" },
];

export const CATEGORY_COLOR_PRESETS = [
  "#6366f1",
  "#8b5cf6",
  "#a855f7",
  "#ec4899",
  "#f43f5e",
  "#ef4444",
  "#f97316",
  "#f59e0b",
  "#eab308",
  "#84cc16",
  "#22c55e",
  "#10b981",
  "#14b8a6",
  "#06b6d4",
  "#0ea5e9",
  "#3b82f6",
  "#64748b",
  "#6b7280",
];

export const ACCOUNT_PRESETS = [
  "Cash",
  "HDFC Savings",
  "SBI Savings",
  "ICICI Savings",
  "Axis Savings",
  "Paytm",
  "PhonePe",
  "Google Pay",
];

export const TRANSACTION_SORT_OPTIONS = [
  { value: "newest", label: "Newest first" },
  { value: "oldest", label: "Oldest first" },
  { value: "amount-desc", label: "Highest amount" },
  { value: "amount-asc", label: "Lowest amount" },
] as const;

export type TransactionSort = (typeof TRANSACTION_SORT_OPTIONS)[number]["value"];

export const NAV_ITEMS: {
  href: string;
  label: string;
  segment: string;
}[] = [
  { href: "/dashboard", label: "Dashboard", segment: "dashboard" },
  { href: "/transactions", label: "Transactions", segment: "transactions" },
  { href: "/budgets", label: "Budgets", segment: "budgets" },
  { href: "/categories", label: "Categories", segment: "categories" },
  { href: "/recurring", label: "Recurring", segment: "recurring" },
  { href: "/analytics", label: "Analytics", segment: "analytics" },
  { href: "/reports", label: "Reports", segment: "reports" },
  { href: "/settings", label: "Settings", segment: "settings" },
];
