import 'dotenv/config';
import mongoose from 'mongoose';
import { User } from './models/User.js';
import { Transaction } from './models/Transaction.js';

const MONGODB_URI =
  process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/spendly';

const DEMO_USER = {
  name: 'Aarav Sharma',
  email: 'demo@spendly.app',
  password: 'demo1234',
};

// Deterministic PRNG so the demo data is reproducible between runs.
function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Date on the given day, `monthOffset` months ago (0 = current month).
function at(monthOffset, day, hour = 12) {
  const now = new Date();
  const year =
    now.getMonth() - monthOffset < 0
      ? now.getFullYear() - 1
      : now.getFullYear();
  const month = (now.getMonth() - monthOffset + 12) % 12;
  return new Date(year, month, day, hour, 0, 0);
}

function generateTransactions(rand) {
  const tx = [];
  const round = (n) => Math.round(n * 100) / 100;

  const push = (monthOffset, day, description, amount, category, type, paymentMethod, notes = '') => {
    const date = at(monthOffset, day);
    if (date <= new Date()) {
      tx.push({
        description,
        amount: round(amount),
        category,
        type,
        paymentMethod,
        date,
        notes,
      });
    }
  };

  for (let m = 5; m >= 0; m--) {
    // ── Income ─────────────────────────────────────────────
    push(m, 1, 'Monthly salary', 80000, 'Salary', 'income', 'Bank Transfer', 'Salary credit — TechNova Solutions');
    if (m === 0) push(m, 10, 'Freelance project', 15000, 'Freelance', 'income', 'Bank Transfer', 'Dashboard design for a client');
    if (m === 2) push(m, 10, 'Freelance project', 18000, 'Freelance', 'income', 'Bank Transfer', 'Website build — fixed quote');
    if (m === 4) push(m, 10, 'Freelance project', 12000, 'Freelance', 'income', 'Bank Transfer', 'Logo and brand kit');

    // ── Fixed monthly expenses ─────────────────────────────
    push(m, 2, 'Rent', 18000, 'Rent', 'expense', 'Bank Transfer', '1BHK, Whitefield');
    push(m, 5, 'Electricity bill', 2200 + rand() * 400, 'Bills', 'expense', 'UPI');
    push(m, 6, 'Internet — Airtel fiber', 999, 'Bills', 'expense', 'UPI', '100 Mbps plan');
    push(m, 8, 'Mobile recharge', 499, 'Bills', 'expense', 'UPI', 'Prepaid plan');
    push(m, 9, 'Netflix subscription', 649, 'Entertainment', 'expense', 'UPI');
    push(m, 11, 'Spotify premium', 119, 'Entertainment', 'expense', 'UPI');

    // ── Groceries & food ───────────────────────────────────
    push(m, 3, 'Weekly groceries', 1400 + rand() * 1200, 'Food', 'expense', 'UPI');
    push(m, 14, 'Weekly groceries', 1500 + rand() * 1300, 'Food', 'expense', 'UPI');
    push(m, 22, 'Weekly groceries', 1200 + rand() * 1000, 'Food', 'expense', 'UPI');

    const foodDays = [4, 7, 10, 13, 15, 18, 21, 24, 26, 28];
    const foodNames = [
      'Lunch with team',
      'Dinner out',
      'Coffee & snacks',
      'Swiggy order',
      'Street food',
      'Brunch',
      'Zomato order',
      'Evening snacks',
      'Lunch',
      'Dinner',
    ];
    foodDays.forEach((day, i) => {
      push(
        m,
        day,
        foodNames[i % foodNames.length],
        120 + rand() * 830,
        'Food',
        'expense',
        rand() > 0.5 ? 'UPI' : 'Cash'
      );
    });

    // ── Shopping ───────────────────────────────────────────
    push(m, 16, 'Clothing — Myntra', 2500 + rand() * 3000, 'Shopping', 'expense', 'Credit Card');
    push(m, 23, 'Household items — Amazon', 800 + rand() * 1500, 'Shopping', 'expense', 'UPI');

    // ── Travel ─────────────────────────────────────────────
    if (m === 1) push(m, 20, 'Train tickets — weekend trip', 3200, 'Travel', 'expense', 'Credit Card', 'Mysuru trip');
    if (m === 4) {
      push(m, 12, 'Flight — Goa', 8500, 'Travel', 'expense', 'Credit Card');
      push(m, 13, 'Hotel stay — Goa', 5000, 'Travel', 'expense', 'Credit Card');
    }

    // ── Health & education ─────────────────────────────────
    push(m, 18, 'Pharmacy — medicines', 750 + rand() * 300, 'Health', 'expense', 'UPI');
    if (m === 3) push(m, 17, 'Udemy course — UI design', 1499, 'Education', 'expense', 'UPI');

    // ── Occasional ─────────────────────────────────────────
    if (m === 0) push(m, 7, 'Gift for a friend', 1200, 'Other', 'expense', 'UPI');
    if (m === 5) push(m, 25, 'Home supplies', 1100, 'Other', 'expense', 'Cash');
  }

  return tx;
}

async function seed() {
  await mongoose.connect(MONGODB_URI);
  console.log(`Connected to MongoDB (${MONGODB_URI})`);

  // Reset any previous demo data so seeding is idempotent.
  const existing = await User.findOne({ email: DEMO_USER.email });
  if (existing) {
    await Transaction.deleteMany({ userId: existing._id });
    await User.findByIdAndDelete(existing._id);
    console.log('Removed previous demo data');
  }

  const user = await User.create(DEMO_USER);
  const rand = mulberry32(20260813);
  const transactions = generateTransactions(rand);

  if (transactions.length) {
    await Transaction.insertMany(
      transactions.map((t) => ({ ...t, userId: user._id }))
    );
  }

  const income = transactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);
  const expenses = transactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  console.log('\nSeed complete:');
  console.log(`  Demo user   : ${DEMO_USER.email} / ${DEMO_USER.password}`);
  console.log(`  Transactions: ${transactions.length}`);
  console.log(`  Income      : ₹${income.toLocaleString('en-IN')}`);
  console.log(`  Expenses    : ₹${expenses.toLocaleString('en-IN')}`);
  console.log(`  Balance     : ₹${(income - expenses).toLocaleString('en-IN')}`);

  await mongoose.disconnect();
  console.log('\nDone. Start the servers with `npm run dev:all`.');
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
