# FinTrack — Personal Finance & Expense Tracker

A production-ready personal finance web application. Track income and expenses, set
budgets, manage recurring bills, and understand your spending with a modern, premium
dashboard — built with Next.js 16, React 19, TypeScript, Prisma 7 and PostgreSQL.

![Next.js](https://img.shields.io/badge/Next.js-16-black) ![React](https://img.shields.io/badge/React-19-61dafb) ![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6) ![Prisma](https://img.shields.io/badge/Prisma-7-2d3748) ![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791)

---

## Features

### Core
- **Dashboard** — balance, income, expenses, savings & savings rate with period-over-period
  trend comparisons; income-vs-expense chart, category donut, savings trend and budget
  utilization; 7D / 30D / 3M / 6M / 1Y periods.
- **Transactions** — full CRUD with search (description, category, tags), filters
  (type, category, payment method, date range, amount range), sorting and pagination.
  Rich detail view, CSV export.
- **Categories** — custom categories with icons and colours, default sets for income and
  expense, usage-aware deletion (reassign or block).
- **Budgets** — monthly and yearly budgets, per-category or overall; progress bars,
  "approaching" warning at 80%, "exceeded" alert at 100%, budget-vs-actual chart.
- **Recurring transactions** — salary, rent, subscriptions, EMIs with daily/weekly/monthly/
  yearly frequencies; upcoming list, pause/resume, one-click "record" that creates the
  transaction and advances the schedule.
- **Analytics** — monthly income/expense breakdown, category distribution, income sources,
  daily spending trend, top categories, with preset and custom date ranges.
- **Reports** — monthly, yearly, category, income and expense reports with summaries,
  largest transactions and **CSV + PDF export** (client-side generation).
- **Notifications** — budget alerts, upcoming payment reminders and a monthly financial
  summary, with read/unread management.
- **Global search** — ⌘K / Ctrl+K command palette across transactions, categories,
  budgets and recurring schedules.

### Platform
- Complete **authentication** (Auth.js v5): register, login, logout, forgot/reset password,
  profile editing, change password, account deletion. Bcrypt-hashed passwords, JWT
  sessions, protected routes via Next.js `proxy`.
- **Dark / light / system** themes, INR / USD / EUR / GBP currency support.
- Fully **responsive**: desktop sidebar, mobile bottom navigation, touch-friendly controls.
- **Accessibility**: semantic HTML, labels, focus states, keyboard navigation, ARIA
  dialogs, reduced-motion support.
- **Loading, empty, error** states everywhere, skeleton loaders, toast feedback and
  confirmation dialogs.
- Strict ownership checks: every server action validates the session and scopes all
  queries to the authenticated user.

## Tech stack

| Layer      | Technology |
| ---------- | ---------- |
| Framework  | Next.js 16 (App Router, Turbopack) |
| UI         | React 19, TypeScript, Tailwind CSS v4, Framer Motion |
| Forms      | React Hook Form + Zod |
| Data       | TanStack Query, Zustand |
| Charts     | Recharts 3 |
| Backend    | Next.js Server Actions |
| Database   | PostgreSQL 16, Prisma 7 (driver adapters) |
| Auth       | Auth.js / NextAuth v5 (JWT, credentials) |
| Export     | Client-side CSV, jsPDF + autotable |

## Screenshots

> Add screenshots of the dashboard, analytics and reports here once deployed.

## Architecture

```
src/
  app/
    (auth)/            # login, register, forgot/reset password
    (dashboard)/       # dashboard, transactions, budgets, categories,
                       # recurring, analytics, reports, settings, profile
    api/auth/          # Auth.js route handlers
  actions/             # server actions (auth, transactions, categories, budgets, …)
  components/
    ui/                # design-system primitives (button, dialog, select, …)
    layout/            # sidebar, header, mobile nav, command palette, notifications
    dashboard/         # dashboard widgets and charts
    transactions/      # transaction explorer, forms, details
    budgets/ categories/ recurring/ analytics/ reports/
  lib/                 # prisma, auth, queries, analytics, notifications, formatting
  schemas/             # Zod validation schemas
  stores/              # Zustand global UI state
  generated/prisma/    # generated Prisma client (git-ignored)
prisma/
  schema.prisma        # data model
  seed.ts              # demo data
```

**Data flow** — pages are Server Components for the shell; interactive pages fetch data
through server actions surfaced by TanStack Query. Mutations run through Zod-validated
server actions that verify the session and user ownership, then invalidate the relevant
query caches and refresh server components. Money is stored as `Decimal` and serialised
to numbers at the boundary.

## Database design

- `User`, `Account`, `Session`, `PasswordResetToken`
- `Category`, `Transaction`, `Tag` (many-to-many), `Budget`, `RecurringTransaction`,
  `Notification`
- `Decimal(12,2)` for all money fields (never floats)
- Indexes on frequently filtered columns: `(userId, date)`, `(userId, type)`,
  `(userId, read)`, `(userId, isActive)`, unique constraints for email and
  per-user category names.

## Getting started

### Prerequisites

- Node.js 20+ and npm
- Docker (for PostgreSQL) or a hosted PostgreSQL instance

### 1. Configure the environment

```bash
cp .env.example .env
# Generate a secret:
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

Set `DATABASE_URL`, `AUTH_SECRET` and `AUTH_URL` in `.env`.

### 2. Start the database

```bash
docker compose up -d          # PostgreSQL on localhost:5434
```

### 3. Install, generate and seed

```bash
npm install
npx prisma generate
npx prisma db push
npx prisma db seed
```

Or run the one-liner: `npm run db:setup`.

### 4. Run the app

```bash
npm run dev                   # http://localhost:3000
```

### Production build

```bash
npm run build
npm start
```

## Demo account

| Role  | Email            | Password   | Data |
| ----- | ---------------- | ---------- | ---- |
| Demo  | demo@fintrack.app | Demo@1234  | 12 months of realistic Indian finances |
| Test  | test@fintrack.app | Test@1234  | 6 months of lighter data |

## Environment variables

| Variable        | Required | Description |
| --------------- | -------- | ----------- |
| `DATABASE_URL`  | ✅       | PostgreSQL connection string |
| `AUTH_SECRET`   | ✅       | Auth.js signing secret |
| `AUTH_URL`      | ✅       | App base URL (used for callbacks and reset links) |
| `RESEND_API_KEY`| ⭕       | Optional — enables password-reset emails. Without it, reset links are shown in the UI (development mode) |

## Deployment

- Build with `next build` and deploy to any Node.js host (Vercel, Railway, Render,
  a VPS, etc.).
- Provision a managed PostgreSQL instance and point `DATABASE_URL` at it.
- Run `prisma db push` (or migrations) against the production database, set
  `AUTH_SECRET` and `AUTH_URL`, and configure `RESEND_API_KEY` for transactional email.

## Future improvements

- OAuth providers (Google / GitHub) via the existing Account/Session models
- Automatic processing of due recurring transactions (cron / queue)
- Transaction attachments and receipt scanning
- Multi-currency accounts with live exchange rates
- Savings-goal tracking and net-worth timeline
- Unit & integration tests (Vitest + Playwright) around the pure analytics and
  validation modules

---

Built as a full-stack portfolio project: Next.js · React · TypeScript · Prisma ·
PostgreSQL · Auth.js · Server Actions · Recharts — demonstrating production-grade
architecture, security, validation and UI craft.
