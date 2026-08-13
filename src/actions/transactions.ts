"use server";

import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth-helpers";
import { syncNotifications } from "@/lib/notifications";
import { transactionSchema } from "@/schemas/transaction";
import { toTransactionDTO } from "@/lib/serialize";
import type { ActionResult, TransactionDTO } from "@/lib/types";

/** "yyyy-MM-dd" → Date at local midnight. */
function parseLocalDate(value: string): Date {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, (month ?? 1) - 1, day ?? 1);
}

function firstError(error: { issues: { message: string }[] }): string {
  return error.issues[0]?.message ?? "Invalid input.";
}

async function verifyCategoryOwnership(userId: string, categoryId: string) {
  const category = await prisma.category.findFirst({
    where: { id: categoryId, userId },
    select: { id: true },
  });
  if (!category) {
    throw new Error("Invalid category.");
  }
}

function tagConnectOrCreate(userId: string, tags: string[]) {
  return tags.map((name) => ({
    where: { userId_name: { userId, name } },
    create: { userId, name },
  }));
}

export async function createTransactionAction(
  input: unknown,
): Promise<ActionResult<{ id: string }>> {
  const parsed = transactionSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: firstError(parsed.error) };

  const userId = await requireUserId();
  try {
    await verifyCategoryOwnership(userId, parsed.data.categoryId);

    const transaction = await prisma.transaction.create({
      data: {
        userId,
        type: parsed.data.type,
        amount: parsed.data.amount,
        description: parsed.data.description,
        categoryId: parsed.data.categoryId,
        date: parseLocalDate(parsed.data.date),
        paymentMethod: parsed.data.paymentMethod,
        account: parsed.data.account ?? null,
        notes: parsed.data.notes ?? null,
        tags: { connectOrCreate: tagConnectOrCreate(userId, parsed.data.tags) },
      },
      select: { id: true },
    });

    await syncNotifications(userId);
    return { success: true, data: { id: transaction.id } };
  } catch (error) {
    console.error("Create transaction failed:", error);
    return { success: false, error: "Could not create the transaction. Please try again." };
  }
}

export async function updateTransactionAction(
  id: string,
  input: unknown,
): Promise<ActionResult<{ id: string }>> {
  const parsed = transactionSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: firstError(parsed.error) };

  const userId = await requireUserId();
  try {
    const existing = await prisma.transaction.findFirst({
      where: { id, userId },
      select: { id: true },
    });
    if (!existing) return { success: false, error: "Transaction not found." };

    await verifyCategoryOwnership(userId, parsed.data.categoryId);

    await prisma.transaction.update({
      where: { id },
      data: {
        type: parsed.data.type,
        amount: parsed.data.amount,
        description: parsed.data.description,
        categoryId: parsed.data.categoryId,
        date: parseLocalDate(parsed.data.date),
        paymentMethod: parsed.data.paymentMethod,
        account: parsed.data.account ?? null,
        notes: parsed.data.notes ?? null,
        tags: { set: [], connectOrCreate: tagConnectOrCreate(userId, parsed.data.tags) },
      },
      select: { id: true },
    });

    await syncNotifications(userId);
    return { success: true, data: { id } };
  } catch (error) {
    console.error("Update transaction failed:", error);
    return { success: false, error: "Could not update the transaction. Please try again." };
  }
}

export async function deleteTransactionAction(id: string): Promise<ActionResult> {
  const userId = await requireUserId();
  try {
    const existing = await prisma.transaction.findFirst({
      where: { id, userId },
      select: { id: true },
    });
    if (!existing) return { success: false, error: "Transaction not found." };

    await prisma.transaction.delete({ where: { id } });
    await syncNotifications(userId);
    return { success: true, data: undefined };
  } catch (error) {
    console.error("Delete transaction failed:", error);
    return { success: false, error: "Could not delete the transaction. Please try again." };
  }
}

export async function getTransactionAction(id: string): Promise<ActionResult<TransactionDTO>> {
  const userId = await requireUserId();
  const transaction = await prisma.transaction.findFirst({
    where: { id, userId },
    include: { category: true, tags: true },
  });
  if (!transaction) return { success: false, error: "Transaction not found." };
  return { success: true, data: toTransactionDTO(transaction) };
}

