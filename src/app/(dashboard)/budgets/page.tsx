import type { Metadata } from "next";

import { BudgetsManager } from "@/components/budgets/budgets-manager";

export const metadata: Metadata = {
  title: "Budgets",
  description: "Set and track monthly and category budgets.",
};

export default function BudgetsPage() {
  return <BudgetsManager />;
}
