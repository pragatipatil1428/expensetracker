import Link from "next/link";
import { LineChart, PiggyBank, ShieldCheck, Wallet } from "lucide-react";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      {/* Brand panel */}
      <div className="relative hidden overflow-hidden bg-zinc-950 lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div
          className="absolute inset-0 opacity-60"
          style={{
            background:
              "radial-gradient(60rem 40rem at 15% -10%, rgba(99,102,241,0.45), transparent 55%), radial-gradient(50rem 35rem at 90% 110%, rgba(14,165,233,0.35), transparent 55%)",
          }}
          aria-hidden
        />
        <div className="bg-grid absolute inset-0 opacity-[0.07]" aria-hidden />

        <Link href="/" className="relative flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/30">
            <PiggyBank className="h-5 w-5" aria-hidden />
          </span>
          <span className="text-lg font-bold tracking-tight text-white">FinTrack</span>
        </Link>

        <div className="relative space-y-8">
          <blockquote className="max-w-md">
            <p className="text-2xl font-semibold leading-snug tracking-tight text-white">
              “I finally understand where my money goes every month.”
            </p>
            <footer className="mt-3 text-sm text-zinc-400">
              — Priya S., FinTrack user since 2025
            </footer>
          </blockquote>

          <div className="grid max-w-md gap-3">
            {[
              { icon: Wallet, title: "Track everything", text: "Income, expenses, budgets and recurring bills in one place." },
              { icon: LineChart, title: "Understand your money", text: "Beautiful charts and monthly summaries that actually make sense." },
              { icon: ShieldCheck, title: "Private by design", text: "Your financial data belongs to you. Secured sessions and ownership checks on every operation." },
            ].map(({ icon: Icon, title, text }) => (
              <div
                key={title}
                className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/10">
                  <Icon className="h-4.5 w-4.5 text-indigo-300" aria-hidden />
                </span>
                <div>
                  <p className="text-sm font-semibold text-white">{title}</p>
                  <p className="mt-0.5 text-sm text-zinc-400">{text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="relative text-xs text-zinc-500">
          © {new Date().getFullYear()} FinTrack — Personal finance, made simple.
        </p>
      </div>

      {/* Form panel */}
      <div className="flex flex-col items-center justify-center bg-background px-4 py-12 sm:px-8">
        <div className="w-full max-w-sm">
          <div className="mb-8 lg:hidden">
            <Link href="/" className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                <PiggyBank className="h-5 w-5" aria-hidden />
              </span>
              <span className="text-lg font-bold tracking-tight">FinTrack</span>
            </Link>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
