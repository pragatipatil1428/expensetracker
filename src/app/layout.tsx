import type { Metadata, Viewport } from "next";
import { ThemeProvider } from "next-themes";
import { Toaster } from "sonner";

import { QueryProvider } from "@/components/providers/query-provider";
import "./globals.css";

const APP_URL = process.env.AUTH_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: "FinTrack — Personal Finance & Expense Tracker",
    template: "%s · FinTrack",
  },
  description:
    "FinTrack is a modern personal finance and expense tracker. Track income and expenses, set budgets, manage recurring bills and understand your spending with beautiful analytics.",
  keywords: [
    "personal finance",
    "expense tracker",
    "budget",
    "savings",
    "income",
    "financial analytics",
  ],
  openGraph: {
    type: "website",
    locale: "en_US",
    url: APP_URL,
    siteName: "FinTrack",
    title: "FinTrack — Personal Finance & Expense Tracker",
    description:
      "Track income and expenses, set budgets, manage recurring bills and understand your spending with beautiful analytics.",
  },
  twitter: {
    card: "summary_large_image",
    title: "FinTrack — Personal Finance & Expense Tracker",
    description:
      "Track income and expenses, set budgets, manage recurring bills and understand your spending with beautiful analytics.",
  },
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#09090b" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-dvh bg-background font-sans text-foreground antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <QueryProvider>{children}</QueryProvider>
          <Toaster
            position="top-right"
            richColors
            closeButton
            toastOptions={{ style: { borderRadius: "0.75rem" } }}
          />
        </ThemeProvider>
      </body>
    </html>
  );
}
