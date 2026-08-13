import { z } from "zod";

const paymentMethodSchema = z.enum([
  "CASH",
  "BANK_TRANSFER",
  "CREDIT_CARD",
  "DEBIT_CARD",
  "UPI",
  "OTHER",
]);

const optionalText = (max: number, message: string) =>
  z
    .string()
    .trim()
    .max(max, message)
    .optional()
    .transform((v) => (v ? v : undefined));

export const transactionSchema = z.object({
  type: z.enum(["INCOME", "EXPENSE"], { message: "Select a type" }),
  amount: z.coerce
    .number({ message: "Enter an amount" })
    .positive("Amount must be greater than 0")
    .max(999_999_999, "Amount is too large")
    .transform((v) => Math.round(v * 100) / 100),
  description: z
    .string()
    .trim()
    .min(1, "Description is required")
    .max(120, "Description must be at most 120 characters"),
  categoryId: z.string().min(1, "Select a category"),
  date: z.string().min(1, "Select a date"),
  paymentMethod: paymentMethodSchema.default("UPI"),
  account: optionalText(60, "Account must be at most 60 characters"),
  notes: optionalText(500, "Notes must be at most 500 characters"),
  tags: z
    .array(z.string().trim().min(1).max(30))
    .max(8, "You can add at most 8 tags")
    .default([]),
});

export const categorySchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Name is required")
    .max(40, "Name must be at most 40 characters"),
  type: z.enum(["INCOME", "EXPENSE"]),
  icon: z.string().min(1, "Pick an icon"),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Pick a valid color"),
});

export const budgetSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Name is required")
    .max(60, "Name must be at most 60 characters"),
  amount: z.coerce
    .number({ message: "Enter an amount" })
    .positive("Budget amount must be greater than 0")
    .max(999_999_999, "Amount is too large")
    .transform((v) => Math.round(v * 100) / 100),
  period: z.enum(["MONTHLY", "YEARLY"]).default("MONTHLY"),
  categoryId: z.string().optional(),
});

export const recurringSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Name is required")
    .max(60, "Name must be at most 60 characters"),
  type: z.enum(["INCOME", "EXPENSE"]),
  amount: z.coerce
    .number({ message: "Enter an amount" })
    .positive("Amount must be greater than 0")
    .max(999_999_999, "Amount is too large")
    .transform((v) => Math.round(v * 100) / 100),
  categoryId: z.string().min(1, "Select a category"),
  frequency: z.enum(["DAILY", "WEEKLY", "MONTHLY", "YEARLY"]),
  startDate: z.string().min(1, "Select a start date"),
  endDate: z.string().optional(),
  paymentMethod: paymentMethodSchema.default("UPI"),
  account: optionalText(60, "Account must be at most 60 characters"),
  isActive: z.boolean().default(true),
});

export const settingsSchema = z.object({
  currency: z.enum(["INR", "USD", "EUR", "GBP"]),
  theme: z.enum(["light", "dark", "system"]),
  notificationPrefs: z.object({
    budgetAlerts: z.boolean(),
    recurringReminders: z.boolean(),
    monthlySummary: z.boolean(),
  }),
});

export type TransactionInput = z.infer<typeof transactionSchema>;
export type CategoryInput = z.infer<typeof categorySchema>;
export type BudgetInput = z.infer<typeof budgetSchema>;
export type RecurringInput = z.infer<typeof recurringSchema>;
export type SettingsInput = z.infer<typeof settingsSchema>;
