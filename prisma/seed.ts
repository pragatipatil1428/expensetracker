import "dotenv/config";

import { addDays, addMonths, format } from "date-fns";
import { hash } from "bcryptjs";
import { PrismaClient } from "../src/generated/prisma/client";
import type { PaymentMethod } from "../src/generated/prisma/enums";
import { PrismaPg } from "@prisma/adapter-pg";

const prisma = new PrismaClient({ adapter: new PrismaPg(process.env.DATABASE_URL!) });

// Deterministic PRNG so re-seeds produce identical data.
function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const DEFAULT_EXPENSE_CATEGORIES = [
  { name: "Food", icon: "utensils", color: "#f97316" },
  { name: "Shopping", icon: "shopping-bag", color: "#ec4899" },
  { name: "Transportation", icon: "car", color: "#06b6d4" },
  { name: "Entertainment", icon: "clapperboard", color: "#8b5cf6" },
  { name: "Bills", icon: "receipt", color: "#f59e0b" },
  { name: "Health", icon: "heart-pulse", color: "#ef4444" },
  { name: "Education", icon: "graduation-cap", color: "#3b82f6" },
  { name: "Travel", icon: "plane", color: "#0ea5e9" },
  { name: "Rent", icon: "home", color: "#64748b" },
  { name: "Subscriptions", icon: "repeat", color: "#a855f7" },
  { name: "Other", icon: "tag", color: "#6b7280" },
];

const DEFAULT_INCOME_CATEGORIES = [
  { name: "Salary", icon: "briefcase", color: "#10b981" },
  { name: "Freelance", icon: "laptop", color: "#6366f1" },
  { name: "Business", icon: "store", color: "#14b8a6" },
  { name: "Investment", icon: "trending-up", color: "#22c55e" },
  { name: "Bonus", icon: "gift", color: "#d946ef" },
  { name: "Other", icon: "tag", color: "#6b7280" },
];

async function ensureDefaultCategories(userId: string) {
  const data = [
    ...DEFAULT_EXPENSE_CATEGORIES.map((c) => ({ ...c, type: "EXPENSE" as const })),
    ...DEFAULT_INCOME_CATEGORIES.map((c) => ({ ...c, type: "INCOME" as const })),
  ];
  await prisma.category.createMany({
    data: data.map((c) => ({ userId, name: c.name, type: c.type, icon: c.icon, color: c.color, isDefault: true })),
    skipDuplicates: true,
  });
}

function computeNextRun(start: Date, frequency: "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY"): Date {
  let next = new Date(start);
  while (next <= new Date()) {
    if (frequency === "DAILY") next = addDays(next, 1);
    else if (frequency === "WEEKLY") next = addDays(next, 7);
    else if (frequency === "MONTHLY") next = addMonths(next, 1);
    else next = addMonths(next, 12);
  }
  return next;
}

interface TxnInput {
  userId: string;
  type: "INCOME" | "EXPENSE";
  amount: number;
  description: string;
  categoryId: string;
  date: Date;
  paymentMethod?: string;
  account?: string | null;
  notes?: string | null;
  isRecurring?: boolean;
  tags?: string[];
}

