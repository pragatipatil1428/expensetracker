"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUserId, requireUserId } from "@/lib/auth-helpers";
import { getBudgetUsage } from "@/lib/queries";
import { budgetSchema } from "@/schemas/transaction";
import type { ActionResult } from "@/lib/types";

export async function getBudgetsAction(
  period: "MONTHLY" | "YEARLY" = "MONTHLY",
  month: number = new Date().getMonth(),
  year: number = new Date().getFullYear(),
): Promise<ActionResult<Awaited<ReturnType<typeof getBudgetUsage>>>> {
  const userId = await getCurrentUserId();
  if (!userId) return { success: false, error: "Not authenticated." };
  const data = await getBudgetUsage(userId, period, month, year);
  return { success: true, data };
}

function firstError(error: { issues: { message: string }[] }): string {
  return error.issues[0]?.message ?? "Invalid input.";
}

export async function createBudgetAction(input: unknown): Promise<ActionResult<{ id: string }>> {
  const parsed = budgetSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: firstError(parsed.error) };

  const userId = await requireUserId();
  try {
    if (parsed.data.categoryId) {
      const category = await prisma.category.findFirst({
        where: { id: parsed.data.categoryId, userId },
        select: { id: true },
      });
      if (!category) return { success: false, error: "Invalid category." };
    }

    const now = new Date();
    const startMonth = parsed.data.period === "MONTHLY" ? now.getMonth() : null;
    const startYear = now.getFullYear();

    const existing = await prisma.budget.findFirst({
      where: {
        userId,
        period: parsed.data.period,
        startMonth: parsed.data.period === "MONTHLY" ? startMonth : null,
        startYear,
        categoryId: parsed.data.categoryId ?? null,
      },
      select: { id: true, name: true },
    });
    if (existing) {
      return {
        success: false,
        error: `You already have a budget for "${existing.name}" this ${parsed.data.period.toLowerCase()} period. Edit it instead.`,
      };
    }

    const budget = await prisma.budget.create({
      data: {
        userId,
        name: parsed.data.name,
        amount: parsed.data.amount,
        period: parsed.data.period,
        categoryId: parsed.data.categoryId ?? null,
        startMonth,
        startYear,
      },
      select: { id: true },
    });
    return { success: true, data: { id: budget.id } };
  } catch (error) {
    console.error("Create budget failed:", error);
    return { success: false, error: "Could not create the budget. Please try again." };
  }
}

export async function updateBudgetAction(
  id: string,
  input: unknown,
): Promise<ActionResult<{ id: string }>> {
  const parsed = budgetSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: firstError(parsed.error) };

  const userId = await requireUserId();
  try {
    const existing = await prisma.budget.findFirst({
      where: { id, userId },
      select: { id: true },
    });
    if (!existing) return { success: false, error: "Budget not found." };

    await prisma.budget.update({
      where: { id },
      data: {
        name: parsed.data.name,
        amount: parsed.data.amount,
        period: parsed.data.period,
        categoryId: parsed.data.categoryId ?? null,
      },
    });
    return { success: true, data: { id } };
  } catch (error) {
    console.error("Update budget failed:", error);
    return { success: false, error: "Could not update the budget. Please try again." };
  }
}

export async function deleteBudgetAction(id: string): Promise<ActionResult> {
  const userId = await requireUserId();
  try {
    const existing = await prisma.budget.findFirst({
      where: { id, userId },
      select: { id: true },
    });
    if (!existing) return { success: false, error: "Budget not found." };

    await prisma.budget.delete({ where: { id } });
    return { success: true, data: undefined };
  } catch (error) {
    console.error("Delete budget failed:", error);
    return { success: false, error: "Could not delete the budget. Please try again." };
  }
}
