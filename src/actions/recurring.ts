"use server";

import { addDays, addMonths, addWeeks, addYears, isAfter } from "date-fns";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId, requireUserId } from "@/lib/auth-helpers";
import { toRecurringDTO } from "@/lib/serialize";
import { recurringSchema } from "@/schemas/transaction";
import type { ActionResult, Frequency, RecurringDTO } from "@/lib/types";

export async function getRecurringAction(): Promise<ActionResult<RecurringDTO[]>> {
  const userId = await getCurrentUserId();
  if (!userId) return { success: false, error: "Not authenticated." };
  const items = await prisma.recurringTransaction.findMany({
    where: { userId },
    include: { category: true },
    orderBy: [{ isActive: "desc" }, { nextRunDate: "asc" }],
  });
  return { success: true, data: items.map(toRecurringDTO) };
}

function firstError(error: { issues: { message: string }[] }): string {
  return error.issues[0]?.message ?? "Invalid input.";
}

function parseLocalDate(value: string): Date {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, (month ?? 1) - 1, day ?? 1);
}

function computeNextRunDate(
  startDate: Date,
  frequency: Frequency,
  from: Date = new Date(),
): Date {
  let next = startDate;
  while (!isAfter(next, from)) {
    switch (frequency) {
      case "DAILY":
        next = addDays(next, 1);
        break;
      case "WEEKLY":
        next = addWeeks(next, 1);
        break;
      case "MONTHLY":
        next = addMonths(next, 1);
        break;
      case "YEARLY":
        next = addYears(next, 1);
        break;
    }
  }
  return next;
}

async function verifyCategoryOwnership(userId: string, categoryId: string) {
  const category = await prisma.category.findFirst({
    where: { id: categoryId, userId },
    select: { id: true },
  });
  if (!category) throw new Error("Invalid category.");
}

export async function createRecurringAction(
  input: unknown,
): Promise<ActionResult<{ id: string }>> {
  const parsed = recurringSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: firstError(parsed.error) };

  const userId = await requireUserId();
  try {
    await verifyCategoryOwnership(userId, parsed.data.categoryId);

    const startDate = parseLocalDate(parsed.data.startDate);
    const nextRunDate = computeNextRunDate(startDate, parsed.data.frequency);

    const recurring = await prisma.recurringTransaction.create({
      data: {
        userId,
        name: parsed.data.name,
        type: parsed.data.type,
        amount: parsed.data.amount,
        categoryId: parsed.data.categoryId,
        frequency: parsed.data.frequency,
        startDate,
        endDate: parsed.data.endDate ? parseLocalDate(parsed.data.endDate) : null,
        paymentMethod: parsed.data.paymentMethod,
        account: parsed.data.account ?? null,
        nextRunDate,
        isActive: parsed.data.isActive,
      },
      select: { id: true },
    });
    return { success: true, data: { id: recurring.id } };
  } catch (error) {
    console.error("Create recurring failed:", error);
    return { success: false, error: "Could not create the recurring transaction. Please try again." };
  }
}

export async function updateRecurringAction(
  id: string,
  input: unknown,
): Promise<ActionResult<{ id: string }>> {
  const parsed = recurringSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: firstError(parsed.error) };

  const userId = await requireUserId();
  try {
    const existing = await prisma.recurringTransaction.findFirst({
      where: { id, userId },
      select: { id: true },
    });
    if (!existing) return { success: false, error: "Recurring transaction not found." };

    await verifyCategoryOwnership(userId, parsed.data.categoryId);

    const startDate = parseLocalDate(parsed.data.startDate);
    await prisma.recurringTransaction.update({
      where: { id },
      data: {
        name: parsed.data.name,
        type: parsed.data.type,
        amount: parsed.data.amount,
        categoryId: parsed.data.categoryId,
        frequency: parsed.data.frequency,
        startDate,
        endDate: parsed.data.endDate ? parseLocalDate(parsed.data.endDate) : null,
        paymentMethod: parsed.data.paymentMethod,
        account: parsed.data.account ?? null,
        isActive: parsed.data.isActive,
        nextRunDate: computeNextRunDate(startDate, parsed.data.frequency),
      },
    });
    return { success: true, data: { id } };
  } catch (error) {
    console.error("Update recurring failed:", error);
    return { success: false, error: "Could not update the recurring transaction. Please try again." };
  }
}

export async function deleteRecurringAction(id: string): Promise<ActionResult> {
  const userId = await requireUserId();
  try {
    const existing = await prisma.recurringTransaction.findFirst({
      where: { id, userId },
      select: { id: true },
    });
    if (!existing) return { success: false, error: "Recurring transaction not found." };

    await prisma.recurringTransaction.delete({ where: { id } });
    return { success: true, data: undefined };
  } catch (error) {
    console.error("Delete recurring failed:", error);
    return { success: false, error: "Could not delete the recurring transaction. Please try again." };
  }
}

export async function toggleRecurringAction(
  id: string,
  isActive: boolean,
): Promise<ActionResult> {
  const userId = await requireUserId();
  try {
    const existing = await prisma.recurringTransaction.findFirst({
      where: { id, userId },
      select: { id: true },
    });
    if (!existing) return { success: false, error: "Recurring transaction not found." };

    await prisma.recurringTransaction.update({ where: { id }, data: { isActive } });
    return { success: true, data: undefined };
  } catch (error) {
    console.error("Toggle recurring failed:", error);
    return { success: false, error: "Could not update the recurring transaction." };
  }
}

/**
 * Records the next occurrence as a real transaction and advances the
 * next-run date. Returns the created transaction id.
 */
export async function recordRecurringAction(id: string): Promise<ActionResult<{ id: string }>> {
  const userId = await requireUserId();
  try {
    const recurring = await prisma.recurringTransaction.findFirst({
      where: { id, userId },
      select: {
        id: true,
        name: true,
        type: true,
        amount: true,
        categoryId: true,
        frequency: true,
        paymentMethod: true,
        account: true,
        nextRunDate: true,
        endDate: true,
        isActive: true,
      },
    });
    if (!recurring) return { success: false, error: "Recurring transaction not found." };

    const nextRun = recurring.nextRunDate;
    if (recurring.endDate && nextRun > recurring.endDate) {
      return { success: false, error: "This recurring transaction has ended." };
    }

    const transaction = await prisma.transaction.create({
      data: {
        userId,
        categoryId: recurring.categoryId,
        recurringId: recurring.id,
        type: recurring.type,
        amount: recurring.amount,
        description: recurring.name,
        date: nextRun,
        paymentMethod: recurring.paymentMethod,
        account: recurring.account,
        isRecurring: true,
      },
      select: { id: true },
    });

    const nextNext = computeNextRunDate(nextRun, recurring.frequency);
    const stillActive = !recurring.endDate || nextNext <= recurring.endDate;
    await prisma.recurringTransaction.update({
      where: { id },
      data: { nextRunDate: nextNext, isActive: recurring.isActive && stillActive },
    });

    return { success: true, data: { id: transaction.id } };
  } catch (error) {
    console.error("Record recurring failed:", error);
    return { success: false, error: "Could not record this payment. Please try again." };
  }
}