async function seedUser(
  opts: {
    name: string;
    email: string;
    password: string;
    months: number;
    seed: number;
    heavy?: boolean;
  },
) {
  const { name, email, password, months, seed, heavy } = opts;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    await prisma.user.delete({ where: { id: existing.id } });
  }

  const passwordHash = await hash(password, 10);
  const user = await prisma.user.create({ data: { name, email, passwordHash } });
  await ensureDefaultCategories(user.id);

  const categories = await prisma.category.findMany({ where: { userId: user.id } });
  const byName = new Map(categories.map((c) => [c.name, c]));

  const rng = mulberry32(seed);
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() - (months - 1), 1);
  const txns: TxnInput[] = [];

  // Build transactions month by month.
  for (let i = 0; i < months; i++) {
    const monthDate = new Date(start.getFullYear(), start.getMonth() + i, 1);
    const month = monthDate.getMonth();
    const year = monthDate.getFullYear();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const day = (d: number) => Math.min(d, daysInMonth);
    const isCurrent = i === months - 1;
    const localPush = (
      d: number,
      description: string,
      amount: number,
      categoryName: string,
      type: "INCOME" | "EXPENSE",
      extra: Partial<TxnInput> = {},
    ) => {
      txns.push({
        userId: user.id,
        type,
        amount: Math.round(amount * 100) / 100,
        description,
        categoryId: byName.get(categoryName)?.id ?? "",
        date: new Date(year, month, day(d)),
        paymentMethod: extra.paymentMethod ?? "UPI",
        account: extra.account ?? null,
        notes: extra.notes ?? null,
        isRecurring: extra.isRecurring ?? false,
        tags: extra.tags,
      });
    };

    // ── Income ──
    localPush(1, "Monthly salary", 85000, "Salary", "INCOME", {
      paymentMethod: "BANK_TRANSFER",
      account: "HDFC Savings",
      isRecurring: true,
    });
    if (i === 4) {
      localPush(10, "Diwali bonus", 20000, "Bonus", "INCOME", {
        paymentMethod: "BANK_TRANSFER",
        account: "HDFC Savings",
      });
    }
    if (isCurrent && now.getDate() >= 14) {
      localPush(14, "Performance bonus", 15000, "Bonus", "INCOME", {
        paymentMethod: "BANK_TRANSFER",
        account: "HDFC Savings",
      });
    }
    if (heavy && i % 3 === 1) {
      localPush(12 + Math.floor(rng() * 8), "Freelance design project", 6000 + Math.floor(rng() * 9000), "Freelance", "INCOME", {
        paymentMethod: "BANK_TRANSFER",
        account: "ICICI Savings",
        tags: ["freelance"],
      });
    }
    if (heavy && i % 4 === 2) {
      localPush(18, "Mutual fund dividends", 450 + Math.floor(rng() * 900), "Investment", "INCOME", {
        paymentMethod: "BANK_TRANSFER",
        account: "Zerodha",
        tags: ["investing"],
      });
    }

    // ── Fixed expenses ──
    localPush(3, "House rent", 18000, "Rent", "EXPENSE", {
      paymentMethod: "BANK_TRANSFER",
      account: "HDFC Savings",
      isRecurring: true,
    });
    localPush(5, "Electricity bill", 1200 + Math.floor(rng() * 1600), "Bills", "EXPENSE", {
      paymentMethod: "UPI",
      account: "PhonePe",
      isRecurring: true,
    });
    localPush(6, "Airtel broadband", 999, "Bills", "EXPENSE", {
      paymentMethod: "UPI",
      account: "PhonePe",
      isRecurring: true,
    });
    localPush(5, "Netflix subscription", 199, "Subscriptions", "EXPENSE", {
      paymentMethod: "CREDIT_CARD",
      account: "HDFC Credit Card",
      isRecurring: true,
    });
    localPush(5, "Spotify premium", 119, "Subscriptions", "EXPENSE", {
      paymentMethod: "CREDIT_CARD",
      account: "HDFC Credit Card",
      isRecurring: true,
    });
    if (heavy) {
      localPush(15, "Mobile recharge", 299 + Math.floor(rng() * 400), "Bills", "EXPENSE", {
        paymentMethod: "UPI",
        account: "Paytm",
        isRecurring: true,
      });
      localPush(8, "Gym membership", 1500, "Health", "EXPENSE", {
        paymentMethod: "DEBIT_CARD",
        account: "SBI Debit Card",
        isRecurring: true,
      });
    }

    // ── Variable expenses ──
    const groceries = heavy ? 5 + Math.floor(rng() * 4) : 3 + Math.floor(rng() * 2);
    const groceryNames = [
      "Groceries at BigBasket",
      "Groceries at Blinkit",
      "Zepto order",
      "DMart groceries",
      "Vegetables & fruits",
    ];
    for (let g = 0; g < groceries; g++) {
      localPush(2 + Math.floor(rng() * 26), groceryNames[Math.floor(rng() * groceryNames.length)], 250 + Math.floor(rng() * 1400), "Food", "EXPENSE", {
        paymentMethod: "UPI",
        account: "PhonePe",
        tags: ["groceries"],
      });
    }
    const dining = heavy ? 3 + Math.floor(rng() * 3) : 2;
    const diningNames = ["Dinner at local restaurant", "Swiggy order", "Zomato order", "Chai & snacks", "Birthday dinner out"];
    for (let d = 0; d < dining; d++) {
      localPush(2 + Math.floor(rng() * 26), diningNames[Math.floor(rng() * diningNames.length)], 180 + Math.floor(rng() * 800), "Food", "EXPENSE", {
        paymentMethod: "UPI",
        account: "Google Pay",
        tags: ["dining"],
      });
    }
    localPush(4, "Fuel refill", 1000 + Math.floor(rng() * 1500), "Transportation", "EXPENSE", {
      paymentMethod: "DEBIT_CARD",
      account: "SBI Debit Card",
      tags: ["fuel"],
    });
    const transport = heavy ? 2 + Math.floor(rng() * 3) : 1 + Math.floor(rng() * 2);
    for (let t = 0; t < transport; t++) {
      localPush(2 + Math.floor(rng() * 26), "Auto / Metro commute", 60 + Math.floor(rng() * 220), "Transportation", "EXPENSE", {
        paymentMethod: "UPI",
        account: "Paytm",
        tags: ["commute"],
      });
    }
    const shopping = heavy ? 1 + Math.floor(rng() * 3) : Math.floor(rng() * 2);
    const shoppingNames = ["New t-shirt", "Sneakers", "Home decor", "Amazon order", "Myntra order"];
    for (let s = 0; s < shopping; s++) {
      localPush(2 + Math.floor(rng() * 26), shoppingNames[Math.floor(rng() * shoppingNames.length)], 450 + Math.floor(rng() * 3500), "Shopping", "EXPENSE", {
        paymentMethod: "CREDIT_CARD",
        account: "HDFC Credit Card",
        tags: ["shopping"],
      });
    }
    const fun = heavy ? 1 + Math.floor(rng() * 2) : 1;
    const funNames = ["Movie tickets", "Concert tickets", "Books", "Weekend bowling"];
    for (let f = 0; f < fun; f++) {
      localPush(2 + Math.floor(rng() * 26), funNames[Math.floor(rng() * funNames.length)], 200 + Math.floor(rng() * 900), "Entertainment", "EXPENSE", {
        paymentMethod: "UPI",
        account: "Google Pay",
        tags: ["fun"],
      });
    }
    if (heavy && rng() > 0.5) {
      localPush(5 + Math.floor(rng() * 20), "Pharmacy & medicines", 300 + Math.floor(rng() * 1600), "Health", "EXPENSE", {
        paymentMethod: "UPI",
        account: "PhonePe",
        tags: ["health"],
      });
    }
    if (heavy && i % 3 === 2) {
      localPush(15, "Weekend trip to Lonavala", 4000 + Math.floor(rng() * 8000), "Travel", "EXPENSE", {
        paymentMethod: "CREDIT_CARD",
        account: "HDFC Credit Card",
        tags: ["travel"],
      });
    }
    if (heavy && i % 4 === 0) {
      localPush(20, "Online course subscription", 1200 + Math.floor(rng() * 1300), "Education", "EXPENSE", {
        paymentMethod: "CREDIT_CARD",
        account: "HDFC Credit Card",
        tags: ["learning"],
      });
    }
  }

  // Persist transactions in batches with tag creation.
  for (let i = 0; i < txns.length; i += 100) {
    const batch = txns.slice(i, i + 100);
    await prisma.transaction.createMany({
      data: batch.map((t) => ({
        userId: t.userId,
        type: t.type,
        amount: t.amount,
        description: t.description,
        categoryId: t.categoryId,
        date: t.date,
        paymentMethod: (t.paymentMethod ?? "UPI") as PaymentMethod,
        account: t.account,
        notes: t.notes,
        isRecurring: t.isRecurring ?? false,
      })),
    });
  }

  // Add tags to a sample of transactions.
  const tagged = txns.filter((t) => t.tags && t.tags.length > 0);
  for (const t of tagged.slice(0, 24)) {
    const stored = await prisma.transaction.findFirst({
      where: { userId: t.userId, description: t.description, date: t.date },
      select: { id: true },
    });
    if (stored) {
      await prisma.transaction.update({
        where: { id: stored.id },
        data: {
          tags: {
            connectOrCreate: t.tags!.map((name) => ({
              where: { userId_name: { userId: t.userId, name } },
              create: { userId: t.userId, name },
            })),
          },
        },
      });
    }
  }

  // ── Budgets (current + previous 2 months) ──
  const userId = user.id;
  await prisma.budget.deleteMany({ where: { userId } });
  for (let i = 0; i < 3; i++) {
    const budgetDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
    await prisma.budget.createMany({
      data: [
        { userId, name: "Overall monthly budget", amount: 52000, period: "MONTHLY", categoryId: null, startMonth: budgetDate.getMonth(), startYear: budgetDate.getFullYear() },
        { userId, name: "Food budget", amount: 12000, period: "MONTHLY", categoryId: byName.get("Food")?.id, startMonth: budgetDate.getMonth(), startYear: budgetDate.getFullYear() },
        { userId, name: "Shopping budget", amount: 6000, period: "MONTHLY", categoryId: byName.get("Shopping")?.id, startMonth: budgetDate.getMonth(), startYear: budgetDate.getFullYear() },
        { userId, name: "Transport budget", amount: 4000, period: "MONTHLY", categoryId: byName.get("Transportation")?.id, startMonth: budgetDate.getMonth(), startYear: budgetDate.getFullYear() },
        { userId, name: "Entertainment budget", amount: 3000, period: "MONTHLY", categoryId: byName.get("Entertainment")?.id, startMonth: budgetDate.getMonth(), startYear: budgetDate.getFullYear() },
      ],
    });
  }

  // ── Recurring transactions ──
  await prisma.recurringTransaction.deleteMany({ where: { userId: user.id } });
  const recurringItems = [
    { name: "Monthly salary", type: "INCOME" as const, amount: 85000, categoryName: "Salary", frequency: "MONTHLY" as const, account: "HDFC Savings", method: "BANK_TRANSFER", start: new Date(now.getFullYear(), now.getMonth(), 1) },
    { name: "House rent", type: "EXPENSE" as const, amount: 18000, categoryName: "Rent", frequency: "MONTHLY" as const, account: "HDFC Savings", method: "BANK_TRANSFER", start: new Date(now.getFullYear(), now.getMonth(), 3) },
    { name: "Netflix subscription", type: "EXPENSE" as const, amount: 199, categoryName: "Subscriptions", frequency: "MONTHLY" as const, account: "HDFC Credit Card", method: "CREDIT_CARD", start: new Date(now.getFullYear(), now.getMonth(), 5) },
    { name: "Spotify premium", type: "EXPENSE" as const, amount: 119, categoryName: "Subscriptions", frequency: "MONTHLY" as const, account: "HDFC Credit Card", method: "CREDIT_CARD", start: new Date(now.getFullYear(), now.getMonth(), 5) },
    { name: "Airtel broadband", type: "EXPENSE" as const, amount: 999, categoryName: "Bills", frequency: "MONTHLY" as const, account: "PhonePe", method: "UPI", start: new Date(now.getFullYear(), now.getMonth(), 6) },
    { name: "Electricity bill", type: "EXPENSE" as const, amount: 1800, categoryName: "Bills", frequency: "MONTHLY" as const, account: "PhonePe", method: "UPI", start: new Date(now.getFullYear(), now.getMonth(), 8) },
    { name: "Gym membership", type: "EXPENSE" as const, amount: 1500, categoryName: "Health", frequency: "MONTHLY" as const, account: "SBI Debit Card", method: "DEBIT_CARD", start: new Date(now.getFullYear(), now.getMonth(), 8) },
    { name: "Car insurance", type: "EXPENSE" as const, amount: 9500, categoryName: "Transportation", frequency: "YEARLY" as const, account: "SBI Debit Card", method: "DEBIT_CARD", start: new Date(now.getFullYear(), now.getMonth(), 22) },
  ];
  for (const item of recurringItems) {
    await prisma.recurringTransaction.create({
      data: {
        userId,
        name: item.name,
        type: item.type,
        amount: item.amount,
        categoryId: byName.get(item.categoryName)?.id ?? "",
        frequency: item.frequency,
        startDate: item.start,
        paymentMethod: item.method as PaymentMethod,
        account: item.account,
        nextRunDate: computeNextRun(item.start, item.frequency),
        isActive: true,
      },
    });
  }

  // ── Notifications ──
  await prisma.notification.deleteMany({ where: { userId: user.id } });
  const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const currentMonthTxns = txns.filter(
    (t) =>
      t.date.getMonth() === now.getMonth() && t.date.getFullYear() === now.getFullYear(),
  );
  const income = currentMonthTxns
    .filter((t) => t.type === "INCOME")
    .reduce((sum, t) => sum + t.amount, 0);
  const expenses = currentMonthTxns
    .filter((t) => t.type === "EXPENSE")
    .reduce((sum, t) => sum + t.amount, 0);
  const savings = income - expenses;
  const rate = income > 0 ? ((savings / income) * 100).toFixed(1) : "0.0";
  const money = (v: number) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(v);
  await prisma.notification.createMany({
    data: [
      {
        userId,
        type: "MONTHLY_SUMMARY",
        key: `monthly-summary:${monthKey}`,
        title: `Monthly summary · ${format(now, "MMMM yyyy")}`,
        message: `Income ${money(income)} · Expenses ${money(expenses)} · Savings ${money(savings)} (${rate}%)`,
        read: false,
      },
      {
        userId,
        type: "RECURRING_UPCOMING",
        key: `welcome:${user.id}`,
        title: "Welcome to FinTrack 👋",
        message:
          "Your finances are set up with 12 months of history. Explore your dashboard, budgets and analytics.",
        read: false,
      },
    ],
  });

  const txCount = await prisma.transaction.count({ where: { userId } });
  console.log(
    `✓ Seeded ${name} (${email}) — ${txCount} transactions, ${months} months, ${recurringItems.length} recurring schedules.`,
  );
}

async function main() {
  console.log("🌱 Seeding FinTrack database…");

  await seedUser({
    name: "Priya Sharma",
    email: "demo@fintrack.app",
    password: "Demo@1234",
    months: 12,
    seed: 42,
    heavy: true,
  });

  await seedUser({
    name: "Aarav Patel",
    email: "test@fintrack.app",
    password: "Test@1234",
    months: 6,
    seed: 7,
    heavy: false,
  });

  console.log("✅ Seed complete.");
  console.log("\nDemo account:  demo@fintrack.app  /  Demo@1234");
  console.log("Test account:  test@fintrack.app  /  Test@1234");
}

main()
  .catch((error) => {
    console.error("❌ Seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
