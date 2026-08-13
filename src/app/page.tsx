import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  Bell,
  CreditCard,
  LineChart,
  PiggyBank,
  Repeat,
  ShieldCheck,
  Sparkles,
  Target,
  Wallet,
} from "lucide-react";

import { Button } from "@/components/ui/button";

const FEATURES = [
  {
    icon: Wallet,
    title: "Track income & expenses",
    text: "Log transactions in seconds with categories, tags, payment methods and accounts.",
  },
  {
    icon: Target,
    title: "Budgets that keep you honest",
    text: "Set monthly and category budgets. Get warned at 80% and alerted when you exceed them.",
  },
  {
    icon: Repeat,
    title: "Recurring bills handled",
    text: "Salary, rent, subscriptions and EMIs — FinTrack schedules them and reminds you when they're due.",
  },
  {
    icon: BarChart3,
    title: "Analytics that clarify",
    text: "Spending trends, category breakdowns and savings rates, from 7 days to a full year.",
  },
  {
    icon: Bell,
    title: "Smart notifications",
    text: "Budget alerts, upcoming payments and a beautiful monthly financial summary.",
  },
  {
    icon: ShieldCheck,
    title: "Private & secure",
    text: "Hashed passwords, protected routes and strict ownership checks. Your data stays yours.",
  },
];

const STATS = [
  { value: "100%", label: "Your data, private" },
  { value: "5", label: "Chart periods" },
  { value: "6+", label: "Payment methods" },
  { value: "4", label: "Currencies" },
];

