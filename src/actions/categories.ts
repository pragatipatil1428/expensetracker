"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUserId, requireUserId } from "@/lib/auth-helpers";
import { toCategoryDTO } from "@/lib/serialize";
import { categorySchema } from "@/schemas/transaction";
import type { ActionResult, CategoryDTO, TransactionType } from "@/lib/types";

export interface CategoryUsage {
  id: string;
  transactionCount: number;
  recurringCount: number;
}

export async function getCategoryStatsAction(): Promise<ActionResult<CategoryUsage[]>> {
  const userId = await getCurrentUserId();
  if (!userId) return { success: false, error: "Not authenticated." };
  const stats = await prisma.category.findMany({
    where: { userId },
    select: {
      id: true,
      _count: { select: { transactions: true, recurring: true } },
    },
  });
  return {
    success: true,
    data: stats.map((s) => ({
      id: s.id,
      transactionCount: s._count.transactions,
      recurringCount: s._count.recurring,
    })),
  };
}

export async function getCategoriesAction(
  type?: TransactionType,
): Promise<ActionResult<CategoryDTO[]>> {
  const userId = await getCurrentUserId();
  if (!userId) return { success: false, error: "Not authenticated." };
  const categories = await prisma.category.findMany({
    where: { userId, ...(type ? { type } : {}) },
    orderBy: [{ type: "asc" }, { name: "asc" }],
  });
  return { success: true, data: categories.map(toCategoryDTO) };
}

function firstError(error: { issues: { message: string }[] }): string {
  return error.issues[0]?.message ?? "Invalid input.";
}

export async function createCategoryAction(input: unknown): Promise<ActionResult<{ id: string }>> {
  const parsed = categorySchema.safeParse(input);
  if (!parsed.success) return { success: false, error: firstError(parsed.error) };

  const userId = await requireUserId();
  try {
    const duplicate = await prisma.category.findFirst({
      where: { userId, name: parsed.data.name, type: parsed.data.type },
      select: { id: true },
    });
    if (duplicate) {
      return {
        success: false,
        error: `You already have a "${parsed.data.name}" ${parsed.data.type.toLowerCase()} category.`,
      };
    }

    const category = await prisma.category.create({
      data: {
        userId,
        name: parsed.data.name,
        type: parsed.data.type,
        icon: parsed.data.icon,
        color: parsed.data.color,
      },
      select: { id: true },
    });
    return { success: true, data: { id: category.id } };
  } catch (error) {
    console.error("Create category failed:", error);
    return { success: false, error: "Could not create the category. Please try again." };
  }
}

export async function updateCategoryAction(
  id: string,
  input: unknown,
): Promise<ActionResult<{ id: string }>> {
  const parsed = categorySchema.safeParse(input);
  if (!parsed.success) return { success: false, error: firstError(parsed.error) };

  const userId = await requireUserId();
  try {
    const existing = await prisma.category.findFirst({
      where: { id, userId },
      select: { id: true },
    });
    if (!existing) return { success: false, error: "Category not found." };

    const duplicate = await prisma.category.findFirst({
      where: { userId, name: parsed.data.name, type: parsed.data.type, NOT: { id } },
      select: { id: true },
    });
    if (duplicate) {
      return {
        success: false,
        error: `You already have a "${parsed.data.name}" ${parsed.data.type.toLowerCase()} category.`,
      };
    }

    await prisma.category.update({
      where: { id },
      data: {
        name: parsed.data.name,
        type: parsed.data.type,
        icon: parsed.data.icon,
        color: parsed.data.color,
      },
    });
    return { success: true, data: { id } };
  } catch (error) {
    console.error("Update category failed:", error);
    return { success: false, error: "Could not update the category. Please try again." };
  }
}

export async function deleteCategoryAction(
  id: string,
  reassignTo?: string,
): Promise<ActionResult> {
  const userId = await requireUserId();
  try {
    const category = await prisma.category.findFirst({
      where: { id, userId },
      select: { id: true, type: true },
    });
    if (!category) return { success: false, error: "Category not found." };

    const [transactionCount, recurringCount] = await Promise.all([
      prisma.transaction.count({ where: { categoryId: id } }),
      prisma.recurringTransaction.count({ where: { categoryId: id } }),
    ]);
    const usage = transactionCount + recurringCount;

    if (usage > 0) {
      if (!reassignTo) {
        return {
          success: false,
          error:
            usage === transactionCount
              ? `This category is used by ${usage} transaction${usage === 1 ? "" : "s"}. Move them to another category before deleting, or delete them first.`
              : `This category is used by ${usage} item${usage === 1 ? "" : "s"} (transactions and recurring). Reassign or remove them first.`,
        };
      }

      const target = await prisma.category.findFirst({
        where: { id: reassignTo, userId, type: category.type },
        select: { id: true },
      });
      if (!target) {
        return { success: false, error: "Choose a valid destination category." };
      }

      await prisma.$transaction([
        prisma.transaction.updateMany({
          where: { categoryId: id },
          data: { categoryId: reassignTo },
        }),
        prisma.recurringTransaction.updateMany({
          where: { categoryId: id },
          data: { categoryId: reassignTo },
        }),
      ]);
    }

    await prisma.category.delete({ where: { id } });
    return { success: true, data: undefined };
  } catch (error) {
    console.error("Delete category failed:", error);
    return { success: false, error: "Could not delete the category. Please try again." };
  }
}
