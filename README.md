# Spendly — Personal Expense Tracker

A simple, professional personal expense tracker built to manage daily income and expenses and
understand spending through clean, honest analytics. Designed as a portfolio project that
demonstrates a **deliberately simple JavaScript stack** — no frameworks beyond the essentials,
no TypeScript, no enterprise architecture.

![Stack](https://img.shields.io/badge/React-19-61dafb) ![Vite](https://img.shields.io/badge/Vite-6-646cff) ![Express](https://img.shields.io/badge/Express-4-000) ![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose-green)

---

## ✨ Features

- **Authentication** — register, login, JWT-based sessions with bcrypt password hashing
- **Dashboard** — total balance, income, expenses, this month's spend, greeting by time of day
- **Transactions** — full CRUD with search, filters (type, category, date range) and sorting
- **Analytics** — expense-by-category, income vs expenses, monthly trends with date-range filters
- **Monthly summary** — current month income, expenses, savings, top category, largest expense
- **Charts** — Chart.js doughnut, bar and line charts that update automatically
- **CSV export** — one-click export of the current filtered view
- **Settings** — update profile, change password, dark/light mode, logout, delete account
- **Dark mode** — persisted locally, system-aware default
- **Fully responsive** — mobile, tablet and desktop; tables collapse into cards on small screens
- **Polish** — toasts, loading skeletons, empty states, error states, confirmation dialogs

## 🖼️ Screenshots

> Add screenshots of the dashboard (light + dark), transactions and analytics pages here.

## 🧱 Technology Stack

**Frontend**

| Layer      | Choice                              |
| ---------- | ----------------------------------- |
| Framework  | React 19                            |
| Build tool | Vite 6                              |
| Language   | JavaScript (ESM)                    |
| Routing    | React Router 7                      |
| Charts     | Chart.js 4 + react-chartjs-2        |
| HTTP       | Axios                               |
| Styling    | Plain CSS with CSS custom properties |

**Backend**

| Layer      | Choice                       |
| ---------- | ---------------------------- |
| Runtime    | Node.js 20+                  |
| Framework  | Express 4                    |
| Database   | MongoDB (Mongoose 8)         |
| Auth       | JWT + bcryptjs               |
| Validation | Lightweight middleware       |

**Deliberately excluded:** TypeScript, Next.js, Prisma, Redux/Zustand, Dockerized app servers,
and any micro-service complexity.

## 🏗️ Architecture

```
├── index.html                 # Vite entry
├── vite.config.js             # Dev proxy: /api → :5000
├── src/                       # React frontend
│   ├── components/
│   │   ├── layout/            # AppLayout, Sidebar, Topbar
│   │   ├── ui/                # Button, Input, Select, Modal, Toast, …
│   │   ├── features/          # StatCard, ChartCard, TransactionTable, TransactionForm
│   │   └── charts/            # Doughnut, Bar, Line (theme-aware)
│   ├── context/               # Auth, Theme, Toast (React Context only)
│   ├── pages/                 # Login, Register, Dashboard, Transactions, Analytics, Settings
│   ├── services/              # Centralized Axios client + API modules
│   ├── hooks/                 # useFetch, useDocumentTitle
│   ├── routes/                # ProtectedRoute, GuestRoute
│   ├── utils/                 # format, csv, charts, constants
│   └── styles/                # Design system (CSS variables, dark mode)
└── server/                    # Express API
    ├── config/                # MongoDB connection
    ├── controllers/           # auth, transactions, analytics, users
    ├── models/                # User, Transaction (Mongoose)
    ├── middleware/            # JWT protect, validation, error handler
    ├── routes/                # REST route definitions
    ├── services/              # Analytics aggregations (Mongo pipelines)
    ├── utils/                 # AppError, catchAsync, token helpers
    ├── seed.js                # Realistic demo data
    └── server.js              # Entry point
```

**Key decisions**

- State management is plain **React Context + local state** — no Redux or Zustand.
- The frontend talks to one **centralized Axios client** that attaches the JWT, handles 401s
  (clears the session and redirects to login), and surfaces friendly error messages.
- All data routes are protected by a JWT middleware and every query is **scoped to the
  authenticated user** — a user can never read or modify another user's transactions.
- Analytics are computed server-side with **MongoDB aggregation pipelines** — no hardcoded numbers.

## 🚀 Installation

Prerequisites: **Node.js 20+** and a **MongoDB instance** — native install or MongoDB Atlas.
See [MongoDB Setup](#-mongodb-setup).

```bash
# 1. Clone & install dependencies
npm install
cd server && npm install && cd ..

# 2. Configure environment variables (see below)
cp .env.example .env                    # frontend (optional in dev)
cp server/.env.example server/.env      # backend (required)

# 3. Start MongoDB — pick one:
#    a) Native MongoDB: already listening on localhost:27017 → nothing to do
#    b) MongoDB Atlas: set MONGODB_URI to your srv:// string in server/.env

# 4. (Optional) load realistic demo data
npm run seed

# 5. Run everything
npm run dev:all
```

- Frontend → http://localhost:5173
- Backend API → http://localhost:5000

## 🔐 Environment Variables

**Backend** (`server/.env`)

| Variable        | Description                                            | Example                                      |
| --------------- | ------------------------------------------------------ | -------------------------------------------- |
| `PORT`          | API port                                               | `5000`                                       |
| `MONGODB_URI`   | MongoDB connection string                              | `mongodb://127.0.0.1:27017/spendly`          |
| `JWT_SECRET`    | Secret used to sign JWTs — use a long random string    | `openssl rand -hex 32`                       |
| `JWT_EXPIRES_IN`| Token lifetime                                         | `7d`                                         |
| `CLIENT_URL`    | Allowed CORS origin (the frontend)                     | `http://localhost:5173`                      |

**Frontend** (`.env`)

| Variable        | Description                                                              |
| --------------- | ------------------------------------------------------------------------ |
| `VITE_API_URL`  | Backend base URL. Leave empty in dev (Vite proxies `/api` → `:5000`).    |

> ⚠️ Never commit real secrets. `server/.env` and `.env` are gitignored.

## 🧪 Running Frontend / Backend

```bash
npm run dev          # frontend only (Vite, :5173)
npm run dev:server   # backend only (:5000)
npm run dev:all      # both together
npm run build        # production build of the frontend (dist/)
npm run seed         # reset + load demo data
```

## 🗄️ MongoDB Setup

The app just needs a MongoDB reachable at `MONGODB_URI`. Pick one option:

**Option A — Native MongoDB (recommended for local dev)**

1. Install MongoDB Community Server:
   - Windows: `winget install MongoDB.Server` (or download the MSI from mongodb.com)
   - macOS: `brew tap mongodb/brew && brew install mongodb-community`
2. Start it: on Windows the service starts automatically; on macOS run
   `brew services start mongodb-community`.
3. Done — the default `mongodb://127.0.0.1:27017/spendly` already works, no env changes needed.

**Option B — MongoDB Atlas (free cloud)**

1. Create a free cluster at https://www.mongodb.com/atlas.
2. Copy the `srv://` connection string into `server/.env` as `MONGODB_URI`.
3. Add your IP to the Atlas network access list (Project → Network Access).

For production, use a managed MongoDB (e.g. Atlas) and set `MONGODB_URI` to the `srv://`
connection string. The only schema changes needed are handled by Mongoose models.

## 📚 API Documentation

Base URL: `http://localhost:5000/api` · Auth: `Authorization: Bearer <token>`

### Auth

| Method | Endpoint            | Description                | Auth |
| ------ | ------------------- | -------------------------- | ---- |
| POST   | `/auth/register`    | Create an account          | —    |
| POST   | `/auth/login`       | Login, returns JWT         | —    |
| GET    | `/auth/me`          | Current user               | ✅   |

### Transactions

| Method | Endpoint             | Description                              | Auth |
| ------ | -------------------- | ---------------------------------------- | ---- |
| GET    | `/transactions`      | List (query: `search`, `type`, `category`, `from`, `to`, `sort`, `limit`) | ✅ |
| POST   | `/transactions`      | Create                                   | ✅   |
| GET    | `/transactions/:id`  | Get one                                  | ✅   |
| PUT    | `/transactions/:id`  | Update (partial)                         | ✅   |
| DELETE | `/transactions/:id`  | Delete                                   | ✅   |

`sort` values: `newest`, `oldest`, `amount_desc`, `amount_asc`.

### Analytics

| Method | Endpoint                    | Description                                                      | Auth |
| ------ | --------------------------- | ---------------------------------------------------------------- | ---- |
| GET    | `/analytics/summary`        | Totals, savings, changes, top category, largest expense (`range`) | ✅  |
| GET    | `/analytics/monthly`        | Monthly income/expenses (`months=6` or `range`)                  | ✅   |
| GET    | `/analytics/categories`     | Expense totals per category (`range`)                            | ✅   |

`range` values: `thisMonth`, `lastMonth`, `last3Months`, `thisYear`, `all`.

### Users

| Method | Endpoint            | Description                     | Auth |
| ------ | ------------------- | ------------------------------- | ---- |
| GET    | `/users/profile`    | Get profile                     | ✅   |
| PUT    | `/users/profile`    | Update name / email             | ✅   |
| PUT    | `/users/password`   | Change password                 | ✅   |
| DELETE | `/users/account`    | Delete account + all data       | ✅   |

**Example — create a transaction**

```bash
curl -X POST http://localhost:5000/api/transactions \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"description":"Lunch","amount":450,"type":"expense","category":"Food","date":"2026-08-10","paymentMethod":"UPI"}'
```

## 👤 Demo Credentials

After running `npm run seed`:

```
Email:    demo@spendly.app
Password: demo1234
```

The seed creates ~6 months of realistic transactions (salary, rent, groceries, subscriptions,
travel, freelance income, etc.) so every page and chart is populated immediately.

## 🔒 Security Notes

- Passwords are hashed with **bcrypt** (cost 10) before storage.
- JWTs are stored in `localStorage` on the client — acceptable for this project's scope, but
  note that `httpOnly` cookies offer stronger XSS protection for production apps.
- All transaction/profile routes validate ownership server-side.
- Inputs are validated with middleware and MongoDB schemas; the central error handler never
  leaks stack traces or internal details.

## 🧭 Future Improvements

- Pagination and monthly-budget tracking per category
- Recurring transaction automation
- Multi-currency support (currency per user, configurable formatting)
- PDF/Excel export in addition to CSV
- `httpOnly` cookie sessions and CSRF protection
- Unit and integration tests (Vitest + Supertest)

---

Built with a deliberately simple stack — React, Vite, Express, MongoDB. No magic, just clean code.