export default function Home() {
  return (
    <div className="min-h-dvh bg-background text-foreground">
      {/* Nav */}
      <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/30">
              <PiggyBank className="h-5 w-5" aria-hidden />
            </span>
            <span className="text-lg font-bold tracking-tight">FinTrack</span>
          </Link>
          <nav className="hidden items-center gap-6 text-sm font-medium text-muted-foreground sm:flex">
            <a href="#features" className="transition-colors hover:text-foreground">
              Features
            </a>
            <a href="#how" className="transition-colors hover:text-foreground">
              How it works
            </a>
          </nav>
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm">
              <Link href="/login">Sign in</Link>
            </Button>
            <Button asChild size="sm">
              <Link href="/register">Get started</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(55rem 32rem at 50% -12%, hsl(var(--primary) / 0.14), transparent 60%)",
          }}
          aria-hidden
        />
        <div className="bg-grid mask-fade-b absolute inset-0 opacity-[0.05]" aria-hidden />
        <div className="relative mx-auto max-w-6xl px-4 pb-20 pt-20 text-center sm:px-6 sm:pt-28">
          <div className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border bg-muted/60 px-3.5 py-1.5 text-xs font-medium">
            <Sparkles className="h-3.5 w-3.5 text-primary" aria-hidden />
            Personal finance, made beautifully simple
          </div>
          <h1 className="text-balance mx-auto max-w-3xl text-4xl font-bold tracking-tight sm:text-6xl">
            Know exactly where your{" "}
            <span className="bg-gradient-to-r from-indigo-500 via-violet-500 to-sky-500 bg-clip-text text-transparent">
              money goes
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-pretty text-base text-muted-foreground sm:text-lg">
            FinTrack helps you track income and expenses, set budgets, manage recurring
            bills and grow your savings — with a clean dashboard, sharp analytics and
            monthly summaries you&apos;ll actually read.
          </p>
          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button asChild size="lg" className="w-full sm:w-auto">
              <Link href="/register">
                Start tracking free
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="w-full sm:w-auto">
              <Link href="/login">Try the live demo</Link>
            </Button>
          </div>

          {/* Dashboard preview */}
          <div className="relative mx-auto mt-16 max-w-4xl">
            <div className="overflow-hidden rounded-2xl border bg-card shadow-2xl">
              <div className="flex items-center gap-1.5 border-b bg-muted/40 px-4 py-3">
                <span className="h-3 w-3 rounded-full bg-rose-400" />
                <span className="h-3 w-3 rounded-full bg-amber-400" />
                <span className="h-3 w-3 rounded-full bg-emerald-400" />
                <span className="ml-3 rounded-md bg-muted px-2.5 py-1 text-xs text-muted-foreground">
                  app.fintrack.app/dashboard
                </span>
              </div>
              <div className="grid gap-3 p-5 sm:grid-cols-4">
                {[
                  { label: "Current balance", value: "₹1,84,250", trend: "+12.4%" },
                  { label: "Income (Aug)", value: "₹85,000", trend: "+2.1%" },
                  { label: "Expenses (Aug)", value: "₹42,500", trend: "-8.4%" },
                  { label: "Savings rate", value: "50.0%", trend: "+6.2%" },
                ].map((s) => (
                  <div key={s.label} className="rounded-xl border bg-card p-4 text-left">
                    <p className="text-xs text-muted-foreground">{s.label}</p>
                    <p className="mt-1.5 text-lg font-bold tabular-nums">{s.value}</p>
                    <p className="mt-0.5 text-xs font-medium text-emerald-500">{s.trend}</p>
                  </div>
                ))}
              </div>
              <div className="grid gap-3 p-5 pt-0 sm:grid-cols-5">
                <div className="col-span-3 flex h-40 items-end gap-2 rounded-xl border p-4">
                  {[38, 55, 42, 64, 48, 72, 58, 82, 66, 90, 74, 96].map((h, i) => (
                    <div
                      key={i}
                      className="flex-1 rounded-t-md bg-gradient-to-t from-primary/80 to-primary/40"
                      style={{ height: `${h}%` }}
                    />
                  ))}
                </div>
                <div className="col-span-2 flex flex-col justify-between gap-2 rounded-xl border p-4">
                  <div className="space-y-2">
                    {[
                      { name: "Food", pct: 42, color: "#f97316" },
                      { name: "Rent", pct: 30, color: "#8b5cf6" },
                      { name: "Shopping", pct: 18, color: "#06b6d4" },
                      { name: "Travel", pct: 10, color: "#10b981" },
                    ].map((c) => (
                      <div key={c.name}>
                        <div className="mb-1 flex justify-between text-xs">
                          <span className="text-muted-foreground">{c.name}</span>
                          <span className="tabular-nums">{c.pct}%</span>
                        </div>
                        <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                          <div
                            className="h-full rounded-full"
                            style={{ width: `${c.pct}%`, backgroundColor: c.color }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <div
              className="absolute -inset-4 -z-10 rounded-[2rem] bg-gradient-to-r from-indigo-500/20 via-violet-500/15 to-sky-500/20 blur-2xl"
              aria-hidden
            />
          </div>
        </div>
      </section>

      {/* Stats strip */}
      <section className="border-y bg-muted/40">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-6 px-4 py-10 sm:px-6 md:grid-cols-4">
          {STATS.map((s) => (
            <div key={s.label} className="text-center">
              <p className="text-2xl font-bold tracking-tight sm:text-3xl">{s.value}</p>
              <p className="mt-1 text-sm text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-balance text-3xl font-bold tracking-tight sm:text-4xl">
            Everything you need to take control
          </h2>
          <p className="mt-4 text-muted-foreground">
            Built for real life — salaries, UPI payments, rent, subscriptions and the
            occasional weekend splurge.
          </p>
        </div>
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(({ icon: Icon, title, text }) => (
            <div
              key={title}
              className="group rounded-2xl border bg-card p-6 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                <Icon className="h-5 w-5" aria-hidden />
              </span>
              <h3 className="mt-4 text-base font-semibold">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="border-t bg-muted/40">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-balance text-3xl font-bold tracking-tight sm:text-4xl">
              Up and running in three steps
            </h2>
          </div>
          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {[
              {
                step: "01",
                icon: CreditCard,
                title: "Create your account",
                text: "Sign up in seconds with just an email and password. Categories are pre-configured.",
              },
              {
                step: "02",
                icon: LineChart,
                title: "Log your money",
                text: "Add transactions, set budgets and schedule recurring bills. Everything syncs instantly.",
              },
              {
                step: "03",
                icon: PiggyBank,
                title: "Grow your savings",
                text: "Read your monthly summary, spot leaks and watch your savings rate climb.",
              },
            ].map(({ step, icon: Icon, title, text }) => (
              <div key={step} className="relative rounded-2xl border bg-card p-6">
                <p className="text-4xl font-bold tracking-tight text-primary/15">{step}</p>
                <span className="mt-3 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" aria-hidden />
                </span>
                <h3 className="mt-4 text-base font-semibold">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <div className="relative overflow-hidden rounded-3xl bg-zinc-950 px-6 py-16 text-center sm:px-12">
          <div
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(40rem 22rem at 50% 120%, hsl(var(--primary) / 0.4), transparent 60%)",
            }}
            aria-hidden
          />
          <h2 className="text-balance relative text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Your money deserves a dashboard
          </h2>
          <p className="relative mx-auto mt-4 max-w-md text-zinc-400">
            Join FinTrack today and get your first monthly financial summary — free, forever.
          </p>
          <div className="relative mt-8">
            <Button asChild size="lg" className="bg-white text-zinc-950 hover:bg-white/90">
              <Link href="/register">
                Create your free account
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-8 text-sm text-muted-foreground sm:flex-row sm:px-6">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <PiggyBank className="h-4 w-4" aria-hidden />
            </span>
            <span className="font-semibold text-foreground">FinTrack</span>
          </div>
          <p>© {new Date().getFullYear()} FinTrack. Personal finance, made simple.</p>
          <div className="flex gap-4">
            <Link href="/login" className="transition-colors hover:text-foreground">
              Sign in
            </Link>
            <Link href="/register" className="transition-colors hover:text-foreground">
              Sign up
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
