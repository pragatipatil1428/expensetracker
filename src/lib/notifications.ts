import "server-only";

import { format } from "date-fns";
import { prisma } from "@/lib/prisma";
import { toNumber } from "@/lib/format";
import { getBudgetUsage, getFinancialSummary } from "@/lib/queries";

interface UserPrefs {
  budgetAlerts: boolean;
  recurringReminders: boolean;
  monthlySummary: boolean;
  currency: string;
}

async function getPrefs(userId: string): Promise<UserPrefs> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { notificationPrefs: true, currency: true },
  });
  const prefs = user?.notificationPrefs as Partial<UserPrefs> | null | undefined;
  return {
    budgetAlerts: prefs?.budgetAlerts ?? true,
    recurringReminders: prefs?.recurringReminders ?? true,
    monthlySummary: prefs?.monthlySummary ?? true,
    currency: user?.currency ?? "INR",
  };
}

function money(amount: number, currency: string): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

async function upsert(userId: string, key: string, type: string, title: string, message: string) {
  try {
    await prisma.notification.upsert({
      where: { userId_key: { userId, key } },
      update: {},
      create: { userId, key, type, title, message },
    });
  } catch (error) {
    // Ignore race conditions between concurrent syncs.
    console.error("notification upsert failed:", error);
  }
}

/** Creates "approaching" / "exceeded" alerts for every budget in the current month. */
export async function syncBudgetNotifications(userId: string): Promise<void> {
  const prefs = await getPrefs(userId);
  if (!prefs.budgetAlerts) return;

  const now = new Date();
  const month = now.getMonth();
  const year = now.getFullYear();
  const monthKey = format(now, "yyyy-MM");
  const usage = await getBudgetUsage(userId, "MONTHLY", month, year);

  for (const budget of usage.budgets) {
    const label = budget.category?.name ?? budget.name;
    if (budget.status === "exceeded") {
      const over = budget.spent - budget.amount;
      await upsert(
        userId,
        `budget-exceeded:${label}:${monthKey}`,
        "BUDGET_EXCEEDED",
        `Budget exceeded · ${label}`,
        `${label} is over budget by ${money(over, prefs.currency)} this month.`,
      );
    } else if (budget.status === "approaching") {
      await upsert(
        userId,
        `budget-approaching:${label}:${monthKey}`,
        "BUDGET_APPROACHING",
        `Approaching budget · ${label}`,
        `${label} has used ${Math.round(budget.utilization)}% of its budget. ${money(budget.remaining, prefs.currency)} left.`,
      );
    }
  }
}

/** Reminds about active recurring transactions due within the next 3 days. */
export async function syncRecurringNotifications(userId: string): Promise<void> {
  const prefs = await getPrefs(userId);
  if (!prefs.recurringReminders) return;

  const now = new Date();
  const horizon = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

  const upcoming = await prisma.recurringTransaction.findMany({
    where: {
      userId,
      isActive: true,
      nextRunDate: { gte: now, lte: horizon },
    },
    include: { category: true },
    orderBy: { nextRunDate: "asc" },
  });

  for (const item of upcoming) {
    const dayKey = format(item.nextRunDate, "yyyy-MM-dd");
    await upsert(
      userId,
      `recurring-upcoming:${item.id}:${dayKey}`,
      "RECURRING_UPCOMING",
      `Upcoming payment · ${item.name}`,
      `${item.name} of ${money(toNumber(item.amount), prefs.currency)} is due ${format(item.nextRunDate, "MMM d")}.`,
    );
  }
}

/** Generates the monthly financial summary notification once per month. */
export async function ensureMonthlySummary(userId: string): Promise<void> {
  const prefs = await getPrefs(userId);
  if (!prefs.monthlySummary) return;

  const now = new Date();
  const summary = await getFinancialSummary(userId, now.getMonth(), now.getFullYear());
  const monthKey = format(now, "yyyy-MM");

  await upsert(
    userId,
    `monthly-summary:${monthKey}`,
    "MONTHLY_SUMMARY",
    `Monthly summary · ${format(now, "MMMM yyyy")}`,
    `Income ${money(summary.income, prefs.currency)} · Expenses ${money(summary.expenses, prefs.currency)} · Savings ${money(summary.savings, prefs.currency)} (${summary.savingsRate.toFixed(1)}%)`,
  );
}

export async function syncNotifications(userId: string): Promise<void> {
  await Promise.all([
    syncBudgetNotifications(userId),
    syncRecurringNotifications(userId),
    ensureMonthlySummary(userId),
  ]);
}
