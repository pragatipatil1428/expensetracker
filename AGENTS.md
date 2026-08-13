# Spendly — Personal Expense Tracker

A simple, professional personal expense tracker built as a portfolio project on a deliberately
simple stack: plain JavaScript everywhere.

## Layout

- Frontend: React + Vite (JavaScript, no TypeScript) at the repo root — `src/`
- Backend: Node.js + Express (JavaScript, ESM) in `server/`
- Database: MongoDB via Mongoose, run locally with Docker Compose

## Commands

- `npm run dev:all` — run backend + frontend together (server :5000, client :5173)
- `npm run dev` — frontend only (Vite; `/api` is proxied to :5000)
- `npm run dev:server` — backend only
- `npm run seed` — seed realistic demo data (creates the demo user)
- `npm run build` — production build of the frontend (outputs `dist/`)

## Conventions

- Plain JavaScript (ESM). No TypeScript, no Redux/Zustand — React Context + local state only.
- REST API under `/api`. JWT auth via `Authorization: Bearer <token>` header.
- Backend structure: `server/{controllers,models,routes,middleware,services,utils,config}/`.
- Errors flow through the central error middleware in `server/middleware/error.js`.
- Theming uses CSS custom properties and a `data-theme` attribute on `<html>`,
  persisted in localStorage (`spendly-theme`). Never hardcode theme colors in JSX.
- Chart.js is registered once in `src/utils/charts.js`.
- Currency is INR (₹), formatted via `src/utils/format.js`.
