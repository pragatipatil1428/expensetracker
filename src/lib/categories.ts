import "server-only";

import { prisma } from "@/lib/prisma";
import { DEFAULT_EXPENSE_CATEGORIES, DEFAULT_INCOME_CATEGORIES } from "@/lib/constants";
import type { TransactionType } from "@/lib/types";

export async function ensureDefaultCategories(userId: string): Promise<void> {
  const data = [
    ...DEFAULT_EXPENSE_CATEGORIES.map((c) => ({ ...c, type: "EXPENSE" as TransactionType })),
    ...DEFAULT_INCOME_CATEGORIES.map((c) => ({ ...c, type: "INCOME" as TransactionType })),
  ];

  await prisma.category.createMany({
    data: data.map((c) => ({
      userId,
      name: c.name,
      type: c.type,
      icon: c.icon,
      color: c.color,
      isDefault: true,
    })),
    skipDuplicates: true,
  });
}
