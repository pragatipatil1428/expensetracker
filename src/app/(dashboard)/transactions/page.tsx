import type { Metadata } from "next";

import { TransactionExplorer } from "@/components/transactions/transaction-explorer";

export const metadata: Metadata = {
  title: "Transactions",
  description: "Search, filter and manage all your transactions.",
};

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: Promise<{ detail?: string }>;
}) {
  const { detail } = await searchParams;
  return <TransactionExplorer initialDetailId={detail} />;
}
