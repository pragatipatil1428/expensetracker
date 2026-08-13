import { format, formatDistanceToNow, isToday, isYesterday } from "date-fns";
import type { Prisma } from "@/generated/prisma/client";

export type Money = Prisma.Decimal | number | string | null | undefined;

export function toNumber(value: Money): number {
  if (value === null || value === undefined) return 0;
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const n = Number(value);
    return Number.isFinite(n) ? n : 0;
  }
  return value.toNumber();
}

const CURRENCY_LOCALES: Record<string, string> = {
  INR: "en-IN",
  USD: "en-US",
  EUR: "de-DE",
  GBP: "en-GB",
};

interface FormatCurrencyOptions {
  compact?: boolean;
  signDisplay?: "auto" | "always" | "exceptZero";
  maximumFractionDigits?: number;
}

export function formatCurrency(
  amount: Money,
  currency: string = "INR",
  options: FormatCurrencyOptions = {},
): string {
  const value = toNumber(amount);
  const locale = CURRENCY_LOCALES[currency] ?? "en-IN";
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    notation: options.compact ? "compact" : "standard",
    maximumFractionDigits: options.maximumFractionDigits ?? (options.compact ? 1 : 2),
    minimumFractionDigits: options.compact ? 0 : Math.min(options.maximumFractionDigits ?? (options.compact ? 1 : 2), 2),
    signDisplay: options.signDisplay ?? "auto",
  }).format(value);
}

export function formatNumber(value: Money, maximumFractionDigits = 2): string {
  return new Intl.NumberFormat("en-IN", {
    maximumFractionDigits,
    minimumFractionDigits: 0,
  }).format(toNumber(value));
}

export function formatPercent(value: number, digits = 1): string {
  if (!Number.isFinite(value)) return "—";
  return `${value.toFixed(digits)}%`;
}

export function formatSignedPercent(value: number, digits = 1): string {
  if (!Number.isFinite(value)) return "—";
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(digits)}%`;
}

export function formatDate(date: Date | string, pattern = "MMM d, yyyy"): string {
  return format(new Date(date), pattern);
}

export function formatDateTime(date: Date | string, pattern = "MMM d, yyyy h:mm a"): string {
  return format(new Date(date), pattern);
}

export function formatMonthYear(date: Date | string): string {
  return format(new Date(date), "MMMM yyyy");
}

export function formatRelative(date: Date | string): string {
  return formatDistanceToNow(new Date(date), { addSuffix: true });
}

export function formatDayLabel(date: Date | string): string {
  const d = new Date(date);
  if (isToday(d)) return "Today";
  if (isYesterday(d)) return "Yesterday";
  return format(d, "EEE, MMM d");
}

export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0) return "?";
  const first = parts[0][0] ?? "";
  const second = parts.length > 1 ? (parts[parts.length - 1][0] ?? "") : "";
  return (first + second).toUpperCase();
}

export function toISODate(date: Date): string {
  return date.toISOString();
}
