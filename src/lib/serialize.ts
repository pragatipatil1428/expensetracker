import type {
  Budget,
  Category,
  Notification,
  RecurringTransaction,
  Transaction,
  User,
} from "@/generated/prisma/client";
import { toNumber } from "@/lib/format";
import type {
  BudgetDTO,
  CategoryDTO,
  NotificationDTO,
  RecurringDTO,
  TransactionDTO,
  UserDTO,
} from "@/lib/types";

export function toCategoryDTO(category: Category): CategoryDTO {
  return {
    id: category.id,
    name: category.name,
    type: category.type as CategoryDTO["type"],
    icon: category.icon,
    color: category.color,
    isDefault: category.isDefault,
  };
}

export function toTransactionDTO(transaction: Transaction & {
  category?: Category;
  tags?: { id: string; name: string }[];
}): TransactionDTO {
  return {
    id: transaction.id,
    categoryId: transaction.categoryId,
    type: transaction.type as TransactionDTO["type"],
    amount: toNumber(transaction.amount),
    description: transaction.description,
    date: transaction.date.toISOString(),
    paymentMethod: transaction.paymentMethod as TransactionDTO["paymentMethod"],
    account: transaction.account,
    notes: transaction.notes,
    isRecurring: transaction.isRecurring,
    recurringId: transaction.recurringId,
    createdAt: transaction.createdAt.toISOString(),
    updatedAt: transaction.updatedAt.toISOString(),
    category: transaction.category ? toCategoryDTO(transaction.category) : { id: transaction.categoryId, name: "Unknown", type: transaction.type as "INCOME" | "EXPENSE", icon: "tag", color: "#6b7280", isDefault: false },
    tags: transaction.tags ?? [],
  };
}

export function toRecurringDTO(recurring: RecurringTransaction & {
  category?: Category;
}): RecurringDTO {
  return {
    id: recurring.id,
    categoryId: recurring.categoryId,
    name: recurring.name,
    type: recurring.type as RecurringDTO["type"],
    amount: toNumber(recurring.amount),
    frequency: recurring.frequency as RecurringDTO["frequency"],
    startDate: recurring.startDate.toISOString(),
    endDate: recurring.endDate?.toISOString() ?? null,
    paymentMethod: recurring.paymentMethod as RecurringDTO["paymentMethod"],
    account: recurring.account,
    nextRunDate: recurring.nextRunDate.toISOString(),
    isActive: recurring.isActive,
    category: recurring.category
      ? toCategoryDTO(recurring.category)
      : { id: recurring.categoryId, name: "Unknown", type: recurring.type as "INCOME" | "EXPENSE", icon: "tag", color: "#6b7280", isDefault: false },
  };
}

export function toNotificationDTO(notification: Notification): NotificationDTO {
  return {
    id: notification.id,
    type: notification.type as NotificationDTO["type"],
    title: notification.title,
    message: notification.message,
    read: notification.read,
    createdAt: notification.createdAt.toISOString(),
  };
}

export function toUserDTO(user: User): UserDTO {
  let prefs = { budgetAlerts: true, recurringReminders: true, monthlySummary: true };
  try {
    if (user.notificationPrefs && typeof user.notificationPrefs === "object") {
      prefs = { ...prefs, ...(user.notificationPrefs as Partial<typeof prefs>) };
    }
  } catch {
    // keep defaults on malformed data
  }
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    currency: (user.currency as UserDTO["currency"]) ?? "INR",
    theme: (user.theme as UserDTO["theme"]) ?? "system",
    image: user.image,
    notificationPrefs: prefs,
    createdAt: user.createdAt.toISOString(),
  };
}

export function toBudgetDTO(
  budget: Budget & { category?: Category | null },
  spent: number,
): BudgetDTO {
  const amount = toNumber(budget.amount);
  const utilization = amount > 0 ? (spent / amount) * 100 : 0;
  return {
    id: budget.id,
    categoryId: budget.categoryId,
    name: budget.name,
    amount,
    period: budget.period as BudgetDTO["period"],
    startMonth: budget.startMonth,
    startYear: budget.startYear,
    category: budget.category ? toCategoryDTO(budget.category) : null,
    spent,
    remaining: Math.max(amount - spent, 0),
    utilization,
    status: utilization >= 100 ? "exceeded" : utilization >= 80 ? "approaching" : "idle",
  };
}
