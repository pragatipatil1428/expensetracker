import type { Metadata } from "next";

import { CategoriesManager } from "@/components/categories/categories-manager";

export const metadata: Metadata = {
  title: "Categories",
  description: "Create and manage your income and expense categories.",
};

export default function CategoriesPage() {
  return <CategoriesManager />;
}
