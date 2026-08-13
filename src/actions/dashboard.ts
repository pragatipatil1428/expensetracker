"use server";

import { getCurrentUserId } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import {
  getAnalyticsData,
  getDashboardOverview,
  getFinancialSummary,
  getReportData,
  queryTransactions,
  type ReportType,
  type TransactionQueryParams,
} from "@/lib/queries";
import { syncNotifications } from "@/lib/notifications";
import { toUserDTO } from "@/lib/serialize";
import type { ChartPeriod } from "@/lib/constants";
import type { ActionResult } from "@/lib/types";

export interface DashboardData {
  overview: Awaited<ReturnType<typeof getDashboardOverview>>;
  financialSummary: Awaited<ReturnType<typeof getFinancialSummary>>;
  currency: string;
  userName: string;
}

export async function getDashboardDataAction(
  period: ChartPeriod = "30d",
): Promise<ActionResult<DashboardData>> {
  const userId = await getCurrentUserId();
  if (!userId) return { success: false, error: "Not authenticated." };

  await syncNotifications(userId);

  const [user, overview, financialSummary] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, select: { currency: true, name: true } }),
    getDashboardOverview(userId, period),
    getFinancialSummary(userId),
  ]);

  return {
    success: true,
    data: {
      overview,
      financialSummary,
      currency: user?.currency ?? "INR",
      userName: user?.name ?? "there",
    },
  };
}

export async function getFinancialSummaryAction(): Promise<
  ActionResult<Awaited<ReturnType<typeof getFinancialSummary>>>
> {
  const userId = await getCurrentUserId();
  if (!userId) return { success: false, error: "Not authenticated." };
  const summary = await getFinancialSummary(userId);
  return { success: true, data: summary };
}

export async function getAnalyticsDataAction(
  from: string,
  to: string,
): Promise<ActionResult<Awaited<ReturnType<typeof getAnalyticsData>>>> {
  const userId = await getCurrentUserId();
  if (!userId) return { success: false, error: "Not authenticated." };
  const data = await getAnalyticsData(userId, new Date(from), new Date(to));
  return { success: true, data };
}

export async function getReportDataAction(
  type: ReportType,
  from: string,
  to: string,
): Promise<ActionResult<Awaited<ReturnType<typeof getReportData>>>> {
  const userId = await getCurrentUserId();
  if (!userId) return { success: false, error: "Not authenticated." };
  const data = await getReportData(userId, type, new Date(from), new Date(to));
  return { success: true, data };
}

export async function getTransactionsAction(
  params: TransactionQueryParams = {},
): Promise<ActionResult<Awaited<ReturnType<typeof queryTransactions>>>> {
  const userId = await getCurrentUserId();
  if (!userId) return { success: false, error: "Not authenticated." };
  const data = await queryTransactions(userId, params);
  return { success: true, data };
}

export async function getMeAction(): Promise<ActionResult<ReturnType<typeof toUserDTO>>> {
  const userId = await getCurrentUserId();
  if (!userId) return { success: false, error: "Not authenticated." };
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return { success: false, error: "Account not found." };
  return { success: true, data: toUserDTO(user) };
}
