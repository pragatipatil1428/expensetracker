import {
  BarChart3,
  FileBarChart,
  LayoutDashboard,
  ListOrdered,
  PiggyBank,
  Repeat,
  Settings,
  Tags,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  segment: string;
}

export const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, segment: "dashboard" },
  { href: "/transactions", label: "Transactions", icon: ListOrdered, segment: "transactions" },
  { href: "/budgets", label: "Budgets", icon: PiggyBank, segment: "budgets" },
  { href: "/categories", label: "Categories", icon: Tags, segment: "categories" },
  { href: "/recurring", label: "Recurring", icon: Repeat, segment: "recurring" },
  { href: "/analytics", label: "Analytics", icon: BarChart3, segment: "analytics" },
  { href: "/reports", label: "Reports", icon: FileBarChart, segment: "reports" },
  { href: "/settings", label: "Settings", icon: Settings, segment: "settings" },
];
